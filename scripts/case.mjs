import {readFileSync} from 'node:fs';
import {openStore,brief,act} from '../src/runtime.mjs';
const [command,role,id,input]=process.argv.slice(2);
let store;
try {
 if(!process.env.P2P_DB) throw new Error('Set P2P_DB to the shared absolute case database path');
 store=openStore(process.env.P2P_DB);
 let result;
 if(command==='create' && role==='coordinator') result=store.create(id,readFileSync(input,'utf8').trim());
 else if(command==='brief') result=brief(store,role,id);
 else if(command==='act') result=act(store,role,id,JSON.parse(readFileSync(input??0,'utf8')));
 else if(command==='show') result=store.get(id);
 else if(command==='events') result=store.events(id);
 else throw new Error('Usage: case.mjs create|brief|act|show|events ROLE CASE_ID [input-file]; act accepts JSON on stdin');
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
} catch(e) {process.stderr.write(e.message+'\n');process.exitCode=1;}
finally {store?.close();}
