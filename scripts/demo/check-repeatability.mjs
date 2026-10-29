import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {sql,check,privateWrite} from "./client.mjs";
const fingerprint=()=>sql("select md5(coalesce(string_agg(version,',' order by version),'')) from supabase_migrations.schema_migrations;");
const before=fingerprint();
for(let run=0;run<2;run++){
 for(const [file,...args] of [["stack.mjs","migrate"],["seed.mjs"]]){
  const result=spawnSync(process.execPath,[fileURLToPath(new URL(file,import.meta.url)),...args],{encoding:"utf8",maxBuffer:8*1024*1024});
  if(result.status!==0){privateWrite("repeatability-error.json",{stdout:result.stdout,stderr:result.stderr});throw new Error("Repeatability check failed; inspect private diagnostics.");}
 }
 check(fingerprint()===before,"Repeated migration changed applied-version history.");
}
const counts=JSON.parse(sql("select json_build_object('auth_users',(select count(*) from auth.users where email like 'cbc-demo-%@example.test'),'organization',(select count(*) from public.organizations where id='60000000-0000-4000-8000-000000000001'),'contacts',(select count(*) from public.contacts where id in ('61000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000002')),'activity',(select count(*) from public.activities where purpose='Synthetic Demo Check-in' and organization_id='60000000-0000-4000-8000-000000000001'),'contributions',(select count(*) from public.contributions where id::text like '64000000-0000-4000-8000-%'),'receipts',(select count(*) from public.cash_receipts where id::text like '65000000-0000-4000-8000-%'),'interests',(select count(*) from public.sponsor_interests where id='68000000-0000-4000-8000-000000000001'),'interest_programs',(select count(*) from public.interest_programs where interest_id='68000000-0000-4000-8000-000000000001'),'interest_activities',(select count(*) from public.interest_activities where interest_id='68000000-0000-4000-8000-000000000001'),'interest_tasks',(select count(*) from public.interest_tasks where interest_id='68000000-0000-4000-8000-000000000001'),'opportunities',(select count(*) from public.opportunities where id in ('67000000-0000-4000-8000-000000000001','67000000-0000-4000-8000-000000000014')),'tasks',(select count(*) from public.tasks where id::text like '62000000-0000-4000-8000-%'));"));
check(counts.auth_users===5&&counts.organization===1&&counts.contacts===2&&counts.activity===1&&counts.tasks===6&&counts.contributions===5&&counts.receipts===4&&counts.interests===1&&counts.interest_programs===1&&counts.interest_activities===2&&counts.interest_tasks===3&&counts.opportunities===2,"Repeat seed duplicated records.");
privateWrite("repeatability.json",{passes:2,historyFingerprint:before,counts});
console.log("PASS: two no-op migration replays and two seed replays; history and synthetic record counts remain stable.");
