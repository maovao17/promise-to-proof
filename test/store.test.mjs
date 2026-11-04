// P2P-STORE-001 v1: local persistence and recovery checks with synthetic cases.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CaseStore } from '../src/store.mjs';

const storeURL = new URL('../src/store.mjs', import.meta.url).href;
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const runtime = join(projectRoot, 'runtime');
const scope = (id, expectedVersion = 0, value = 'Synthetic CSV preview') => ({
  id, type: 'scope', actor: 'coordinator', expectedVersion,
  scope: value, criteria: ['Preview before save'],
});

function database(t) {
  mkdirSync(runtime, { recursive: true });
  const dir = mkdtempSync(join(runtime, 'test-P2P-STORE-001-v1-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return join(dir, 'cases.sqlite');
}

function diskImage(path) {
  return [path, `${path}-wal`].map(file => {
    if (!existsSync(file)) return null;
    const { ino, size, mtimeNs, ctimeNs } = statSync(file, { bigint: true });
    return { ino, size, mtimeNs, ctimeNs, bytes: readFileSync(file) };
  });
}

function childRun(code, path, ...args) {
  return spawnSync(process.execPath, ['--input-type=module', '-e', code, path, ...args], {
    cwd: projectRoot, encoding: 'utf8',
    env: { ...process.env, P2P_STORE_URL: storeURL },
    timeout: 10_000,
  });
}

test('P2P-STORE-001 v1: state and full events survive a fresh process', t => {
  const path = database(t);
  const first = scope('scope-1');
  const second = { id: 'approve-1', type: 'approve', actor: 'founder', version: 1 };
  const store = new CaseStore(path);
  store.create('SYN-RESTART', 'Synthetic booking import');
  store.append('SYN-RESTART', first);
  store.append('SYN-RESTART', second);
  const expected = store.get('SYN-RESTART');
  store.close();

  const child = childRun(`
    const { CaseStore } = await import(process.env.P2P_STORE_URL);
    const store = new CaseStore(process.argv[1]);
    process.stdout.write(JSON.stringify({ state: store.get('SYN-RESTART'), events: store.events('SYN-RESTART') }));
    store.close();
  `, path);
  assert.equal(child.status, 0, child.stderr);
  const loaded = JSON.parse(child.stdout);
  assert.deepEqual(loaded.state, expected);
  assert.deepEqual(loaded.events, [first, second]);
});

test('P2P-STORE-001 v1: replay is idempotent and conflicting ID writes nothing', t => {
  const path = database(t);
  const store = new CaseStore(path);
  const event = scope('scope-1');
  store.create('SYN-REPLAY', 'Synthetic request');
  store.append('SYN-REPLAY', event);
  const state = store.get('SYN-REPLAY');
  const disk = diskImage(path);

  store.append('SYN-REPLAY', event);
  assert.deepEqual(store.get('SYN-REPLAY'), state);
  assert.deepEqual(store.events('SYN-REPLAY'), [event]);
  assert.deepEqual(diskImage(path), disk);

  assert.throws(() => store.append('SYN-REPLAY', scope('scope-1', 0, 'Changed scope')), /reused with different content/);
  assert.deepEqual(store.get('SYN-REPLAY'), state);
  assert.deepEqual(store.events('SYN-REPLAY'), [event]);
  assert.deepEqual(diskImage(path), disk);
  store.close();
});

function concurrentWriter(path, event) {
  const code = `
    const { CaseStore } = await import(process.env.P2P_STORE_URL);
    const store = new CaseStore(process.argv[1]);
    process.send('ready');
    process.once('message', () => {
      let result;
      try { store.append('SYN-RACE', JSON.parse(process.argv[2])); result = { ok: true }; }
      catch (error) { result = { ok: false, error: error.message }; }
      store.close();
      process.send(result, () => process.exit(0));
    });
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', code, path, JSON.stringify(event)], {
    cwd: projectRoot, stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    env: { ...process.env, P2P_STORE_URL: storeURL },
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr += chunk; });
  let readyResolve, readyReject, resultResolve, resultReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const result = new Promise((resolve, reject) => { resultResolve = resolve; resultReject = reject; });
  child.on('message', message => message === 'ready' ? readyResolve() : resultResolve(message));
  child.on('error', error => { readyReject(error); resultReject(error); });
  child.on('exit', code => {
    if (code !== 0) {
      const error = new Error(`Writer exited ${code}: ${stderr}`);
      readyReject(error); resultReject(error);
    }
  });
  return { child, ready, result };
}

test('P2P-STORE-001 v1: concurrent processes serialize stale scope edits', { timeout: 15_000 }, async t => {
  const path = database(t);
  const store = new CaseStore(path);
  store.create('SYN-RACE', 'Synthetic request');
  store.close();

  const first = concurrentWriter(path, scope('scope-a', 0, 'First scope'));
  const second = concurrentWriter(path, scope('scope-b', 0, 'Second scope'));
  t.after(() => { first.child.kill(); second.child.kill(); });
  await Promise.all([first.ready, second.ready]);
  first.child.send('go');
  second.child.send('go');
  const results = await Promise.all([first.result, second.result]);
  assert.equal(results.filter(x => x.ok).length, 1, JSON.stringify(results));
  assert.match(results.find(x => !x.ok).error, /Scope edit conflict/);

  const reopened = new CaseStore(path);
  assert.equal(reopened.get('SYN-RACE').version, 1);
  assert.equal(reopened.events('SYN-RACE').length, 1);
  reopened.close();
});

test('P2P-STORE-001 v1: SIGKILL during pre-commit write rolls back on reopen', { timeout: 15_000 }, async t => {
  const path = database(t);
  const store = new CaseStore(path);
  store.create('SYN-CRASH', 'Synthetic request');
  const before = store.get('SYN-CRASH');
  store.close();

  const crash = spawn(process.execPath, ['--input-type=module', '-e', `
    import { writeSync } from 'node:fs';
    const { CaseStore } = await import(process.env.P2P_STORE_URL);
    const store = new CaseStore(process.argv[1], { beforeCommit: () => {
      writeSync(1, 'before-commit\\n');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
    } });
    store.append('SYN-CRASH', JSON.parse(process.argv[2]));
  `, path, JSON.stringify(scope('interrupted'))], {
    cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, P2P_STORE_URL: storeURL },
  });
  t.after(() => crash.kill('SIGKILL'));
  let stderr = '';
  crash.stderr.setEncoding('utf8');
  crash.stderr.on('data', chunk => { stderr += chunk; });
  crash.stdout.setEncoding('utf8');
  const ready = new Promise((resolve, reject) => {
    crash.stdout.once('data', text => text === 'before-commit\n' ? resolve() : reject(new Error(`Unexpected child output: ${text}`)));
    crash.once('error', reject);
    crash.once('exit', code => reject(new Error(`Child exited ${code} before commit hook: ${stderr}`)));
  });
  const close = new Promise(resolve => crash.once('close', (code, signal) => resolve({ code, signal })));
  await ready;
  assert.equal(crash.kill('SIGKILL'), true);
  assert.deepEqual(await close, { code: null, signal: 'SIGKILL' });

  const reopened = new CaseStore(path);
  assert.deepEqual(reopened.get('SYN-CRASH'), before);
  assert.deepEqual(reopened.events('SYN-CRASH'), []);
  reopened.append('SYN-CRASH', scope('after-recovery'));
  assert.equal(reopened.get('SYN-CRASH').version, 1);
  reopened.close();
});

test('P2P-STORE-001 v1: core-rejected events leave persisted data unchanged', t => {
  const path = database(t);
  const store = new CaseStore(path);
  const event = scope('scope-1');
  store.create('SYN-REJECT', 'Synthetic request');
  store.append('SYN-REJECT', event);
  const before = store.get('SYN-REJECT');
  const disk = diskImage(path);

  const rejected = [
    [{ id: 'bad-actor', type: 'approve', actor: 'builder', version: 1 }, /Unauthorized role/],
    [{ id: 'early-start', type: 'start', actor: 'builder', version: 1 }, /Invalid transition/],
    [scope('stale-scope', 0), /Scope edit conflict/],
  ];
  for (const [attempt, reason] of rejected) {
    assert.throws(() => store.append('SYN-REJECT', attempt), reason);
    assert.deepEqual(store.get('SYN-REJECT'), before);
    assert.deepEqual(store.events('SYN-REJECT'), [event]);
    assert.deepEqual(diskImage(path), disk);
  }
  store.close();
});
