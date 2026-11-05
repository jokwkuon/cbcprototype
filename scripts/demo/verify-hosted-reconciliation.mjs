// Local-only rehearsal. Uses fictional rows, never the private hosted snapshot.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {root,readStatus,requireLocalUrl} from './prepare.mjs';
import {sql,psqlPath,privateWrite,check} from './client.mjs';
const database=`cbc_reconcile_${randomUUID().replaceAll('-','')}`;
const endpoint=requireLocalUrl(readStatus().env.DB_URL,54422);
sql(`create database ${database};`);
const environment={...process.env,PGHOST:endpoint.hostname,PGPORT:endpoint.port,PGUSER:decodeURIComponent(endpoint.username),PGPASSWORD:decodeURIComponent(endpoint.password),PGDATABASE:database};
function run(input,label,expectedFailure=false){const result=spawnSync(psqlPath(),['-X','-q','-A','-t','-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',env:environment,maxBuffer:8*1024*1024});privateWrite(`hosted-rehearsal-${label}.json`,{status:result.status,stdout:result.stdout,stderr:result.stderr});check(expectedFailure?result.status!==0:result.status===0,`Rehearsal ${label} failed; private diagnostics saved`);return result.stdout.trim();}
run(readFileSync(resolve(root,'database/tests/bootstrap.sql'),'utf8')+readFileSync(resolve(root,'database/migrations/202610130001_initial_crm.sql'),'utf8')+`
insert into auth.users(id,email,raw_user_meta_data) values('a0000000-0000-4000-8000-000000000001','morgan.hayes@example.test','{"full_name":"Morgan Hayes"}');
update public.profiles set role='admin';
insert into public.organizations(id,name,notes) values('a1000000-0000-4000-8000-000000000001','Juniper Harbour Partners','Discuss a scholarship partnership');
insert into public.contacts(id,organization_id,first_name,last_name,email) values('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','Aisha','Morgan','aisha.morgan@example.test');`,'baseline');
const upgrade=readFileSync(resolve(root,'database/hosted/reconcile-version3.sql'),'utf8');
run(upgrade,'upgrade');
run(upgrade,'repeat-refused',true);
const verification=JSON.parse(run(`select json_build_object('profiles',(select count(*) from public.profiles),'organizations',(select count(*) from public.organizations),'contacts',(select count(*) from public.contacts),'history',(select count(*) from supabase_migrations.schema_migrations),'all_rls',(select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),'public_executable_definers',(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and (has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute'))));`,'verification'));
check(verification.profiles===1&&verification.organizations===1&&verification.contacts===1&&verification.history===12&&verification.all_rls&&verification.public_executable_definers===0,'Rehearsal reconciliation mismatch');
privateWrite('hosted-reconciliation-rehearsal.json',{...verification,database,syntheticOnly:true,repeatRefused:true});
console.log('PASS: fictional existing-baseline rehearsal, original-value preservation, 12 canonical history entries, read-only views/RLS, exposed-definer hardening and repeat refusal.');
