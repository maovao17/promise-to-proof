import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,applyEvent} from '../src/workflow.mjs';
const scope={id:'s1',type:'scope',actor:'coordinator',expectedVersion:0,scope:'CSV import',criteria:['Preview before save']};
function fixture() {
  let c=createCase('C1','Import bookings');
  const send=(e)=>c=applyEvent(c,e);
  send(scope);
  send({id:'a1',type:'approve',actor:'founder',version:1});
  send({id:'b1',type:'start',actor:'builder',version:1});
  send({id:'p1',type:'submit',actor:'builder',version:1,commit:'commit-a'});
  return {get:()=>c,send};
}
test('complete path keeps release, notification and confirmation distinct',()=>{
  const f=fixture();
  f.send({id:'v1',type:'verify',actor:'reviewer',version:1,commit:'commit-a',passed:true,evidenceRef:'test.log'});
  f.send({id:'d1',type:'draft',actor:'coordinator',version:1,text:'CSV is available.'});
  f.send({id:'r1',type:'release',actor:'founder',version:1,releaseRef:'release-1'});
  assert.equal(f.get().status,'released');
  f.send({id:'n1',type:'notify',actor:'founder',version:1,approvedText:'CSV is available.',receipt:'message-1'});
  assert.equal(f.get().status,'notified');
  f.send({id:'c1',type:'confirm',actor:'coordinator',version:1,customerEvidence:'customer confirmation'});
  assert.equal(f.get().status,'confirmed');
});
test('scope change clears approval, evidence and draft, and rejects stale approval',()=>{
 const f=fixture();
 f.send({id:'v1',type:'verify',actor:'reviewer',version:1,commit:'commit-a',passed:true,evidenceRef:'test.log'});
 f.send({id:'d1',type:'draft',actor:'coordinator',version:1,text:'Old reply'});
 f.send({...scope,id:'s2',expectedVersion:1,scope:'CSV preview only'});
 for(const k of ['approval','evidence','draft','release','notification']) assert.equal(f.get()[k],null);
 assert.throws(()=>f.send({id:'a2',type:'approve',actor:'founder',version:1}),/Stale/);
 assert.equal(f.get().status,'proposed');
});
test('duplicate event is idempotent, conflicting reuse rejected',()=>{
 const a=applyEvent(createCase('C1','request'),scope);
 assert.deepEqual(applyEvent(a,scope),a);
 assert.throws(()=>applyEvent(a,{...scope,scope:'Different'}),/reused/);
});
test('unapproved implementation and wrong actor rejected',()=>{
 const c=applyEvent(createCase('C1','request'),scope);
 assert.throws(()=>applyEvent(c,{id:'b',type:'start',actor:'builder',version:1}),/Invalid transition/);
 assert.throws(()=>applyEvent(c,{id:'a',type:'approve',actor:'builder',version:1}),/Unauthorized/);
});
test('failed verification blocks release and two failures escalate',()=>{
 const f=fixture();
 f.send({id:'v1',type:'verify',actor:'reviewer',version:1,commit:'commit-a',passed:false,evidenceRef:'fail.log'});
 assert.throws(()=>f.send({id:'r',type:'release',actor:'founder',version:1,releaseRef:'release'}),/Invalid transition/);
 f.send({id:'p2',type:'submit',actor:'builder',version:1,commit:'commit-b'});
 f.send({id:'v2',type:'verify',actor:'reviewer',version:1,commit:'commit-b',passed:false,evidenceRef:'fail2.log'});
 assert.equal(f.get().status,'blocked');
});
test('verification must match current commit',()=>{
 const f=fixture();
 assert.throws(()=>f.send({id:'v',type:'verify',actor:'reviewer',version:1,commit:'old',passed:true,evidenceRef:'log'}),/mismatch/);
});
test('outbound notification must match exact draft',()=>{
 const f=fixture();
 f.send({id:'v',type:'verify',actor:'reviewer',version:1,commit:'commit-a',passed:true,evidenceRef:'log'});
 f.send({id:'d',type:'draft',actor:'coordinator',version:1,text:'CSV only'});
 f.send({id:'r',type:'release',actor:'founder',version:1,releaseRef:'rel'});
 assert.throws(()=>f.send({id:'n',type:'notify',actor:'founder',version:1,approvedText:'Excel too',receipt:'msg'}),/Exact/);
});
test('concurrent scope edit rejected and input left unchanged',()=>{
 const c=createCase('C1','request');
 const next=applyEvent(c,scope);
 assert.equal(c.version,0);
 assert.throws(()=>applyEvent(next,{...scope,id:'s2'}),/conflict/);
});
