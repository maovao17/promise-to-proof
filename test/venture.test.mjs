import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openVenture, proofPack } from '../src/venture.mjs';
import { addCustomer, searchCustomers, updateStatus } from '../examples/venture-crm/customers.mjs';

const plan = JSON.parse(readFileSync(new URL('../examples/venture-crm/plan.json', import.meta.url)));
const artifact = path => ({ path, sha256: 'a'.repeat(64) });
function project(t) {
  const store = openVenture(':memory:');
  t.after(() => store.close());
  store.create('demo', 'Build a service CRM');
  const send = (actor, type, fields = {}) => store.append('demo', {
    id: String(store.events('demo').length + 1), version: store.get('demo').version, actor, type, ...fields
  });
  send('coordinator', 'plan', plan);
  return { store, send };
}
test('approval, dependencies, independent review, correction and continuation', t => {
  const { store, send } = project(t);
  assert.throws(() => send('builder', 'start', { taskId: 'product' }), /Approved/);
  assert.throws(() => send('builder', 'approve', { reference: 'fixture' }), /Wrong role/);
  send('founder', 'approve', { reference: 'offline approval fixture' });
  assert.throws(() => send('builder', 'start', { taskId: 'crm' }), /dependency/);
  for (const task of plan.tasks) {
    const taskId = task.id;
    send('builder', 'start', { taskId });
    const artifacts = task.expectedArtifacts.map(artifact);
    let submitted = send('builder', 'submit', { taskId, artifacts }).tasks.find(item => item.id === taskId).submission;
    if (taskId === 'crm') {
      send('reviewer', 'review', { taskId, submissionId: submitted.id, passed: false, evidence: 'synthetic fixture', finding: 'Reject duplicate emails' });
      const oldId = submitted.id;
      submitted = send('builder', 'submit', { taskId, artifacts }).tasks.find(item => item.id === taskId).submission;
      assert.throws(() => send('reviewer', 'review', { taskId, submissionId: oldId, passed: true, evidence: 'old' }), /Stale/);
    }
    assert.throws(() => send('builder', 'review', { taskId, submissionId: submitted.id, passed: true, evidence: 'self review' }), /Wrong role/);
    send('reviewer', 'review', { taskId, submissionId: submitted.id, passed: true, evidence: 'offline verification fixture' });
  }
  send('founder', 'complete', { reference: 'offline delivery fixture' });
  assert.equal(proofPack(store.get('demo'), store.events('demo')).status, 'completed');
  send('coordinator', 'plan', { brief: plan.brief, tasks: [{ ...plan.tasks[4], id: 'follow-up' }] });
  assert.equal(store.get('demo').version, 2);
  assert.equal(store.get('demo').tasks.filter(item => item.status === 'verified').length, 5);
  assert.throws(() => send('founder', 'approve', { version: 1, reference: 'stale' }), /Stale/);
});
test('founder rejection and two repair attempts', t => {
  const { store, send } = project(t);
  send('founder', 'reject', { reference: 'offline rejection fixture' });
  assert.throws(() => send('founder', 'approve', { reference: 'old plan' }), /No plan/);
  send('coordinator', 'plan', { brief: plan.brief, tasks: plan.tasks });
  send('founder', 'approve', { reference: 'revised fixture' });
  send('builder', 'start', { taskId: 'product' });
  for (let attempt = 0; attempt < 3; attempt++) {
    const p = send('builder', 'submit', { taskId: 'product', artifacts: plan.tasks[0].expectedArtifacts.map(artifact) });
    send('reviewer', 'review', { taskId: 'product', submissionId: p.tasks[0].submission.id, passed: false, evidence: 'fixture', finding: 'Missing criterion' });
  }
  assert.equal(store.get('demo').status, 'blocked');
  assert.throws(() => send('builder', 'submit', { taskId: 'product', artifacts: [] }), /Active/);
});
test('CRM creates, searches and updates contacts with validation', () => {
  const list = addCustomer([], { name: ' Example Lead ', email: 'LEAD@example.com' }, '1');
  assert.equal(searchCustomers(list, 'EXAMPLE').length, 1);
  assert.equal(searchCustomers(list, 'absent').length, 0);
  assert.equal(updateStatus(list, '1', 'Active')[0].status, 'Active');
  assert.equal(list[0].status, 'New');
  assert.throws(() => addCustomer(list, { name: 'Duplicate', email: 'lead@example.com' }, '2'), /already exists/);
  assert.throws(() => addCustomer(list, { name: ' ', email: 'new@example.com' }, '2'), /name/);
  assert.throws(() => addCustomer(list, { name: 'New', email: 'invalid' }, '2'), /email/);
  assert.throws(() => updateStatus(list, '1', 'unknown'), /Invalid/);
});
