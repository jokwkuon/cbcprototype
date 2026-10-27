import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {local} from './prepare.mjs';
import {login,client,check,privateWrite} from './client.mjs';
const seed=JSON.parse(readFileSync(resolve(local,'giving-records.json'),'utf8')),base=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8'));
const finance=await login('finance'),admin=await login('admin');let count=0;
const assert=(ok,label)=>{check(ok,label);count++;};
const summary=await finance.rpc('giving_summary',{p_year:seed.year,p_organization_id:base.organizationId,p_contact_id:base.contactIds[0]});assert(!summary.error,'Finance summary RPC failed.');
for(const [key,value] of Object.entries({annual_cash:750,lifetime_cash:950,pledged:3000,outstanding:2050,in_kind_declared:500,prior_cash:200,yoy_percent:275}))assert(Number(summary.data[key])===value,`Seed ${key} differs.`);
const detail=await finance.from('contribution_details').select('*').eq('id',seed.contributionIds[0]).single();assert(!detail.error&&detail.data.program_name==='Synthetic Scholarship Program'&&detail.data.event_name==='Synthetic Community Reception'&&detail.data.payment_status==='Partially Received','Linked view / payment calculation failed.');
assert(!(await admin.from('contributions').update({notes:'Synthetic admin verified'}).eq('id',seed.contributionIds[0]).select('id').single()).error,'Admin financial write failed.');
const id=randomUUID(),receipt=randomUUID(),payload={id,contribution_date:'2025-01-01',amount:'0.30',contribution_type:'Cash',funding_status:'Committed',notes:'Synthetic API verification only'};
assert(!(await finance.from('contributions').insert(payload).select('id').single()).error,'Finance creation failed.');
for(const amount of ['0.10','0.20'])assert(!(await finance.from('cash_receipts').insert({id:amount==='0.10'?receipt:randomUUID(),contribution_id:id,received_on:'2025-01-01',amount})).error,'Partial receipt insert failed.');
let current=await finance.from('contribution_details').select('*').eq('id',id).single();assert(Number(current.data.cash_received)===0.30&&Number(current.data.outstanding)===0,'Exact decimal cash sum failed.');
assert(!(await finance.from('cash_receipts').update({is_void:true,void_reason:'Synthetic API void'}).eq('id',receipt).select('id').single()).error,'Receipt correction failed.');
current=await finance.from('contribution_details').select('*').eq('id',id).single();assert(Number(current.data.cash_received)===0.20&&Number(current.data.outstanding)===0.10,'Void aggregate failed.');
for(const values of [{amount:'-1'},{amount:'NaN'},{amount:'0.001'},{received_on:'2099-01-01'},{contribution_id:seed.contributionIds[2]}]) assert((await finance.from('cash_receipts').insert({contribution_id:id,received_on:'2025-01-01',amount:'1',...values})).error,'Invalid receipt accepted.');
assert((await finance.from('contributions').update({contribution_type:'In-Kind'}).eq('id',id)).error,'Cash history type conversion accepted.');
assert((await finance.from('contributions').update({program_id:seed.eventId}).eq('id',id)).error,'Typed FK accepted event as program.');
for(const role of ['staff','viewer']){
 const reader=await login(role);
 assert(!(await reader.from('contribution_details').select('id').eq('id',id).single()).error,`${role} read failed.`);
 assert((await reader.from('contributions').insert({...payload,id:randomUUID()})).error,`${role} insert allowed.`);
 for(const table of ['contributions','cash_receipts','funding_initiatives','giving_document_links']){
  const mutation=table==='contributions'?{amount:'1'}:table==='cash_receipts'?{amount:'1'}:table==='funding_initiatives'?{name:'Denied'}:{label:'Denied'};
  const update=await reader.from(table).update(mutation).eq('id',table==='contributions'?id:table==='cash_receipts'?receipt:table==='funding_initiatives'?seed.programId:'66000000-0000-4000-8000-000000000001').select('id');assert(!update.error&&update.data.length===0,`${role} ${table} update allowed.`);
 }
}
assert((await client().from('contributions').select('id')).error,'Anonymous access allowed.');
assert((await client().rpc('giving_summary',{p_year:seed.year})).error,'Anonymous summary allowed.');
assert((await finance.from('cash_receipts').delete().eq('id',receipt)).error,'Financial delete allowed.');
const owner=await finance.from('organizations').update({relationship_owner:null}).eq('id',base.organizationId).select('id');assert(!owner.error&&owner.data.length===0,'Finance organization ownership changed.');
privateWrite('giving-api-verification.json',{checks:count,syntheticOnly:true});console.log(`PASS: ${count} real Auth/PostgREST Giving checks: role allow/deny, exact cash/pledge balances, corrections, typed links, validation and unchanged ownership.`);
