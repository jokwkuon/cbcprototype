import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reportYear,cents,sumMoney,ReportFilterError} from '../lib/report-validation.ts';
import {readAll} from '../lib/read-all.ts';
test('REQ-013: calendar-year filters reject ambiguous, future and unsupported periods',()=>{
 assert.equal(reportYear(undefined,'2026-11-01'),2026);assert.equal(reportYear('2025','2026-11-01'),2025);assert.equal(reportYear('0002','2026-11-01'),2);
 for(const v of ['2027','2025x','1','0001',' 2025',['2025','2024']])assert.throws(()=>reportYear(v,'2026-11-01'),ReportFilterError);
});
test('REQ-013/004: reconciliation uses exact cents beyond JavaScript numeric precision',()=>{
 assert.equal(sumMoney(['0.10','0.20']),30n);assert.equal(cents('9007199254740993.01'),900719925474099301n);assert.equal(cents('-0.20'),-20n);
 for(const value of ['NaN','Infinity','0.001',''])assert.throws(()=>cents(value));
});
test('REQ-013: complete record reads follow API caps and preserve successful empty data',async()=>{
 const items=Array.from({length:1001},(_,id)=>({id}));let pages=0;
 const rows=await readAll((from,to)=>{pages++;return Promise.resolve({data:items.slice(from,Math.min(to+1,from+120)),count:items.length,error:null});});
 assert.equal(rows.length,1001);assert.equal(new Set(rows.map(r=>r.id)).size,1001);assert.equal(pages,9);
 assert.deepEqual(await readAll(()=>Promise.resolve({data:[],count:0,error:null})),[]);
});
test('REQ-013: failed, truncated and changing record reads never become empty reports',async()=>{
 for(const result of [{data:null,error:{message:'failure'},count:null},{data:[],error:null,count:1},{data:[],error:null,count:null}])await assert.rejects(readAll(()=>Promise.resolve(result)));
 await assert.rejects(readAll(()=>Promise.resolve({data:[{id:1},{id:1}],count:2,error:null})));
 let page=0;await assert.rejects(readAll(()=>Promise.resolve({data:[{id:page}],count:++page===1?2:3,error:null})));
});

test('REQ-013: oversized reads fail before transferring further pages',async()=>{
 let calls=0;await assert.rejects(readAll(()=>{calls++;return Promise.resolve({data:[{id:1}],count:10001,error:null});}),/record limit/);assert.equal(calls,1);
});
