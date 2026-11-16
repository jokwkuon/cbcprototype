-- REQ-005/008: additive activity log, participants and multiple follow-up actions.
-- Local validation only; hosted rollout requires explicit review.
begin;
-- Harden the existing timestamp helper reused by the new tables.
alter function public.touch_updated_at() set search_path = '';
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  occurred_at timestamptz not null check (isfinite(occurred_at)),
  activity_type text not null check (length(trim(activity_type)) > 0),
  location text, purpose text, key_discussion text, sponsor_needs text,
  cbc_opportunity text, outcome text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.activity_contacts (
  activity_id uuid not null references public.activities(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  primary key(activity_id,contact_id)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  description text not null check (length(trim(description)) > 0),
  owner_id uuid references public.profiles(id),
  due_date date check (isfinite(due_date)),
  completed_at timestamptz check (isfinite(completed_at)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index activities_organization_date_idx on public.activities(organization_id,occurred_at desc);
create index activity_contacts_contact_idx on public.activity_contacts(contact_id,activity_id);
create index tasks_activity_idx on public.tasks(activity_id);
create index tasks_open_due_idx on public.tasks(due_date,id) where completed_at is null;
create trigger activities_touch before update on public.activities for each row execute function public.touch_updated_at();
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();

alter table public.activities enable row level security;
alter table public.activity_contacts enable row level security;
alter table public.tasks enable row level security;
revoke all on public.activities,public.activity_contacts,public.tasks from public,anon,authenticated;
grant select,insert,update on public.activities,public.tasks to authenticated;
grant select,insert,delete on public.activity_contacts to authenticated;
create policy "active CRM readers see activities" on public.activities for select to authenticated
using (public.current_role() in ('admin','staff','finance','viewer'));
create policy "active CRM writers create activities" on public.activities for insert to authenticated
with check (public.current_role() in ('admin','staff'));
create policy "active CRM writers edit activities" on public.activities for update to authenticated
using (public.current_role() in ('admin','staff')) with check (public.current_role() in ('admin','staff'));
create policy "read activity participants" on public.activity_contacts for select to authenticated
using (exists(select 1 from public.activities a where a.id=activity_id));
create policy "write activity participants" on public.activity_contacts for insert to authenticated
with check (public.current_role() in ('admin','staff') and exists(select 1 from public.activities a where a.id=activity_id) and exists(select 1 from public.contacts c where c.id=contact_id));
create policy "replace activity participants" on public.activity_contacts for delete to authenticated
using (public.current_role() in ('admin','staff'));
create policy "read follow ups" on public.tasks for select to authenticated
using (exists(select 1 from public.activities a where a.id=activity_id));
create policy "create follow ups" on public.tasks for insert to authenticated
with check (public.current_role() in ('admin','staff') and exists(select 1 from public.activities a where a.id=activity_id));
create policy "edit follow ups" on public.tasks for update to authenticated
using (public.current_role() in ('admin','staff')) with check (public.current_role() in ('admin','staff'));

-- Reuse the restricted directory as an assignment capability; do not widen it.
create function private.validate_task_owner() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' then
    if new.id is distinct from old.id or new.activity_id is distinct from old.activity_id then
      raise exception 'Follow-up identity and activity cannot be changed.' using errcode='42501';
    end if;
    if new.owner_id is not distinct from old.owner_id then return new; end if;
  end if;
  if new.owner_id is not null and not exists(select 1 from public.staff_directory d where d.id=new.owner_id) then
    raise exception 'Select a permitted active Staff action owner.' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function private.validate_task_owner() from public,anon,authenticated;
create trigger tasks_owner before insert or update on public.tasks for each row execute function private.validate_task_owner();

create function public.activity_today() returns date language sql stable security invoker set search_path='' as $$
 select (statement_timestamp() at time zone 'America/Edmonton')::date
$$;
create function public.follow_up_status(p_due date,p_completed timestamptz,p_today date)
returns text language sql immutable security invoker set search_path='' as $$
 select case when p_completed is not null then 'Complete' when p_due < p_today then 'Overdue' else 'Open' end
$$;
create view public.follow_ups with (security_invoker=true) as
select t.*,public.follow_up_status(t.due_date,t.completed_at,public.activity_today()) as status,
 a.organization_id,a.purpose as activity_purpose,a.activity_type,o.name as organization_name,d.display_name as owner_name
from public.tasks t join public.activities a on a.id=t.activity_id
left join public.organizations o on o.id=a.organization_id
left join public.staff_directory d on d.id=t.owner_id;
revoke all on public.follow_ups from public,anon,authenticated;
grant select on public.follow_ups to authenticated;

create function public.activity_last_contact(p_organization_id uuid default null,p_contact_id uuid default null,p_activity_id uuid default null)
returns timestamptz language sql stable security invoker set search_path='' as $$
 select max(a.occurred_at) from public.activities a where a.occurred_at<=statement_timestamp() and (
  a.organization_id=p_organization_id
  or exists(select 1 from public.activity_contacts c where c.activity_id=a.id and c.contact_id=p_contact_id)
  or (p_activity_id is not null and (
    a.id=p_activity_id
    or a.organization_id=(select target.organization_id from public.activities target where target.id=p_activity_id)
    or exists(select 1 from public.activity_contacts c join public.activity_contacts target on c.contact_id=target.contact_id where c.activity_id=a.id and target.activity_id=p_activity_id)
  ))
 )
$$;
-- Atomic save: invalid participants roll back the activity update and replacement links.
create function public.save_activity(p_id uuid,p_values jsonb,p_contacts uuid[]) returns uuid
language plpgsql security invoker set search_path='' as $$
declare saved_id uuid;
begin
  if public.current_role() is null or public.current_role() not in ('admin','staff') then
    raise exception 'Active Admin or Staff required.' using errcode='42501';
  end if;
  if p_id is null then
    insert into public.activities(organization_id,occurred_at,activity_type,location,purpose,key_discussion,sponsor_needs,cbc_opportunity,outcome)
    values(nullif(p_values->>'organization_id','')::uuid,(p_values->>'occurred_at')::timestamptz,p_values->>'activity_type',p_values->>'location',p_values->>'purpose',p_values->>'key_discussion',p_values->>'sponsor_needs',p_values->>'cbc_opportunity',p_values->>'outcome') returning id into saved_id;
  else
    update public.activities set organization_id=nullif(p_values->>'organization_id','')::uuid,
      occurred_at=(p_values->>'occurred_at')::timestamptz,activity_type=p_values->>'activity_type',
      location=p_values->>'location',purpose=p_values->>'purpose',key_discussion=p_values->>'key_discussion',
      sponsor_needs=p_values->>'sponsor_needs',cbc_opportunity=p_values->>'cbc_opportunity',outcome=p_values->>'outcome'
    where id=p_id returning id into saved_id;
    if not found then raise exception 'Activity unavailable.' using errcode='P0002'; end if;
    delete from public.activity_contacts where activity_id=saved_id;
  end if;
  insert into public.activity_contacts(activity_id,contact_id)
  select saved_id,contact_id from (select distinct unnest(p_contacts) as contact_id) c;
  return saved_id;
end $$;
revoke all on function public.activity_today(),public.follow_up_status(date,timestamptz,date),public.activity_last_contact(uuid,uuid,uuid),public.save_activity(uuid,jsonb,uuid[]) from public,anon;
grant execute on function public.activity_today(),public.follow_up_status(date,timestamptz,date),public.activity_last_contact(uuid,uuid,uuid),public.save_activity(uuid,jsonb,uuid[]) to authenticated;
commit;
