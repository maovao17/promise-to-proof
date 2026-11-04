import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
export function parseCSV(source) {
 if(typeof source!=='string') throw new Error('CSV text required');
 if(source.length>1_000_000) throw new Error('Demo file limit is 1 MB');
 const rows=[];let row=[],field='',quoted=false,closed=false;
 source=source.replace(/^\uFEFF/,'');
 const cell=()=>{row.push(field);field='';closed=false;};
 const line=()=>{cell();if(row.some(x=>x.trim()))rows.push(row);row=[];};
 for(let i=0;i<source.length;i++){
  const c=source[i];
  if(quoted){if(c==='"'){if(source[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
  if(c==='"'){if(field||closed)throw new Error('Unexpected quote');quoted=true;}
  else if(c===',')cell();
  else if(c==='\n'||c==='\r'){if(c==='\r'&&source[i+1]==='\n')i++;line();}
  else {if(closed)throw new Error('Unexpected text after closing quote');field+=c;}
 }
 if(quoted)throw new Error('Unclosed quote');
 if(field||closed||row.length)line();
 return rows;
}
export function previewBookings(csv,existingIds=[]) {
 const rows=parseCSV(csv),header=rows.shift();
 const wanted=['booking_id','guest_name','date','guests'];
 if(!header||header.length!==4||header.some((x,i)=>x.trim()!==wanted[i]))throw new Error('Expected header: '+wanted.join(','));
 const known=new Set(existingIds),seen=new Set(),valid=[],invalid=[],duplicates=[];
 rows.forEach((r,i)=>{
  const [id,name,date,guests]=r.map(x=>x.trim());
  let reason=null;
  if(r.length!==4)reason='Expected 4 columns';
  else if(!id||!name)reason='Booking ID and guest name required';
  else if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)reason='Valid date YYYY-MM-DD required';
  else if(!/^\d+$/.test(guests)||Number(guests)<1||Number(guests)>20)reason='Guests must be 1–20';
  if(reason){invalid.push({row:i+2,reason});return;}
  if(known.has(id)||seen.has(id)){duplicates.push({row:i+2,booking_id:id});return;}
  seen.add(id);valid.push({booking_id:id,guest_name:name,date,guests:Number(guests)});
 });
 return {valid,invalid,duplicates,total:rows.length};
}
export class BookingStore {
 #db;
 constructor(path){mkdirSync(dirname(path),{recursive:true});this.#db=new DatabaseSync(path);this.#db.exec('PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS bookings (booking_id TEXT PRIMARY KEY, guest_name TEXT NOT NULL, date TEXT NOT NULL, guests INTEGER NOT NULL)');}
 list(){return this.#db.prepare('SELECT * FROM bookings ORDER BY booking_id').all().map(r=>({...r}));}
 preview(csv){return previewBookings(csv,this.list().map(x=>x.booking_id));}
 commit(csv){
  this.#db.exec('BEGIN IMMEDIATE');
  try{
   const result=this.preview(csv);
   if(result.invalid.length)throw new Error('Fix invalid rows before saving');
   const insert=this.#db.prepare('INSERT INTO bookings VALUES (?,?,?,?)');
   for(const r of result.valid)insert.run(r.booking_id,r.guest_name,r.date,r.guests);
   this.#db.exec('COMMIT');return {saved:result.valid.length,skipped:result.duplicates.length};
  }catch(e){this.#db.exec('ROLLBACK');throw e;}
 }
 close(){this.#db.close();}
}
