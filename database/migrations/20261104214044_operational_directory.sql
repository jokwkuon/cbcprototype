-- REQ-001/002/008: bounded directory reads. Invoker views preserve base-table RLS.
-- No lifecycle, affiliation, finance or access-policy changes.
create view public.organization_directory with (security_invoker=true) as
select id, name, coalesce(industry,'Industry not recorded') as context,
 relationship_status::text as status, coalesce(organization_type,'Type not recorded') as category,
 coalesce(organization_type,'') as "categoryId", coalesce(location,'') as location,
 priority_level as priority, ''::text as email,
 concat_ws(' ',name,industry,organization_type,location,id::text) as search_text
from public.organizations;
create view public.contact_directory with (security_invoker=true) as
select c.id, concat_ws(' ',c.first_name,c.last_name) as name,
 coalesce(c.title,'Title not recorded') as context, coalesce(c.contact_type,'Type not recorded') as status,
 coalesce(o.name,'Not linked') as category, coalesce(c.organization_id::text,'') as "categoryId",
 coalesce(c.email,'') as email, ''::text as location, ''::text as priority,
 concat_ws(' ',c.first_name,c.last_name,c.title,o.name,c.email,c.id::text) as search_text
from public.contacts c left join public.organizations o on o.id=c.organization_id;
revoke all on public.organization_directory,public.contact_directory from public,anon,authenticated;
grant select on public.organization_directory,public.contact_directory to authenticated;
