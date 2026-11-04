import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {BookingStore,previewBookings,parseCSV} from '../src/bookings.mjs';
const header='booking_id,guest_name,date,guests\n';
const good=header+'B1,"Guest, One",2026-11-06,2\n';
test('CSV handles quoted commas, escaped quotes, newlines, BOM and CRLF',()=>{
 const p=previewBookings('\uFEFF'+header.replace('\n','\r\n')+'B1,"Guest ""One""\nName",2026-11-06,2\r\n');
 assert.equal(p.valid[0].guest_name,'Guest "One"\nName');
 assert.throws(()=>parseCSV('"unfinished'),/Unclosed/);
 assert.throws(()=>parseCSV('"closed"x'),/Unexpected/);
});
test('invalid dates, missing values, wrong columns and guest limits produce useful errors',()=>{
 const p=previewBookings(header+'B1,A,2026-02-30,2\nB2,B,2026-11-06,0\nB3,,2026-11-06,2\nB4,A,2026-11-06,2,extra\n');
 assert.equal(p.invalid.length,4);
 assert.throws(()=>previewBookings('name,id\n'),/Expected header/);
});
test('preview does not create a store and duplicate rows are skipped',()=>{
 const p=previewBookings(good+'B1,Again,2026-11-06,2\n');
 assert.equal(p.valid.length,1);assert.equal(p.duplicates.length,1);
});
test('saving is atomic, persistent and safe to repeat; preview leaves bookings unchanged',t=>{
 const dir=mkdtempSync(join(tmpdir(),'p2p-bookings-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const path=join(dir,'bookings.sqlite');let s=new BookingStore(path);
 s.preview(good);assert.equal(s.list().length,0);
 assert.throws(()=>s.commit(good+'B2,Bad,2026-02-30,2\n'),/invalid/);assert.equal(s.list().length,0);
 assert.deepEqual(s.commit(good),{saved:1,skipped:0});
 assert.deepEqual(s.commit(good),{saved:0,skipped:1});
 s.close();s=new BookingStore(path);assert.equal(s.list().length,1);s.close();
});
