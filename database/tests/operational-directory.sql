\set ON_ERROR_STOP on
create or replace function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$ begin if ok is not true then raise exception 'FAIL: %',label; end if; end $$;
-- REQ-001/002/008: projections cannot widen base-table access or expose new writes.
select pg_temp.assert_true((select count(*)=2 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('organization_directory','contact_directory') and 'security_invoker=true'=any(c.reloptions)), 'directory views preserve RLS');
select pg_temp.assert_true(not has_table_privilege('anon','public.organization_directory','select') and not has_table_privilege('anon','public.contact_directory','select'),'anonymous directory access denied');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.organization_directory','update') and not has_table_privilege('authenticated','public.contact_directory','insert'),'directory grants are read-only');
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',false);
select pg_temp.assert_true((select count(*) from public.organization_directory)=(select count(*) from public.organizations),'finance projection matches authorized organizations');
select pg_temp.assert_true((select count(*) from public.contact_directory)=(select count(*) from public.contacts),'finance projection matches authorized contacts');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',false);
select pg_temp.assert_true((select count(*) from public.contact_directory)=(select count(*) from public.contacts),'viewer projection matches authorized contacts');
reset role;
select 'PASS operational directory invoker/access regressions' as result;
