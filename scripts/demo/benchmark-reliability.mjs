// REQ-001/002/005/008: isolated fictional relationship workload, no hosted target.
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {login,sql,check,privateWrite} from './client.mjs';
if(process.env.CBC_DEMO_INSTANCE!=='test')throw new Error('Benchmarks require the isolated test instance');
const client=await login('admin'),results=[];
const {data:{user}}=await client.auth.getUser();check(user,'Admin required');
function fixtureSql(query){return sql(`select set_config('request.jwt.claim.sub','${user.id}',false);`+query).split('\n').at(-1);}
const samples=process.env.CBC_BENCHMARK_SAMPLES ? Number(process.env.CBC_BENCHMARK_SAMPLES) : 7;
check(Number.isInteger(samples)&&samples>=3&&samples<=20,'Invalid benchmark sample count');
async function measure(load){let details;const times=[];for(let i=0;i<samples;i++){const start=performance.now();details=await load();times.push(performance.now()-start);}times.sort((a,b)=>a-b);return {...details,medianMs:+times[Math.floor(samples/2)].toFixed(2),p95Ms:+times[Math.ceil(.95*samples)-1].toFixed(2),samples};}
for(const size of [100,1000,10000]){
 const org=randomUUID(),contact=randomUUID();
 try{
 fixtureSql(`begin; insert into public.organizations(id,name,notes) values('${org}','Alderbrook Community Partners','Fictional isolated benchmark only');
 insert into public.contacts(id,organization_id,first_name,last_name) values('${contact}','${org}','Nadia','Fairbanks');
 insert into public.activities(id,organization_id,occurred_at,activity_type,purpose) select gen_random_uuid(),'${org}','2020-01-01T12:00:00Z'::timestamptz+(n%60)*interval '1 day','Call','Plan community mentorship outreach' from generate_series(1,${size}) n;
 insert into public.activity_contacts(activity_id,contact_id) select id,'${contact}' from public.activities where organization_id='${org}';
 insert into public.tasks(activity_id,description,due_date) select id,'Prepare the community partnership briefing',case when row_number() over(order by id)%3=0 then null else date '2020-02-01' end from public.activities where organization_id='${org}';
 analyze public.activities; analyze public.activity_contacts; analyze public.tasks; commit;`);
 const before=await measure(async()=>{let rows=[],count=0,queries=0;do{const r=await client.from('activities').select('*',{count:'exact'}).eq('organization_id',org).order('id').range(rows.length,rows.length+499);check(!r.error&&r.count===size,'Unbounded activity read failed');count=r.count;rows.push(...r.data);queries++;}while(rows.length<count);rows.sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at)||a.id.localeCompare(b.id));return {queries,rowsTransferred:rows.length,payloadBytes:Buffer.byteLength(JSON.stringify(rows))};});
 const after=await measure(async()=>{const r=await client.from('activities').select('*',{count:'exact'}).eq('organization_id',org).order('occurred_at',{ascending:false}).order('id').limit(26);check(!r.error&&r.count===size,'Bounded activity read failed');return {queries:1,rowsTransferred:r.data.length,payloadBytes:Buffer.byteLength(JSON.stringify(r.data))};});
 const contactPage=await measure(async()=>{const r=await client.from('activities').select('*,activity_contacts!inner(contact_id)',{count:'exact'}).eq('activity_contacts.contact_id',contact).order('occurred_at',{ascending:false}).order('id').limit(26);check(!r.error&&r.count===size,'Contact scoped read failed');return {queries:1,rowsTransferred:r.data.length,payloadBytes:Buffer.byteLength(JSON.stringify(r.data))};});
 const tasks=await measure(async()=>{const r=await client.from('follow_ups').select('*',{count:'exact'}).eq('organization_id',org).is('completed_at',null).order('due_date',{nullsFirst:false}).order('id').limit(26);check(!r.error&&r.count===size,'Task page failed');return {queries:1,rowsTransferred:r.data.length,payloadBytes:Buffer.byteLength(JSON.stringify(r.data))};});
 results.push({size,before,after,contactPage,tasks});
 }finally{fixtureSql(`begin; delete from public.tasks where activity_id in(select id from public.activities where organization_id='${org}'); delete from public.activity_contacts where contact_id='${contact}'; delete from public.activities where organization_id='${org}'; delete from public.contacts where id='${contact}'; delete from public.organizations where id='${org}'; commit;`);}
 check(fixtureSql(`select count(*) from public.organizations where id='${org}';`)==='0','Benchmark cleanup failed');
}
const result={environment:'Local PostgreSQL 17 + native Supabase Auth/PostgREST, Node '+process.version,scope:'Warm authenticated relationship data requests only; excludes auth/profile, full rendering, reports, export, production network and hosted load',percentile:'nearest-rank p95 (maximum of seven samples); small sample, not an SLA',results,cleanup:true};
privateWrite(process.env.CBC_BENCHMARK_OUTPUT || 'reliability-performance.json',result);console.log(JSON.stringify(result,null,2));
