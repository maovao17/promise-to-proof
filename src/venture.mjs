import { createHash } from 'node:crypto';
import { CaseStore } from './store.mjs';

export const capabilities = ['product', 'research', 'engineering', 'operations', 'growth'];
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};
const nonempty = value => typeof value === 'string' && Boolean(value.trim());
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function createProject(id, goal) {
  requireValue(nonempty(id) && nonempty(goal), 'Project ID and goal required');
  return { id, goal, version: 0, status: 'draft', brief: null, tasks: [], decisions: [], events: [] };
}

function validatePlan(brief, tasks, previous) {
  for (const key of ['title', 'audience', 'scope']) requireValue(nonempty(brief?.[key]), 'Brief requires ' + key);
  for (const key of ['constraints', 'assumptions', 'successCriteria', 'artifacts', 'risks', 'decisionsNeeded']) {
    requireValue(Array.isArray(brief[key]) && brief[key].every(nonempty), 'Brief requires list ' + key);
  }
  requireValue(Array.isArray(tasks) && tasks.length > 0, 'Tasks required');
  const seen = new Set(previous.map(task => task.id));
  return tasks.map(task => {
    requireValue(nonempty(task.id) && !seen.has(task.id), 'Task ID must be unique');
    requireValue(capabilities.includes(task.capability) && nonempty(task.title), 'Task needs a title and capability');
    requireValue(Array.isArray(task.dependencies) && task.dependencies.every(id => seen.has(id)), 'Dependencies must precede their task');
    for (const key of ['criteria', 'expectedArtifacts', 'requiredEvidence']) {
      requireValue(Array.isArray(task[key]) && task[key].length > 0 && task[key].every(nonempty), 'Task requires ' + key);
    }
    seen.add(task.id);
    return { id: task.id, title: task.title, capability: task.capability, priority: task.priority ?? 'P0',
      dependencies: task.dependencies, criteria: task.criteria, expectedArtifacts: task.expectedArtifacts,
      requiredEvidence: task.requiredEvidence, owner: 'builder', status: 'ready', reviews: [], submission: null };
  });
}

function reduceProject(current, event) {
  requireValue(nonempty(event.id), 'Event ID required');
  const hash = digest(event);
  const prior = current.events.find(item => item.id === event.id);
  if (prior) {
    requireValue(prior.hash === hash, 'Event ID reused with different content');
    return current;
  }
  requireValue(event.version === current.version, 'Stale plan version');
  const project = structuredClone(current);
  const role = expected => requireValue(event.actor === expected, 'Wrong role');
  const task = project.tasks.find(item => item.id === event.taskId);
  const requireTask = status => requireValue(task?.status === status, 'Invalid task state');
  const decision = () => {
    requireValue(nonempty(event.reference), 'Human decision reference required');
    project.decisions.push({ version: project.version, action: event.type, reference: event.reference });
  };

  switch (event.type) {
    case 'plan': {
      role('coordinator');
      requireValue(['draft', 'rejected', 'completed'].includes(project.status), 'Project cannot be planned in this state');
      const previous = project.status === 'completed' || project.status === 'rejected'
        ? project.tasks.filter(item => item.status === 'verified') : [];
      project.tasks = [...previous, ...validatePlan(event.brief, event.tasks, previous)];
      project.brief = event.brief;
      project.version++;
      project.status = 'awaiting_approval';
      break;
    }
    case 'approve':
      role('founder');
      requireValue(project.status === 'awaiting_approval', 'No plan awaiting approval');
      decision();
      project.status = 'active';
      break;
    case 'reject':
      role('founder');
      requireValue(['awaiting_approval', 'verified', 'blocked'].includes(project.status), 'No decision pending');
      decision();
      project.status = 'rejected';
      break;
    case 'start':
      role('builder');
      requireValue(project.status === 'active', 'Approved active plan required');
      requireTask('ready');
      requireValue(task.dependencies.every(id => project.tasks.find(item => item.id === id)?.status === 'verified'), 'Unverified dependency');
      task.status = 'in_progress';
      break;
    case 'submit':
      role('builder');
      requireValue(project.status === 'active', 'Active plan required');
      requireTask('in_progress');
      requireValue(Array.isArray(event.artifacts) && event.artifacts.length > 0 &&
        event.artifacts.every(item => nonempty(item.path) && /^[a-f0-9]{64}$/.test(item.sha256)), 'Hashed artifacts required');
      requireValue(task.expectedArtifacts.every(path => event.artifacts.some(item => item.path === path)), 'Expected artifact missing');
      task.submission = { id: event.id, artifacts: event.artifacts, commit: event.commit ?? null };
      task.status = 'in_review';
      task.owner = 'reviewer';
      break;
    case 'review': {
      role('reviewer');
      requireValue(project.status === 'active', 'Active plan required');
      requireTask('in_review');
      requireValue(event.submissionId === task.submission.id, 'Stale submission');
      requireValue(typeof event.passed === 'boolean' && nonempty(event.evidence), 'Review result and evidence required');
      requireValue(event.passed || nonempty(event.finding), 'Failed review requires an actionable finding');
      task.reviews.push({ submission: task.submission, passed: event.passed, evidence: event.evidence, finding: event.finding ?? null });
      const failures = task.reviews.filter(review => !review.passed).length;
      task.status = event.passed ? 'verified' : failures >= 3 ? 'blocked' : 'in_progress';
      task.owner = event.passed ? 'coordinator' : task.status === 'blocked' ? 'founder' : 'builder';
      if (task.status === 'blocked') project.status = 'blocked';
      if (project.tasks.every(item => item.status === 'verified')) project.status = 'verified';
      break;
    }
    case 'complete':
      role('founder');
      requireValue(project.status === 'verified', 'All tasks need independent verification');
      decision();
      project.status = 'completed';
      break;
    default:
      throw new Error('Unknown project action');
  }
  project.events.push({ id: event.id, hash, type: event.type, actor: event.actor, version: project.version, taskId: event.taskId ?? null });
  return project;
}

export function openVenture(path) {
  return new CaseStore(path, { create: createProject, reduce: reduceProject });
}

export function proofPack(project, events) {
  return {
    id: project.id, goal: project.goal, status: project.status, version: project.version,
    brief: project.brief,
    plans: events.filter(event => event.type === 'plan').map(event => ({ version: event.version + 1, brief: event.brief })),
    decisions: project.decisions, history: events.map(({ type, id, actor, taskId, version }) => ({ type, id, actor, taskId, version })),
    tasks: project.tasks,
    unresolved: project.tasks.filter(task => task.status !== 'verified').map(task => ({
      id: task.id, status: task.status, finding: task.reviews.at(-1)?.finding ?? null
    })),
    nextAction: {
      draft: 'Create a plan', awaiting_approval: 'Founder decision', active: 'Execute the next unblocked task',
      verified: 'Founder delivery review', completed: 'Propose the next milestone',
      blocked: 'Founder decides how to resolve the failed criteria', rejected: 'Revise the plan'
    }[project.status]
  };
}
