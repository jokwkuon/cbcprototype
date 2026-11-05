-- REQ-008: read-only normalized public application structure; excludes data and Auth.
-- Capture on the same PostgreSQL major version to avoid deparser differences.
with objects as (
 select 'relation:'||c.relname as key, jsonb_build_object('kind',c.relkind,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'options',(select jsonb_agg(x order by x) from unnest(c.reloptions) x),'acl',(select jsonb_agg(x::text order by x::text) from unnest(c.relacl) x)) as value
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m','S')
 union all
 select 'column:'||c.relname||'.'||a.attname, jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid),'identity',a.attidentity,'generated',a.attgenerated,'position',a.attnum,'acl',(select jsonb_agg(x::text order by x::text) from unnest(a.attacl) x))
 from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where n.nspname='public' and c.relkind in ('r','p','v','m') and a.attnum>0 and not a.attisdropped
 union all
 select 'constraint:'||c.relname||'.'||p.conname,jsonb_build_object('definition',pg_get_constraintdef(p.oid,true),'validated',p.convalidated,'deferrable',p.condeferrable,'initially_deferred',p.condeferred) from pg_constraint p join pg_class c on c.oid=p.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
 union all
 select 'index:'||i.relname,jsonb_build_object('definition',pg_get_indexdef(i.oid),'valid',x.indisvalid,'ready',x.indisready) from pg_index x join pg_class i on i.oid=x.indexrelid join pg_namespace n on n.oid=i.relnamespace where n.nspname='public'
 union all
 select 'view:'||c.relname,to_jsonb(pg_get_viewdef(c.oid,true)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('v','m')
 union all
 select 'function:'||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',jsonb_build_object('definition',pg_get_functiondef(p.oid),'acl',(select jsonb_agg(x::text order by x::text) from unnest(p.proacl) x)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind in ('f','p')
 union all
 select 'trigger:'||c.relname||'.'||t.tgname,jsonb_build_object('definition',pg_get_triggerdef(t.oid,true),'enabled',t.tgenabled) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal
 union all
 select 'policy:'||tablename||'.'||policyname,jsonb_build_object('permissive',permissive,'roles',roles,'command',cmd,'using',qual,'check',with_check) from pg_policies where schemaname='public'
 union all
 select 'enum:'||t.typname,jsonb_agg(e.enumlabel order by e.enumsortorder) from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid where n.nspname='public' group by t.typname
 union all
 select 'schema:'||n.nspname,jsonb_build_object('acl',(select jsonb_agg(x::text order by x::text) from unnest(n.nspacl) x)) from pg_namespace n where n.nspname in ('public','private')
 union all
 select 'default_acl:'||n.nspname||':'||r.rolname||':'||d.defaclobjtype::text,jsonb_build_object('acl',(select jsonb_agg(x::text order by x::text) from unnest(d.defaclacl) x)) from pg_default_acl d join pg_roles r on r.oid=d.defaclrole join pg_namespace n on n.oid=d.defaclnamespace where n.nspname in ('public','private')
 union all
 select 'extension:'||e.extname,jsonb_build_object('schema',n.nspname,'version',e.extversion) from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto'
)
select coalesce(jsonb_object_agg(key,value order by key),'{}') from objects;
