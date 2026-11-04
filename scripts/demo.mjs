import {createCase,applyEvent} from '../src/workflow.mjs';
let c=createCase('DEMO-001','Prospect requests spreadsheet booking migration');
const send=e=>{c=applyEvent(c,e);console.log(e.type+': '+c.status+' (scope v'+c.version+')');};
console.log('OFFLINE SIMULATION — no Switch, AI, deployment, or customer messages');
send({id:'s1',type:'scope',actor:'coordinator',expectedVersion:0,scope:'Spreadsheet import',criteria:['Preview before save']});
send({id:'a1',type:'approve',actor:'founder',version:1});
send({id:'s2',type:'scope',actor:'coordinator',expectedVersion:1,scope:'CSV only, no Excel',criteria:['Preview before save','Reject invalid rows']});
try {send({id:'old',type:'start',actor:'builder',version:1});} catch(e) {console.log('BLOCKED old approval: '+e.message);}
send({id:'a2',type:'approve',actor:'founder',version:2});
send({id:'b2',type:'start',actor:'builder',version:2});
console.log('Next live milestone: connect this case to real Switch handoffs and implementation evidence.');
