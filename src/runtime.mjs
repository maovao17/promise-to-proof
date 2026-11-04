import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {CaseStore} from './store.mjs';
const roles=['coordinator','builder','reviewer','founder'];
export const eventRoles={scope:'coordinator',approve:'founder',start:'builder',submit:'builder',verify:'reviewer',draft:'coordinator',release:'founder',notify:'founder',confirm:'coordinator',clarify:'coordinator',defer:'coordinator'};
export function loadRole(role) {
  if(!roles.includes(role)) throw new Error('Unknown role');
  const root=fileURLToPath(new URL('../',import.meta.url));
  const names=role==='founder'?['agents/CONTRACT.md']:['agents/CONTRACT.md','agents/'+role+'.md'];
  const sources=names.map(path=>{const text=readFileSync(resolve(root,path),'utf8');return {path,sha256:createHash('sha256').update(text).digest('hex'),text};});
  return {role,sources};
}
export function nextOwner(c) {
 if((c.status==='verified'||c.status==='released')&&c.draft)return 'founder';
 return {received:'coordinator',proposed:'founder',approved:'builder',building:'builder',review:'reviewer',verified:'coordinator',released:'coordinator',notified:'coordinator',confirmed:null,blocked:'founder',waiting:'founder',deferred:null}[c.status];
}
export function brief(store,role,id) {
 const prompt=loadRole(role), current=store.get(id);
 if(!current) throw new Error('Case not found');
 return {...prompt,case:current,nextOwner:nextOwner(current),canAct:nextOwner(current)===role,
  trustBoundary:'Local operator/agent role selection; not authenticated Switch identity. Verify human approval in the room before founder events.'};
}
export function act(store,role,id,payload) {
 loadRole(role);
 if(!payload || typeof payload!=='object' || Array.isArray(payload)) throw new Error('Event object required');
 if(Object.hasOwn(payload,'actor')) throw new Error('Actor is supplied by the local role command, not the event payload');
 if(eventRoles[payload.type]!==role) throw new Error('Action does not belong to this role');
 if(role==='founder' && (typeof payload.approvalRef!=='string'||!payload.approvalRef.trim())) throw new Error('Human approval reference required');
 const result=store.append(id,{...payload,actor:role});
 return {case:result,nextOwner:nextOwner(result)};
}
export function openStore(path) {return new CaseStore(path);}
