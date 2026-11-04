import {readFileSync} from 'node:fs';
import {BookingStore,previewBookings} from '../src/bookings.mjs';
const [command,path]=process.argv.slice(2);
let store;
try{
 const csv=readFileSync(path,'utf8');
 let result;
 if(command==='preview')result=previewBookings(csv);
 else if(command==='save'&&process.argv.includes('--confirm')){
  if(!process.env.P2P_BOOKINGS_DB)throw new Error('Set P2P_BOOKINGS_DB');
  store=new BookingStore(process.env.P2P_BOOKINGS_DB);result=store.commit(csv);
 }else throw new Error('Usage: bookings.mjs preview FILE.csv | save FILE.csv --confirm');
 console.log(JSON.stringify(result,null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
finally{store?.close();}
