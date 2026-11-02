// REQ-013/004/008. Read-only report contracts against actual local Auth/PostgREST.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {local} from './prepare.mjs';
import {login,client,check,privateWrite,sql,uuid,accounts} from './client.mjs';
import {cents,sumMoney} from '../../apps/frontend/lib/report-validation.ts';
import {readAll} from '../../apps/frontend/lib/read-all.ts';
const base=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8'));
let checks=0;const assert=(ok,label)=>{check(ok,label);checks++;};
for(const role of ['admin','finance','staff','viewer']){
 const c=await login(role);
 let pages=0;
 const records=await readAll((from,to)=>{pages++;return c.from('contribution_details').select('*',{count:'exact'}).eq('organization_id',base.organizationId).order('id').range(from,Math.min(to,from+1));});
 assert(pages>1,`${role} actual REST pagination reads all contribution pages`);
 const interactions=await readAll((from,to)=>c.from('activities').select('*',{count:'exact'}).eq('organization_id',base.organizationId).order('id').range(from,to));
 assert(interactions.length>0&&interactions.every(a=>a.organization_id===base.organizationId),`${role} explicit organization-linked interactions`);
 const opportunities=await readAll((from,to)=>c.from('opportunities').select('id,name,organization_id',{count:'exact'}).eq('organization_id',base.organizationId).order('id').range(from,to));
 assert(opportunities.length>0&&opportunities.every(o=>o.organization_id===base.organizationId),`${role} organization opportunity references`);
 assert(records.find(r=>r.id==='64000000-0000-4000-8000-000000000001')?.renewal_date===`${Number(base.calendarDate.slice(0,4))+1}-01-01`,`${role} future manual renewal stays planning metadata`);
 const ids=new Set(records.map(r=>r.id));
 const receipts=(await readAll((from,to)=>c.from('giving_receipts').select('*',{count:'exact'}).order('id').range(from,to))).filter(r=>ids.has(r.contribution_id));
 for(const year of [2025,Number(base.calendarDate.slice(0,4))]){
  const result=await c.rpc('giving_summary',{p_year:year,p_organization_id:base.organizationId});assert(!result.error,`${role} summary access`);const s=result.data;
  const eligible=receipts.filter(r=>!r.is_void&&r.received_on<=s.as_of),period=eligible.filter(r=>r.received_on>=`${year}-01-01`&&r.received_on<=s.period_end);
  assert(cents(s.annual_cash)===sumMoney(period.map(r=>r.amount)),`${role} ${year} exact period ledger`);
  assert(cents(s.lifetime_cash)===sumMoney(eligible.map(r=>r.amount)),`${role} ${year} lifetime ledger`);
  assert(cents(s.pledged)===sumMoney(records.map(r=>r.pledged)),`${role} ${year} pledged reconciliation`);
  assert(cents(s.outstanding)===sumMoney(records.map(r=>r.outstanding)),`${role} ${year} outstanding reconciliation`);
 }
 const empty=await c.rpc('giving_summary',{p_year:2025,p_organization_id:'ffffffff-ffff-4fff-8fff-ffffffffffff'});assert(!empty.error&&cents(empty.data.annual_cash)===0n&&cents(empty.data.pledged)===0n,`${role} empty scope verified zero`);
 assert((await c.rpc('giving_summary',{p_year:0})).error,`${role} invalid year error`);
 if(['staff','viewer'].includes(role)){
  const write=await c.from('contributions').update({amount:'1'}).eq('id',records[0].id).select('id');assert(!write.error&&!write.data.length,`${role} write denial unchanged`);
 }
}
assert((await client().from('giving_receipts').select('id')).error,'anonymous ledger denied');
assert((await client().rpc('giving_summary',{p_year:2025})).error,'anonymous summary denied');
const actor=accounts().find(a=>a.name==='staff-b'),inactive=client();assert(!(await inactive.auth.signInWithPassword({email:actor.email,password:actor.password})).error,'inactive test identity authenticates');
sql(`update public.profiles set is_active=false where id='${uuid(actor.id)}';`);
try {const rows=await inactive.from('giving_receipts').select('id');assert(!rows.error&&!rows.data.length,'inactive report rows denied');}
finally {sql(`update public.profiles set is_active=true where id='${uuid(actor.id)}';`);}
privateWrite('reports-api-verification.json',{checks,syntheticOnly:true});console.log(`PASS: ${checks} real local report Auth/PostgREST checks; exact period/lifetime/balance reconciliation and unchanged role boundaries.`);
