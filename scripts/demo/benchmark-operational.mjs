// REQ-001/002/008. Local-only, fictional scale fixture; cleanup owns only generated IDs.
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {login,sql,check,privateWrite} from './client.mjs';
import {readStatus} from './prepare.mjs';
readStatus();
const client=await login('admin'),run=randomUUID(),prefix=run.slice(0,8);
const {data:{user}}=await client.auth.getUser();
check(user,'Benchmark requires active Admin');
const size=2500;
const ids=Array.from({length:size},()=>randomUUID());
const literal=value=>`'${value.replaceAll("'","''")}'`;
const orgs=ids.map((id,i)=>`(${literal(id)},${literal(`Alderbridge Partners ${prefix} Branch ${i+1}`)},'Community education','Calgary',${literal(`Fictional scale fixture ${run}`)})`).join(',');
const percentile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)];
async function measure(load){const samples=[];let details;for(let i=0;i<7;i++){const start=performance.now();details=await load();samples.push(performance.now()-start);}return {...details,medianMs:+percentile(samples,.5).toFixed(2),p95Ms:+percentile(samples,.95).toFixed(2),samples:7};}
try {
  sql(`begin; select set_config('request.jwt.claim.sub',${literal(user.id)},true); insert into public.organizations(id,name,industry,location,notes) values ${orgs}; commit;`);
  const before=await measure(async()=>{let rows=[],count=0,queries=0;do{const r=await client.from('organizations').select('id,name,industry,relationship_status,organization_type,priority_level,location',{count:'exact'}).order('id').range(rows.length,rows.length+499);check(!r.error&&r.count!==null,'Baseline query failed');count=r.count;rows.push(...r.data);queries++;}while(rows.length<count);return {queries,rowsTransferred:rows.length,payloadBytes:Buffer.byteLength(JSON.stringify(rows)),matches:rows.filter(r=>r.name.includes(prefix)).length};});
  const after=await measure(async()=>{const r=await client.from('organization_directory').select('id,name,context,status,category,categoryId,email,location,priority',{count:'exact'}).ilike('search_text',`%${prefix}%`).order('name').order('id').range(0,9);check(!r.error&&r.count===size,'Scoped query/count mismatch');return {queries:1,rowsTransferred:r.data.length,payloadBytes:Buffer.byteLength(JSON.stringify(r.data)),matches:r.count};});
  const globalBefore=await measure(async()=>{let rows=[],count=0,queries=0;do{const r=await client.from('organizations').select('id,name,industry',{count:'exact'}).order('id').range(rows.length,rows.length+499);check(!r.error,'Global baseline failed');count=r.count;rows.push(...r.data);queries++;}while(rows.length<count);return {queries,rowsTransferred:rows.length,payloadBytes:Buffer.byteLength(JSON.stringify(rows))};});
  const globalAfter=await measure(async()=>{const r=await client.from('organizations').select('id,name,industry').or(`name.ilike.%${prefix}%,industry.ilike.%${prefix}%`).order('name').order('id').limit(6);check(!r.error&&r.data.length===6,'Bounded search failed');return {queries:1,rowsTransferred:r.data.length,payloadBytes:Buffer.byteLength(JSON.stringify(r.data))};});
  const result={fixtureSize:size,synthetic:true,scope:'Local authenticated PostgREST; organization data requests only, excluding auth/profile/history/render',directory:{before,after},globalOrganizationSearch:{before:globalBefore,after:globalAfter}};
  privateWrite('operational-performance.json',result);console.log(JSON.stringify(result,null,2));
} finally {sql(`delete from public.organizations where id in (${ids.map(literal).join(',')}) and notes=${literal(`Fictional scale fixture ${run}`)};`);}
