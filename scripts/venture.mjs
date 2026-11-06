import { readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { openVenture, proofPack } from '../src/venture.mjs';

const [command, role, id, input] = process.argv.slice(2);
let store;
try {
  const database = process.env.VENTURE_DB;
  if (!database || !isAbsolute(database)) throw new Error('Set VENTURE_DB to a shared absolute path');
  if (!['founder', 'coordinator', 'builder', 'reviewer'].includes(role)) throw new Error('Unknown role');
  store = openVenture(database);
  const hashFile = path => {
    const root = realpathSync(process.cwd());
    const file = realpathSync(resolve(root, path));
    const name = relative(root, file);
    if (name.startsWith('../') || name === '..' || isAbsolute(name)) throw new Error('Artifact outside checkout');
    return createHash('sha256').update(readFileSync(file)).digest('hex');
  };
  const verifyArtifacts = submission => {
    if (!submission || submission.artifacts.some(item => hashFile(item.path) !== item.sha256)) {
      throw new Error('Submitted artifact bytes do not match this checkout');
    }
  };
  let output;
  if (command === 'create' && role === 'coordinator') {
    output = store.create(id, readFileSync(input, 'utf8').trim());
  } else {
    const project = store.get(id);
    if (!project) throw new Error('Project not found');
    if (command === 'show') output = project;
    else if (command === 'proof') {
      for (const task of project.tasks.filter(item => item.status === 'verified')) verifyArtifacts(task.submission);
      output = proofPack(project, store.events(id));
    }
    else if (command === 'act') {
      const event = JSON.parse(readFileSync(input ?? 0, 'utf8'));
      if (Object.hasOwn(event, 'actor')) throw new Error('Actor comes from the local role');
      if (event.type === 'submit') event.artifacts = event.paths.map(path => ({ path, sha256: hashFile(path) }));
      if (event.type === 'review' && event.passed) {
        const task = project.tasks.find(item => item.id === event.taskId);
        verifyArtifacts(task?.submission);
      }
      if (event.type === 'complete') {
        for (const task of project.tasks) verifyArtifacts(task.submission);
      }
      output = store.append(id, { ...event, actor: role });
    } else throw new Error('Unknown command');
  }
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  store?.close();
}
