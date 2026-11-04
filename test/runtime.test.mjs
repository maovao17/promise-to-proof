import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CaseStore} from '../src/store.mjs';
import {loadRole,brief,act} from '../src/runtime.mjs';
test('role briefs load versioned source hashes and current saved scope',t=>{
 const dir=mkdtempSync(join(tmpdir(),'p2p-runtime-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const s=new CaseStore(join(dir,'c.sqlite'));t.after(()=>s.close());s.create('C1','Synthetic request');
 const first=brief(s,'builder','C1');assert.equal(first.sources.length,2);assert.match(first.sources[0].sha256,/^[a-f0-9]{64}$/);assert.equal(first.canAct,false);
 act(s,'coordinator','C1',{id:'s1',type:'scope',expectedVersion:0,scope:'CSV',criteria:['Preview']});
 assert.equal(brief(s,'builder','C1').case.version,1);
 assert.throws(()=>act(s,'builder','C1',{id:'a',type:'approve',version:1}),/does not belong/);
 assert.throws(()=>act(s,'founder','C1',{id:'a',type:'approve',version:1}),/approval reference/);
 assert.throws(()=>act(s,'coordinator','C1',{actor:'founder'}),/Actor/);
 assert.throws(()=>loadRole('../../other'),/Unknown/);
});
test('clarification and deferral stop work until a new scope decision',t=>{
 const dir=mkdtempSync(join(tmpdir(),'p2p-wait-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const s=new CaseStore(join(dir,'c.sqlite'));t.after(()=>s.close());s.create('C1','Need migration');
 act(s,'coordinator','C1',{id:'q',type:'clarify',version:0,reason:'Which columns?'});
 assert.equal(brief(s,'coordinator','C1').case.status,'waiting');
 assert.throws(()=>act(s,'builder','C1',{id:'b',type:'start',version:0}));
 act(s,'coordinator','C1',{id:'d',type:'defer',version:0,reason:'Founder deferred'});
 assert.equal(brief(s,'coordinator','C1').nextOwner,null);
});
