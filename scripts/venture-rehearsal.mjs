import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.argv[2] ?? 'runtime/venture-rehearsal');
mkdirSync(output, { recursive: true });
const workspace = join(output, 'workspace');
mkdirSync(workspace, { recursive: true });
cpSync(join(root, 'examples'), join(workspace, 'examples'), { recursive: true });
const database = join(output, 'venture.sqlite');
const id = 'CRM-' + Date.now();
const cli = join(root, 'scripts/venture.mjs');
const plan = JSON.parse(readFileSync(join(root, 'examples/venture-crm/plan.json')));
const goal = join(output, 'goal.txt');
writeFileSync(goal, 'Help me start a service business with a simple CRM and launch plan.');
let sequence = 0;
function run(command, role, payload) {
  const args = [cli, command, role, id];
  if (command === 'create') args.push(goal);
  const result = spawnSync(process.execPath, args, {
    cwd: workspace, env: { ...process.env, VENTURE_DB: database }, encoding: 'utf8',
    input: payload && JSON.stringify(payload)
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
const act = (role, type, fields = {}) => run('act', role, {
  ...fields, id: 'event-' + ++sequence, version: type === 'plan' ? 0 : 1, type
});
run('create', 'coordinator');
act('coordinator', 'plan', plan);
act('founder', 'approve', { reference: 'OFFLINE founder fixture: approve CRM scope' });
const evidence = [];
const customerModule = join(workspace, 'examples/venture-crm/customers.mjs');
const fixed = readFileSync(customerModule, 'utf8');
const duplicateGuard = "  if (customers.some(customer => customer.email === email)) throw new Error('That email already exists.');\n";
assert.ok(fixed.includes(duplicateGuard));
const duplicateCheck = `
  import assert from 'node:assert/strict';
  import { addCustomer, searchCustomers, updateStatus } from './examples/venture-crm/customers.mjs';
  const list = addCustomer([], { name: 'Sample', email: 'demo@example.test' }, '1');
  assert.equal(searchCustomers(list, 'SAMPLE').length, 1);
  assert.equal(updateStatus(list, '1', 'Active')[0].status, 'Active');
  assert.throws(() => addCustomer(list, { name: 'Duplicate', email: 'DEMO@example.test' }, '2'), /already exists/);
  console.log('Create, search, status and duplicate checks passed');
`;
function checkCrm(label) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', duplicateCheck], { cwd: workspace, encoding: 'utf8' });
  evidence.push({ label, exit: result.status, output: (result.stdout + result.stderr).trim() });
  return result.status;
}
for (const task of plan.tasks) {
  const taskId = task.id;
  act('builder', 'start', { taskId });
  if (taskId === 'crm') {
    writeFileSync(customerModule, fixed.replace(duplicateGuard, ''));
    const initial = act('builder', 'submit', { taskId, paths: task.expectedArtifacts });
    const submissionId = initial.tasks.find(item => item.id === taskId).submission.id;
    assert.equal(checkCrm('Seeded duplicate validation defect'), 1);
    act('reviewer', 'review', {
      taskId, submissionId, passed: false,
      evidence: 'evidence.json: seeded duplicate validation defect, exit 1',
      finding: 'Reject a duplicate email even when its case differs'
    });
    writeFileSync(customerModule, fixed);
    assert.equal(checkCrm('Corrected CRM'), 0);
  }
  const submitted = act('builder', 'submit', { taskId, paths: task.expectedArtifacts });
  const submissionId = submitted.tasks.find(item => item.id === taskId).submission.id;
  for (const artifact of task.expectedArtifacts) assert.ok(readFileSync(join(workspace, artifact), 'utf8').trim());
  act('reviewer', 'review', {
    taskId, submissionId, passed: true, evidence: taskId === 'crm'
      ? 'evidence.json: corrected CRM command, exit 0'
      : 'OFFLINE artifact-presence and byte-integrity check; human qualitative review is separate'
  });
}
act('founder', 'complete', { reference: 'OFFLINE founder fixture: accept demonstration artifacts' });
const proof = run('proof', 'coordinator');
proof.mode = 'offline rehearsal with simulated role decisions and a seeded defect';
writeFileSync(join(output, 'proof-pack.json'), JSON.stringify(proof, null, 2) + '\n');
writeFileSync(join(output, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ mode: proof.mode, status: proof.status, tasks: proof.tasks.length, output }, null, 2));
