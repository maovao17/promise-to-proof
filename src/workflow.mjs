// Offline domain core. Actor roles must come from a trusted adapter in production.
import { createHash } from 'node:crypto';
const requireThat = (ok, message) => { if (!ok) throw new Error(message); };
const fingerprint = e => createHash('sha256').update(JSON.stringify(e)).digest('hex');
export function createCase(id, request) {
  requireThat(typeof id === 'string' && id.trim() && typeof request === 'string' && request.trim(), 'Case and request required');
  return {id, request, version:0, status:'received', scope:null, approval:null,
    evidence:null, draft:null, release:null, notification:null, failures:0, events:[]};
}
export function applyEvent(current, event) {
  requireThat(event && typeof event.id === 'string' && event.id.trim(), 'Event ID required');
  const hash = fingerprint(event);
  const duplicate = current.events.find(e => e.id === event.id);
  if (duplicate) {
    requireThat(duplicate.hash === hash, 'Event ID reused with different content');
    return structuredClone(current);
  }
  const c = structuredClone(current);
  const role = expected => requireThat(event.actor === expected, 'Unauthorized role');
  const fresh = () => requireThat(event.version === c.version && c.version > 0, 'Stale scope version');
  const state = (...allowed) => requireThat(allowed.includes(c.status), 'Invalid transition');
  const text = value => requireThat(typeof value === 'string' && value.trim(), 'Nonempty text required');
  switch(event.type) {
    case 'scope':
      role('coordinator'); text(event.scope);
      requireThat(Number.isInteger(event.expectedVersion) && event.expectedVersion === c.version, 'Scope edit conflict');
      requireThat(Array.isArray(event.criteria) && event.criteria.length > 0 && event.criteria.every(x => typeof x === 'string' && x.trim()), 'Acceptance criteria required');
      c.version++; c.scope=event.scope; c.criteria=[...event.criteria]; c.status='proposed';
      c.commit=null; c.approval=null; c.evidence=null; c.draft=null; c.release=null; c.notification=null; c.failures=0;
      break;
    case 'approve':
      role('founder'); fresh(); state('proposed');
      c.approval={version:c.version,eventId:event.id}; c.status='approved'; break;
    case 'start':
      role('builder'); fresh(); state('approved');
      requireThat(c.approval?.version === c.version, 'Current approval required');
      c.status='building'; break;
    case 'submit':
      role('builder'); fresh(); state('building'); text(event.commit);
      c.commit=event.commit; c.status='review'; break;
    case 'verify':
      role('reviewer'); fresh(); state('review'); text(event.evidenceRef);
      requireThat(event.commit === c.commit, 'Evidence commit mismatch');
      requireThat(typeof event.passed === 'boolean', 'Boolean result required');
      c.evidence={version:c.version,commit:c.commit,ref:event.evidenceRef,passed:event.passed};
      if(event.passed) c.status='verified';
      else { c.failures++; c.status=c.failures >= 2 ? 'blocked' : 'building'; }
      break;
    case 'draft':
      role('coordinator'); fresh(); state('verified','released'); text(event.text);
      c.draft={version:c.version,text:event.text}; break;
    case 'release':
      role('founder'); fresh(); state('verified'); text(event.releaseRef);
      requireThat(c.evidence?.passed && c.evidence.version === c.version && c.evidence.commit === c.commit, 'Verified current commit required');
      c.release={version:c.version,ref:event.releaseRef}; c.status='released'; break;
    case 'notify':
      role('founder'); fresh(); state('released'); text(event.receipt);
      requireThat(c.draft?.version === c.version && event.approvedText === c.draft.text, 'Exact current draft approval required');
      c.notification={version:c.version,receipt:event.receipt}; c.status='notified'; break;
    case 'confirm':
      role('coordinator'); fresh(); state('notified'); text(event.customerEvidence);
      c.status='confirmed'; break;
    default: throw new Error('Unknown event type');
  }
  c.events.push({id:event.id,hash,type:event.type,version:c.version,actor:event.actor});
  return c;
}
