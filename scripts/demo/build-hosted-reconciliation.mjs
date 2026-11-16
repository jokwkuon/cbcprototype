// REQ-008: build reviewable SQL only; never connects to or mutates a hosted project.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),directory=resolve(root,'database/migrations');
const files=readdirSync(directory).filter(name=>/^\d+_.+\.sql$/.test(name)&&name<='20261105002247_role_helper_hardening.sql').sort();
if(files[0]!=='202610130001_initial_crm.sql'||files.length!==12)throw Error('Review migration manifest before reconciliation.');
const literal=text=>`'${text.replaceAll("'","''")}'`;
const source=files.map(name=>({name,sql:readFileSync(resolve(directory,name),'utf8')}));
const manifest=source.map(({name,sql})=>({name,sha256:createHash('sha256').update(sql).digest('hex')}));
const body=source.slice(1).map(({name,sql})=>`-- SOURCE ${name}\n${sql.replace(/^begin;\s*$/gm,'').replace(/^commit;\s*$/gm,'')}`).join('\n');
const history=source.map(({name,sql},i)=>`(${literal(name.split('_')[0])},${literal(name.replace(/^\d+_|\.sql$/g,''))},array[${literal(i===0?'-- Existing initial_crm schema verified and adopted; no initial DDL replay.':sql)}])`).join(',\n');
const preamble=`-- REQ-001/002/004/005/008: owner-authorized existing hosted baseline reconciliation.
-- Built from checksum-reviewed canonical migrations; no fixtures, proposals, role assignments or Auth settings.
-- Initial CRM schema must be independently verified before execution. Atomic; preserve original values.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
lock table public.profiles,public.organizations,public.contacts in access exclusive mode;
do $$ begin
 if (select count(*) from pg_tables where schemaname='public')<>3
 or exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='is_active')
 then raise exception 'Expected unreconciled three-table baseline; aborting'; end if;
 if (select array_agg(enumlabel::text order by enumsortorder) from pg_enum where enumtypid='public.app_role'::regtype)<>array['admin','staff','finance','viewer']
 then raise exception 'Role vocabulary differs; aborting'; end if;
end $$;
create temporary table cbc_before on commit drop as
 select 'profiles'::text as entity,jsonb_agg(to_jsonb(p) order by id) as rows from public.profiles p
 union all select 'organizations',jsonb_agg(to_jsonb(o) order by id) from public.organizations o
 union all select 'contacts',jsonb_agg(to_jsonb(c) order by id) from public.contacts c;
`;
const ending=`
-- Assert unchanged original values including identity, affiliation, owner and timestamps.
do $$ declare item record; row_count bigint; preserved bigint; begin
 for item in select * from cbc_before loop
  execute format('select count(*) from public.%I',item.entity) into row_count;
  if row_count<>coalesce(jsonb_array_length(item.rows),0) then raise exception 'Row count changed: %',item.entity; end if;
  execute format('select count(*) from public.%I t join jsonb_array_elements($1) b on t.id=(b->>''id'')::uuid where (select jsonb_object_agg(e.key,e.value) from jsonb_each(to_jsonb(t)) e where b ? e.key)=b',item.entity) into preserved using item.rows;
  if preserved<>row_count then raise exception 'Original values changed: %',item.entity; end if;
 end loop;
end $$;
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations(version text primary key,statements text[],name text);
-- Do not use ON CONFLICT: conflicting history requires separate review rather than concealment.
insert into supabase_migrations.schema_migrations(version,name,statements) values
${history};
notify pgrst,'reload schema';
commit;
`;
writeFileSync(resolve(root,'database/hosted/reconcile-version3.sql'),preamble+body+ending);
writeFileSync(resolve(root,'database/hosted/source-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Built reconciliation from ${files.length} canonical sources; initial migration adopted, ${files.length-1} incremental migrations included.`);
