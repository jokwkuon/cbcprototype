-- REQ-001/002/004/005/008: owner-authorized existing hosted baseline reconciliation.
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
-- SOURCE 20261027032358_organization_ownership.sql
-- REQ-001/008; ADR-010. Additive metadata + replacement of permissive write policy.

alter table public.profiles add column is_active boolean not null default true;
create schema if not exists private;
revoke all on schema private from public;

create or replace function public.current_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;
revoke all on function public.current_role() from public, anon;
grant execute on function public.current_role() to authenticated;

-- A projection, not a broader grant on profiles. No email, role or timestamps.
create table public.staff_directory (
  id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null
);
alter table public.staff_directory enable row level security;
revoke all on public.staff_directory from public, anon, authenticated;
grant select on public.staff_directory to authenticated;
create policy "restricted active staff directory" on public.staff_directory
for select to authenticated using (
  public.current_role() = 'admin' or
  (public.current_role() = 'staff' and id = auth.uid())
);
create function private.sync_staff_directory() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'staff' and new.is_active then
    insert into public.staff_directory(id, display_name) values(new.id, new.full_name)
    on conflict(id) do update set display_name = excluded.display_name;
  else
    delete from public.staff_directory where id = new.id;
  end if;
  return new;
end $$;
revoke all on function private.sync_staff_directory() from public, anon, authenticated;
create trigger profiles_staff_directory after insert or update on public.profiles
for each row execute function private.sync_staff_directory();
insert into public.staff_directory(id, display_name)
select id, full_name from public.profiles where role = 'staff' and is_active;

create function private.validate_organization_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
declare actor_role public.app_role;
begin
  actor_role := public.current_role();
  if actor_role is null or actor_role not in ('admin','staff') then
    raise exception 'Organization changes require active Admin or Staff access.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      raise exception 'Organization identity cannot be changed.' using errcode = '42501';
    end if;
    if new.relationship_owner is not distinct from old.relationship_owner then
      return new; -- Historical assignments remain visible after deactivation.
    end if;
    if actor_role <> 'admin' then
      raise exception 'Only Admin may change relationship ownership after creation.' using errcode = '42501';
    end if;
  elsif actor_role = 'staff' and new.relationship_owner is not null and new.relationship_owner <> auth.uid() then
    raise exception 'Staff may assign only themselves on creation.' using errcode = '42501';
  end if;
  if new.relationship_owner is not null then
    -- Lock the profile during assignment to serialize against deactivation/role changes.
    perform 1 from public.profiles where id = new.relationship_owner and role = 'staff' and is_active for share;
    if not found then
      raise exception 'Select an active staff member as relationship owner.' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.validate_organization_owner() from public, anon, authenticated;
create trigger organizations_validate_owner before insert or update on public.organizations
for each row execute function private.validate_organization_owner();

-- Remove broad ALL policy: OLD/NEW comparison belongs in the trigger; RLS gates actors.
drop policy "staff can write organizations" on public.organizations;
create policy "active staff create organizations" on public.organizations for insert to authenticated
with check (public.current_role() = 'admin' or (public.current_role() = 'staff' and (relationship_owner is null or relationship_owner = auth.uid())));
create policy "active staff edit organizations" on public.organizations for update to authenticated
using (public.current_role() in ('admin','staff')) with check (public.current_role() in ('admin','staff'));
create policy "admin deletes organizations" on public.organizations for delete to authenticated
using (public.current_role() = 'admin');
-- Keep existing profile policy. Explicit grants prevent dependence on project defaults.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on public.organizations, public.contacts from anon, authenticated;
grant select, insert, update, delete on public.organizations, public.contacts to authenticated;

-- SOURCE 20261027032422_crm_fields.sql
-- REQ-001/002: manual fields only. Derived metrics deliberately have no invented defaults.

alter table public.organizations
  add column primary_contact_id uuid,
  add column estimated_opportunity numeric,
  add column location text;
alter table public.contacts
  add column contact_type text,
  add column influence_level text check (influence_level in ('High','Medium','Low')),
  add column interests text,
  add column notes text,
  add constraint contacts_organization_id_id_key unique (organization_id,id);
-- Only an explicitly selected affiliated contact can be primary; cannot silently reparent it.
alter table public.organizations add constraint organizations_primary_contact_fk
  foreign key (id,primary_contact_id) references public.contacts(organization_id,id)
  on delete set null (primary_contact_id);
alter table public.organizations add constraint organizations_estimate_finite check (estimated_opportunity is null or estimated_opportunity not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)) not valid;
create index organizations_owner_idx on public.organizations(relationship_owner);
-- Technical URL/email validation; free-text categories retain CBC flexibility.
alter table public.organizations add constraint organizations_website_http
  check (website is null or website ~* '^https?://[^[:space:]/?#]+([/?#][^[:space:]]*)?$') not valid;
alter table public.contacts add constraint contacts_email_format
  check (email is null or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') not valid;
-- NOT VALID protects existing records from an unreviewed cleanup; new writes are checked.

-- SOURCE 20261027041158_activities_followups.sql
-- REQ-005/008: additive activity log, participants and multiple follow-up actions.
-- Local validation only; hosted rollout requires explicit review.

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

-- SOURCE 20261027060754_sponsorship_giving.sql
-- REQ-003/004/006/008; approved synthetic MVP rules in ADR-012. Local rollout only.

create table public.funding_initiatives (
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('Program','Event')),
 name text not null check(length(trim(name))>0),unique(id,kind)
);
create table public.contributions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid references public.organizations(id),contact_id uuid references public.contacts(id),
 contribution_date date not null check(isfinite(contribution_date)),
 amount numeric not null check(amount>=0 and amount not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) and amount=round(amount,2)),
 currency text not null default 'CAD' check(currency='CAD'),
 contribution_type text not null check(contribution_type in ('Cash','In-Kind')),
 sponsorship_level text,funding_status text not null default 'Committed' check(funding_status in ('Prospect','Committed','Invoiced','Cancelled')),
 program_id uuid,program_kind text generated always as ('Program'::text) stored,
 event_id uuid,event_kind text generated always as ('Event'::text) stored,
 foreign key(program_id,program_kind) references public.funding_initiatives(id,kind),
 foreign key(event_id,event_kind) references public.funding_initiatives(id,kind),
 agreement_start date check(isfinite(agreement_start)),agreement_end date check(isfinite(agreement_end)),
 renewal_date date check(isfinite(renewal_date)),notes text,
 check(agreement_start is null or agreement_end is null or agreement_end>=agreement_start),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.cash_receipts (
 id uuid primary key default gen_random_uuid(),contribution_id uuid not null references public.contributions(id),
 received_on date not null check(isfinite(received_on)),
 amount numeric not null check(amount>0 and amount not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) and amount=round(amount,2)),
 reference text,is_void boolean not null default false,void_reason text,
 check(not is_void or length(trim(coalesce(void_reason,'')))>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.giving_document_links (
 id uuid primary key default gen_random_uuid(),contribution_id uuid not null references public.contributions(id),
 label text not null check(length(trim(label))>0),
 url text not null check(url ~* '^https?://[^[:space:]@/]+([/?#][^[:space:]]*)?$')
);
create index contributions_organization_date_idx on public.contributions(organization_id,contribution_date desc);
create index contributions_contact_idx on public.contributions(contact_id);
create index contributions_program_idx on public.contributions(program_id);
create index contributions_event_idx on public.contributions(event_id);
create index cash_receipts_contribution_date_idx on public.cash_receipts(contribution_id,received_on);
create index cash_receipts_active_date_idx on public.cash_receipts(received_on) where not is_void;
create index giving_document_links_contribution_idx on public.giving_document_links(contribution_id);
create trigger contributions_touch before update on public.contributions for each row execute function public.touch_updated_at();
create trigger cash_receipts_touch before update on public.cash_receipts for each row execute function public.touch_updated_at();
-- Explicit grants, default-deny anonymous. Roles follow ADR-012, not CRM write permissions.
alter table public.funding_initiatives enable row level security;
alter table public.contributions enable row level security;
alter table public.cash_receipts enable row level security;
alter table public.giving_document_links enable row level security;
revoke all on public.funding_initiatives,public.contributions,public.cash_receipts,public.giving_document_links from public,anon,authenticated;
grant select,insert,update on public.funding_initiatives,public.contributions,public.cash_receipts,public.giving_document_links to authenticated;
create policy "financial readers initiatives" on public.funding_initiatives for select to authenticated using(public.current_role() in ('admin','staff','finance','viewer'));
create policy "financial writers initiatives insert" on public.funding_initiatives for insert to authenticated with check(public.current_role() in ('admin','finance'));
create policy "financial writers initiatives update" on public.funding_initiatives for update to authenticated using(public.current_role() in ('admin','finance')) with check(public.current_role() in ('admin','finance'));
create policy "financial readers contributions" on public.contributions for select to authenticated using(public.current_role() in ('admin','staff','finance','viewer'));
create policy "financial writers contributions insert" on public.contributions for insert to authenticated with check(public.current_role() in ('admin','finance'));
create policy "financial writers contributions update" on public.contributions for update to authenticated using(public.current_role() in ('admin','finance')) with check(public.current_role() in ('admin','finance'));
create policy "financial readers receipts" on public.cash_receipts for select to authenticated using(public.current_role() in ('admin','staff','finance','viewer'));
create policy "financial writers receipts insert" on public.cash_receipts for insert to authenticated with check(public.current_role() in ('admin','finance'));
create policy "financial writers receipts update" on public.cash_receipts for update to authenticated using(public.current_role() in ('admin','finance')) with check(public.current_role() in ('admin','finance'));
create policy "financial readers references" on public.giving_document_links for select to authenticated using(public.current_role() in ('admin','staff','finance','viewer'));
create policy "financial writers references insert" on public.giving_document_links for insert to authenticated with check(public.current_role() in ('admin','finance'));
create policy "financial writers references update" on public.giving_document_links for update to authenticated using(public.current_role() in ('admin','finance')) with check(public.current_role() in ('admin','finance'));

-- Parent locks serialize type changes against receipt writes; no definer/RLS bypass.
create function private.validate_cash_receipt() returns trigger language plpgsql security invoker set search_path='' as $$
declare kind text;
begin
 if tg_op='UPDATE' and (new.id is distinct from old.id or new.contribution_id is distinct from old.contribution_id) then
  raise exception 'Receipt identity and contribution cannot be changed.' using errcode='23514';
 end if;
 select contribution_type into kind from public.contributions where id=new.contribution_id for update;
 if kind is distinct from 'Cash' then raise exception 'Cash receipts require a Cash contribution.' using errcode='23514'; end if;
 if new.received_on>public.activity_today() then raise exception 'Future amounts are pledges, not received cash.' using errcode='23514'; end if;
 return new;
end $$;
create function private.validate_contribution_edit() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.id is distinct from old.id then raise exception 'Contribution identity cannot change.' using errcode='23514'; end if;
 if new.contribution_type<>'Cash' and exists(select 1 from public.cash_receipts where contribution_id=old.id) then
  raise exception 'A contribution with cash receipt history must remain Cash.' using errcode='23514';
 end if;
 return new;
end $$;
revoke all on function private.validate_cash_receipt(),private.validate_contribution_edit() from public,anon,authenticated;
create trigger cash_receipts_validate before insert or update on public.cash_receipts for each row execute function private.validate_cash_receipt();
create trigger contributions_validate before update on public.contributions for each row execute function private.validate_contribution_edit();
create view public.giving_receipts with(security_invoker=true) as
select id,contribution_id,received_on,amount::text as amount,reference,is_void,void_reason from public.cash_receipts;
create view public.contribution_details with(security_invoker=true) as
select c.id,c.organization_id,c.contact_id,c.contribution_date,c.amount::text as amount,c.currency,c.contribution_type,
 c.sponsorship_level,c.funding_status,c.program_id,c.event_id,c.agreement_start,c.agreement_end,c.renewal_date,c.notes,
 o.name as organization_name,concat_ws(' ',ct.first_name,ct.last_name) as contact_name,p.name as program_name,e.name as event_name,
 coalesce(r.received,0)::text as cash_received,
 (case when c.contribution_type='Cash' and c.funding_status in ('Committed','Invoiced') then c.amount else 0 end)::text as pledged,
 (case when c.contribution_type='Cash' and c.funding_status in ('Committed','Invoiced') then greatest(c.amount-coalesce(r.received,0),0) else 0 end)::text as outstanding,
 case when coalesce(r.received,0)=0 then 'Unreceived' when r.received<c.amount then 'Partially Received' else 'Received' end as payment_status
from public.contributions c
left join public.organizations o on o.id=c.organization_id
left join public.contacts ct on ct.id=c.contact_id
left join public.funding_initiatives p on p.id=c.program_id
left join public.funding_initiatives e on e.id=c.event_id
left join lateral(select sum(amount) as received from public.cash_receipts where contribution_id=c.id and not is_void and received_on<=public.activity_today()) r on true;
revoke all on public.giving_receipts,public.contribution_details from public,anon,authenticated;
grant select on public.giving_receipts,public.contribution_details to authenticated;

create function public.giving_summary(p_year integer,p_organization_id uuid default null,p_contact_id uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare today date:=public.activity_today(); cutoff date;start_date date;prior_end date;current_cash numeric;prior_cash numeric;lifetime numeric;pledged numeric;outstanding numeric;in_kind numeric;
begin
 if p_year is null or p_year<2 or p_year>9999 then raise exception 'Invalid calendar year.' using errcode='22023'; end if;
 start_date:=make_date(p_year,1,1);cutoff:=least(today,make_date(p_year,12,31));
 prior_end:=(cutoff-interval '1 year')::date;
 with eligible as(select id from public.contributions where (p_organization_id is null or organization_id=p_organization_id) and (p_contact_id is null or contact_id=p_contact_id))
 select coalesce(sum(r.amount) filter(where r.received_on between start_date and cutoff),0),
 coalesce(sum(r.amount) filter(where r.received_on between (start_date-interval '1 year')::date and prior_end),0),
 coalesce(sum(r.amount),0) into current_cash,prior_cash,lifetime
 from public.cash_receipts r join eligible c on c.id=r.contribution_id where not r.is_void and r.received_on<=today;
 select coalesce(sum(d.pledged::numeric),0),coalesce(sum(d.outstanding::numeric),0),
 coalesce(sum(amount::numeric) filter(where contribution_type='In-Kind' and funding_status<>'Cancelled'),0)
 into pledged,outstanding,in_kind from public.contribution_details d where (p_organization_id is null or organization_id=p_organization_id) and (p_contact_id is null or contact_id=p_contact_id);
 return jsonb_build_object('year',p_year,'as_of',today,'period_end',cutoff,'prior_period_end',prior_end,'currency','CAD',
 'annual_cash',current_cash::text,'prior_cash',prior_cash::text,'lifetime_cash',lifetime::text,
 'pledged',pledged::text,'outstanding',outstanding::text,'in_kind_declared',in_kind::text,
 'yoy_delta',(current_cash-prior_cash)::text,'yoy_percent',case when prior_cash=0 or cutoff<start_date then null else round((current_cash-prior_cash)*100/prior_cash,2)::text end,
 'comparison_basis',case when cutoff<start_date then 'Period not started' when extract(year from today)=p_year then 'Comparable YTD' else 'Full calendar year' end);
end $$;
revoke all on function public.giving_summary(integer,uuid,uuid) from public,anon;
grant execute on function public.giving_summary(integer,uuid,uuid) to authenticated;

-- SOURCE 20261028015014_sponsor_interests.sql
-- REQ-014/003/005/008, provisional ADR-013. Local synthetic demo only.

-- Small pipeline references, not a stage machine or financial commitment.
create table public.opportunities (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 name text not null check(length(btrim(name))>0),
 estimated_amount numeric check(estimated_amount>=0 and estimated_amount not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) and estimated_amount=round(estimated_amount,2)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id)
);
create table public.sponsor_interests (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 primary_contact_id uuid, opportunity_id uuid,
 category text not null check(length(btrim(category))>0),
 strength text check(strength is null or length(btrim(strength))>0), notes text,
 archived_at timestamptz check(isfinite(archived_at)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(organization_id,primary_contact_id) references public.contacts(organization_id,id),
 foreign key(organization_id,opportunity_id) references public.opportunities(organization_id,id)
);
create table public.interest_programs (
 interest_id uuid not null references public.sponsor_interests(id),
 program_id uuid not null, program_kind text generated always as ('Program'::text) stored,
 primary key(interest_id,program_id),
 foreign key(program_id,program_kind) references public.funding_initiatives(id,kind)
);
create table public.interest_activities (
 interest_id uuid not null references public.sponsor_interests(id),
 activity_id uuid not null references public.activities(id), primary key(interest_id,activity_id)
);
-- Reuse existing tasks; no second follow-up lifecycle or copied task data.
create table public.interest_tasks (
 interest_id uuid not null references public.sponsor_interests(id),
 task_id uuid not null references public.tasks(id), primary key(interest_id,task_id)
);
create index opportunities_organization_idx on public.opportunities(organization_id);
create index sponsor_interests_org_idx on public.sponsor_interests(organization_id);
create index sponsor_interests_contact_idx on public.sponsor_interests(primary_contact_id);
create index sponsor_interests_opportunity_idx on public.sponsor_interests(opportunity_id);
create index interest_programs_program_idx on public.interest_programs(program_id);
create index interest_activities_activity_idx on public.interest_activities(activity_id);
create index interest_tasks_task_idx on public.interest_tasks(task_id);

create function private.guard_interest_metadata() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then
  new.created_at:=statement_timestamp(); new.updated_at:=new.created_at;
 else
  if new.id is distinct from old.id then raise exception 'Record identity cannot change.' using errcode='23514'; end if;
  new.created_at:=old.created_at; new.updated_at:=statement_timestamp();
 end if;
 if tg_table_name='sponsor_interests' then
  if (tg_op='INSERT' and new.archived_at is not null) or (tg_op='UPDATE' and new.archived_at is distinct from old.archived_at) then
   if public.current_role() is distinct from 'admin' then raise exception 'Only Admin may archive or restore interests.' using errcode='42501'; end if;
   if new.archived_at is not null then new.archived_at:=statement_timestamp(); end if;
  end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_interest_metadata() from public,anon,authenticated;
create trigger sponsor_interests_metadata before insert or update on public.sponsor_interests for each row execute function private.guard_interest_metadata();
create trigger opportunities_metadata before insert or update on public.opportunities for each row execute function private.guard_interest_metadata();

alter table public.opportunities enable row level security;
alter table public.sponsor_interests enable row level security;
alter table public.interest_programs enable row level security;
alter table public.interest_activities enable row level security;
alter table public.interest_tasks enable row level security;
revoke all on public.opportunities,public.sponsor_interests,public.interest_programs,public.interest_activities,public.interest_tasks from public,anon,authenticated;
grant select,insert,update on public.opportunities,public.sponsor_interests to authenticated;
-- Link replacement is allowed, but interest/opportunity hard deletion has no grant or policy.
grant select,insert,delete on public.interest_programs,public.interest_activities,public.interest_tasks to authenticated;
create policy "read opportunities" on public.opportunities for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "insert opportunities" on public.opportunities for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "update opportunities" on public.opportunities for update to authenticated using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
create policy "read sponsor_interests" on public.sponsor_interests for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "insert sponsor_interests" on public.sponsor_interests for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "update sponsor_interests" on public.sponsor_interests for update to authenticated using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
create policy "read interest_programs" on public.interest_programs for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "insert interest_programs" on public.interest_programs for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "replace interest_programs" on public.interest_programs for delete to authenticated using((select public.current_role()) in ('admin','staff'));
create policy "read interest_activities" on public.interest_activities for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "insert interest_activities" on public.interest_activities for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "replace interest_activities" on public.interest_activities for delete to authenticated using((select public.current_role()) in ('admin','staff'));
create policy "read interest_tasks" on public.interest_tasks for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "insert interest_tasks" on public.interest_tasks for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "replace interest_tasks" on public.interest_tasks for delete to authenticated using((select public.current_role()) in ('admin','staff'));
-- Invoker RPC locks the interest row so concurrent replacements cannot merge link sets.
create function public.save_interest(p_id uuid,p_values jsonb,p_programs uuid[],p_activities uuid[],p_tasks uuid[]) returns uuid
language plpgsql security invoker set search_path='' as $$
declare saved uuid;
begin
 if public.current_role() is null or public.current_role() not in ('admin','staff') then raise exception 'Active Admin or Staff required.' using errcode='42501'; end if;
 if p_id is null then
  insert into public.sponsor_interests(organization_id,primary_contact_id,opportunity_id,category,strength,notes)
  values((p_values->>'organization_id')::uuid,nullif(p_values->>'primary_contact_id','')::uuid,nullif(p_values->>'opportunity_id','')::uuid,btrim(p_values->>'category'),nullif(btrim(p_values->>'strength'),''),nullif(btrim(p_values->>'notes'),'')) returning id into saved;
 else
  update public.sponsor_interests set organization_id=(p_values->>'organization_id')::uuid,
   primary_contact_id=nullif(p_values->>'primary_contact_id','')::uuid,opportunity_id=nullif(p_values->>'opportunity_id','')::uuid,
   category=btrim(p_values->>'category'),strength=nullif(btrim(p_values->>'strength'),''),notes=nullif(btrim(p_values->>'notes'),'')
   where id=p_id returning id into saved;
  if not found then raise exception 'Interest unavailable.' using errcode='P0002'; end if;
  delete from public.interest_programs where interest_id=saved;
  delete from public.interest_activities where interest_id=saved;
  delete from public.interest_tasks where interest_id=saved;
 end if;
 insert into public.interest_programs(interest_id,program_id) select saved,x from (select distinct unnest(p_programs) x) ids;
 insert into public.interest_activities(interest_id,activity_id) select saved,x from (select distinct unnest(p_activities) x) ids;
 insert into public.interest_tasks(interest_id,task_id) select saved,x from (select distinct unnest(p_tasks) x) ids;
 return saved;
end $$;
revoke all on function public.save_interest(uuid,jsonb,uuid[],uuid[],uuid[]) from public,anon;
grant execute on function public.save_interest(uuid,jsonb,uuid[],uuid[],uuid[]) to authenticated;

create view public.interest_details with(security_invoker=true) as
select i.*,o.name as organization_name,o.relationship_owner,
 case when o.relationship_owner is null then 'Unassigned' else coalesce(d.display_name,'Assigned staff member (directory restricted or inactive)') end as owner_name,
 nullif(concat_ws(' ',c.first_name,c.last_name),'') as primary_contact_name,
 op.name as opportunity_name,op.estimated_amount::text as opportunity_amount,
 coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name) order by p.name,p.id) from public.interest_programs ip join public.funding_initiatives p on p.id=ip.program_id where ip.interest_id=i.id),'[]'::jsonb) as programs,
 last_discussion.id as last_discussion_id,last_discussion.occurred_at as last_discussed,last_discussion.purpose as last_discussion_name,
 next_task.id as next_task_id,next_task.activity_id as next_activity_id,next_task.description as next_action,next_task.due_date as next_due_date
from public.sponsor_interests i join public.organizations o on o.id=i.organization_id
left join public.contacts c on c.id=i.primary_contact_id
left join public.opportunities op on op.id=i.opportunity_id
left join public.staff_directory d on d.id=o.relationship_owner
left join lateral(select a.id,a.occurred_at,coalesce(a.purpose,a.activity_type) as purpose from public.interest_activities ia join public.activities a on a.id=ia.activity_id where ia.interest_id=i.id and a.occurred_at<=statement_timestamp() order by a.occurred_at desc,a.id limit 1) last_discussion on true
left join lateral(select t.id,t.activity_id,t.description,t.due_date from public.interest_tasks it join public.tasks t on t.id=it.task_id where it.interest_id=i.id and t.completed_at is null order by t.due_date asc nulls last,t.id limit 1) next_task on true;
revoke all on public.interest_details from public,anon,authenticated;
grant select on public.interest_details to authenticated;

-- SOURCE 20261029144615_programs_recipients.sql
-- REQ-010/002/006/008; provisional ADR-014, synthetic local MVP only.

create table public.programs (
 id uuid primary key default gen_random_uuid(),name text not null check(length(btrim(name))>0),description text,
 funding_program_id uuid unique, funding_kind text generated always as ('Program'::text) stored,
 foreign key(funding_program_id,funding_kind) references public.funding_initiatives(id,kind),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.program_cohorts (
 id uuid primary key default gen_random_uuid(),program_id uuid not null references public.programs(id),
 label text not null check(length(btrim(label))>0),year integer check(year between 1 and 9999),
 unique(program_id,id),unique(program_id,label),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.program_recipients (
 id uuid primary key default gen_random_uuid(),name text,
 contact_id uuid unique references public.contacts(id),organization_id uuid references public.organizations(id),
 foreign key(organization_id,contact_id) references public.contacts(organization_id,id),
 check(contact_id is not null or length(btrim(coalesce(name,'')))>0),
 alumni_since date check(isfinite(alumni_since)),notes text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.program_enrollments (
 id uuid primary key default gen_random_uuid(),program_id uuid not null references public.programs(id),
 cohort_id uuid not null,recipient_id uuid not null references public.program_recipients(id),
 foreign key(program_id,cohort_id) references public.program_cohorts(program_id,id),
 unique(recipient_id,cohort_id),
 support_amount numeric check(support_amount>=0 and support_amount not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) and support_amount=round(support_amount,2)),
 currency text not null default 'CAD' check(currency='CAD'),
 education_level text,institution text,field_of_study text,
 graduation_status text,graduation_date date check(isfinite(graduation_date)),
 employment_status text,employment_field text,notes text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index program_cohorts_program_idx on public.program_cohorts(program_id);
create index program_recipients_org_idx on public.program_recipients(organization_id);
create index program_enrollments_program_cohort_idx on public.program_enrollments(program_id,cohort_id);
create index program_enrollments_cohort_idx on public.program_enrollments(cohort_id);

create function private.guard_program_metadata() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then new.created_at:=statement_timestamp();
 else
  if new.id is distinct from old.id then raise exception 'Record identity cannot change.' using errcode='23514'; end if;
  new.created_at:=old.created_at;
 end if;
 new.updated_at:=statement_timestamp();
 if tg_table_name='program_recipients' then
  if new.alumni_since>public.activity_today() then raise exception 'Alumni effective date must not be future.' using errcode='23514'; end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_program_metadata() from public,anon,authenticated;
create trigger programs_metadata before insert or update on public.programs for each row execute function private.guard_program_metadata();
alter table public.programs enable row level security;
revoke all on public.programs from public,anon,authenticated;
grant select,insert,update on public.programs to authenticated;
create policy "read programs" on public.programs for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "create programs" on public.programs for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "edit programs" on public.programs for update to authenticated using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
create trigger program_cohorts_metadata before insert or update on public.program_cohorts for each row execute function private.guard_program_metadata();
alter table public.program_cohorts enable row level security;
revoke all on public.program_cohorts from public,anon,authenticated;
grant select,insert,update on public.program_cohorts to authenticated;
create policy "read program_cohorts" on public.program_cohorts for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "create program_cohorts" on public.program_cohorts for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "edit program_cohorts" on public.program_cohorts for update to authenticated using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
create trigger program_recipients_metadata before insert or update on public.program_recipients for each row execute function private.guard_program_metadata();
alter table public.program_recipients enable row level security;
revoke all on public.program_recipients from public,anon,authenticated;
grant select,insert,update on public.program_recipients to authenticated;
create policy "read program_recipients" on public.program_recipients for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "create program_recipients" on public.program_recipients for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "edit program_recipients" on public.program_recipients for update to authenticated using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
create trigger program_enrollments_metadata before insert or update on public.program_enrollments for each row execute function private.guard_program_metadata();
alter table public.program_enrollments enable row level security;
revoke all on public.program_enrollments from public,anon,authenticated;
grant select,insert,update on public.program_enrollments to authenticated;
create policy "read program_enrollments" on public.program_enrollments for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "create program_enrollments" on public.program_enrollments for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "edit program_enrollments" on public.program_enrollments for update to authenticated using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
-- Person-wide supported history; no name matching, inferred alumni status or outcome score.
create view public.program_recipient_details with(security_invoker=true) as
select r.*,case when c.id is not null then concat_ws(' ',c.first_name,c.last_name) else r.name end as display_name,
 coalesce(r.organization_id,c.organization_id) as linked_organization_id,o.name as organization_name,
 case when r.contact_id is null then null else public.activity_last_contact(p_contact_id=>r.contact_id) end as last_contact,
 case when r.contact_id is null then null else (select count(*) from public.activity_contacts ac join public.activities a on a.id=ac.activity_id where ac.contact_id=r.contact_id and a.occurred_at<=statement_timestamp()) end as recorded_interactions,
 case when r.contact_id is null or r.alumni_since is null then null else
  (select coalesce(sum(cr.amount),0)::text from public.contributions co join public.cash_receipts cr on cr.contribution_id=co.id
   where co.contact_id=r.contact_id and co.contribution_type='Cash' and not cr.is_void and cr.received_on between r.alumni_since and public.activity_today()) end as alumni_cash
from public.program_recipients r left join public.contacts c on c.id=r.contact_id
left join public.organizations o on o.id=coalesce(r.organization_id,c.organization_id);
create view public.program_enrollment_details with(security_invoker=true) as
select e.id,e.program_id,e.cohort_id,e.recipient_id,e.support_amount::text as support_amount,e.currency,
 e.education_level,e.institution,e.field_of_study,e.graduation_status,e.graduation_date,e.employment_status,e.employment_field,e.notes,e.created_at,e.updated_at,
 p.name as program_name,c.label as cohort_label,c.year as cohort_year,r.display_name as recipient_name,
 r.contact_id,r.linked_organization_id as organization_id,r.organization_name,r.alumni_since,r.last_contact,r.recorded_interactions,r.alumni_cash
from public.program_enrollments e join public.programs p on p.id=e.program_id
join public.program_cohorts c on c.id=e.cohort_id join public.program_recipient_details r on r.id=e.recipient_id;
revoke all on public.program_recipient_details,public.program_enrollment_details from public,anon,authenticated;
grant select on public.program_recipient_details,public.program_enrollment_details to authenticated;

-- Counts and known support only. No invented scholarship counts or outcome denominators.
create function public.program_summary(p_program_id uuid default null,p_cohort_id uuid default null) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if public.current_role() is null or public.current_role() not in ('admin','staff','finance','viewer') then raise exception 'Active authenticated access required.' using errcode='42501'; end if;
 select jsonb_build_object('participants',count(distinct recipient_id),'enrollments',count(*),
  'known_support',sum(support_amount)::text,'known_support_count',count(support_amount),
  'unknown_support_count',count(*)-count(support_amount),'currency','CAD') into result
 from public.program_enrollments e where (p_program_id is null or e.program_id=p_program_id) and (p_cohort_id is null or e.cohort_id=p_cohort_id);
 return result;
end $$;
revoke all on function public.program_summary(uuid,uuid) from public,anon;
grant execute on function public.program_summary(uuid,uuid) to authenticated;

-- SOURCE 20261102233024_membership.sql
-- REQ-009/008. Provisional synthetic-demo conventions; CBC approval pending.

create table public.memberships (
 id uuid primary key default gen_random_uuid(),
 contact_id uuid references public.contacts(id),
 member_organization_id uuid references public.organizations(id),
 organization_id uuid references public.organizations(id),
 foreign key(organization_id,contact_id) references public.contacts(organization_id,id),
 check(num_nonnulls(contact_id,member_organization_id)=1),
 check(member_organization_id is null or organization_id is null or member_organization_id=organization_id),
 membership_type text not null check(length(btrim(membership_type))>0),industry text,
 start_date date not null check(isfinite(start_date)),renewal_date date check(isfinite(renewal_date) and renewal_date>=start_date),
 fee numeric check(fee>=0 and fee not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) and fee=round(fee,2)),
 currency text not null default 'CAD' check(currency='CAD'),payment_status text,notes text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index memberships_contact_idx on public.memberships(contact_id);
create index memberships_member_org_idx on public.memberships(member_organization_id);
create index memberships_org_contact_idx on public.memberships(organization_id,contact_id);
create index memberships_renewal_idx on public.memberships(renewal_date);
create function private.guard_membership_metadata() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then new.created_at:=statement_timestamp();
 else
  if new.id is distinct from old.id then raise exception 'Identity cannot change.' using errcode='23514'; end if;
  new.created_at:=old.created_at;
 end if;
 new.updated_at:=statement_timestamp();return new;
end $$;
revoke all on function private.guard_membership_metadata() from public,anon,authenticated;
create trigger membership_metadata before insert or update on public.memberships for each row execute function private.guard_membership_metadata();
alter table public.memberships enable row level security;
revoke all on public.memberships from public,anon,authenticated;
grant select,insert,update on public.memberships to authenticated;
create policy "read memberships" on public.memberships for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "create memberships" on public.memberships for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "edit memberships" on public.memberships for update to authenticated using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
create view public.membership_details with(security_invoker=true) as
select m.id,m.contact_id,m.member_organization_id,m.organization_id,m.membership_type,m.industry,m.start_date,m.renewal_date,m.fee::text as fee,m.currency,m.payment_status,m.notes,m.created_at,m.updated_at,
 case when m.contact_id is not null then concat_ws(' ',c.first_name,c.last_name) else mo.name end as member_name,
 o.id as linked_organization_id,o.name as organization_name,o.relationship_owner,
 case when m.start_date>public.activity_today() then 'Scheduled' when m.renewal_date<public.activity_today() then 'Renewal overdue' else 'Current term' end as status,
 case when m.contact_id is not null then public.activity_last_contact(p_contact_id=>m.contact_id) else public.activity_last_contact(p_organization_id=>m.member_organization_id) end as last_engagement
from public.memberships m left join public.contacts c on c.id=m.contact_id
left join public.organizations mo on mo.id=m.member_organization_id
left join public.organizations o on o.id=coalesce(m.organization_id,m.member_organization_id,c.organization_id);
revoke all on public.membership_details from public,anon,authenticated;
grant select on public.membership_details to authenticated;

-- SOURCE 20261102233407_mentorship.sql
-- REQ-011/008. Provisional local synthetic demo; CBC acceptance pending.

create table public.mentorship_pairs (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),
 mentor_id uuid not null,mentee_id uuid not null,check(mentor_id<>mentee_id),
 foreign key(organization_id,mentor_id) references public.contacts(organization_id,id),
 foreign key(organization_id,mentee_id) references public.contacts(organization_id,id),
 program_id uuid not null references public.programs(id),cohort_id uuid not null,
 foreign key(program_id,cohort_id) references public.program_cohorts(program_id,id),
 start_date date not null check(isfinite(start_date)),target_end_date date check(isfinite(target_end_date) and target_end_date>=start_date),
 status text not null check(length(btrim(status))>0),checkin_frequency text,issues text,next_action text,action_due_date date check(isfinite(action_due_date)),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.mentorship_checkins (
 id uuid primary key default gen_random_uuid(),pair_id uuid not null references public.mentorship_pairs(id),
 checked_in_on date not null check(isfinite(checked_in_on)),mentor_satisfaction text,mentee_satisfaction text,feedback text,issues text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index mentorship_mentor_idx on public.mentorship_pairs(organization_id,mentor_id);
create index mentorship_mentee_idx on public.mentorship_pairs(organization_id,mentee_id);
create index mentorship_program_idx on public.mentorship_pairs(program_id,cohort_id);
create index mentorship_cohort_idx on public.mentorship_pairs(cohort_id);
create index mentorship_checkins_pair_idx on public.mentorship_checkins(pair_id,checked_in_on);
create function private.guard_mentorship_metadata() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then new.created_at:=statement_timestamp();
 else
  if new.id is distinct from old.id then raise exception 'Identity cannot change.' using errcode='23514'; end if;
  new.created_at:=old.created_at;
  if tg_table_name='mentorship_checkins' then
   if new.pair_id is distinct from old.pair_id then raise exception 'Check-in parent cannot change.' using errcode='23514'; end if;
  end if;
 end if;
 if tg_table_name='mentorship_checkins' then
  if new.checked_in_on>public.activity_today() then raise exception 'Completed check-ins cannot be future.' using errcode='23514'; end if;
 end if;
 new.updated_at:=statement_timestamp();return new;
end $$;
revoke all on function private.guard_mentorship_metadata() from public,anon,authenticated;
create trigger mentorship_pairs_metadata before insert or update on public.mentorship_pairs for each row execute function private.guard_mentorship_metadata();
alter table public.mentorship_pairs enable row level security;
revoke all on public.mentorship_pairs from public,anon,authenticated;
grant select,insert,update on public.mentorship_pairs to authenticated;
create policy "read mentorship_pairs" on public.mentorship_pairs for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "create mentorship_pairs" on public.mentorship_pairs for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "edit mentorship_pairs" on public.mentorship_pairs for update to authenticated using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
create trigger mentorship_checkins_metadata before insert or update on public.mentorship_checkins for each row execute function private.guard_mentorship_metadata();
alter table public.mentorship_checkins enable row level security;
revoke all on public.mentorship_checkins from public,anon,authenticated;
grant select,insert,update on public.mentorship_checkins to authenticated;
create policy "read mentorship_checkins" on public.mentorship_checkins for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "create mentorship_checkins" on public.mentorship_checkins for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "edit mentorship_checkins" on public.mentorship_checkins for update to authenticated using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
create view public.mentorship_details with(security_invoker=true) as
select p.*,concat_ws(' ',m.first_name,m.last_name) as mentor_name,concat_ws(' ',n.first_name,n.last_name) as mentee_name,
 o.name as organization_name,pr.name as program_name,c.label as cohort_label,
 (select max(checked_in_on) from public.mentorship_checkins x where x.pair_id=p.id) as last_checkin,
 (select count(*) from public.mentorship_checkins x where x.pair_id=p.id) as checkins_completed,
 (select mentor_satisfaction from public.mentorship_checkins x where x.pair_id=p.id order by checked_in_on desc,id limit 1) as mentor_satisfaction,
 (select mentee_satisfaction from public.mentorship_checkins x where x.pair_id=p.id order by checked_in_on desc,id limit 1) as mentee_satisfaction
from public.mentorship_pairs p join public.contacts m on m.id=p.mentor_id join public.contacts n on n.id=p.mentee_id
join public.organizations o on o.id=p.organization_id join public.programs pr on pr.id=p.program_id join public.program_cohorts c on c.id=p.cohort_id;
revoke all on public.mentorship_details from public,anon,authenticated;
grant select on public.mentorship_details to authenticated;

-- SOURCE 20261102233752_documents.sql
-- REQ-012/008. Metadata only; no binary storage or public bucket.

create table public.documents (
 id uuid primary key default gen_random_uuid(),name text not null check(length(btrim(name))>0),document_type text,
 organization_id uuid references public.organizations(id),contact_id uuid references public.contacts(id),
 foreign key(organization_id,contact_id) references public.contacts(organization_id,id),
 initiative_id uuid references public.funding_initiatives(id),agreement_id uuid references public.contributions(id),
 agreement_classification text,version text,effective_date date check(isfinite(effective_date)),expiry_date date check(isfinite(expiry_date)),
 check(effective_date is null or expiry_date is null or expiry_date>=effective_date),
 access_level text not null default 'Internal' check(access_level in ('Internal','Admin only')),
 uploaded_by uuid not null references public.profiles(id),uploaded_at timestamptz not null default now(),updated_at timestamptz not null default now(),notes text
);
create index documents_org_contact_idx on public.documents(organization_id,contact_id);
create index documents_contact_idx on public.documents(contact_id);
create index documents_initiative_idx on public.documents(initiative_id);
create index documents_agreement_idx on public.documents(agreement_id);
create index documents_uploader_idx on public.documents(uploaded_by);
create function private.guard_document_metadata() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then new.uploaded_by:=auth.uid();new.uploaded_at:=statement_timestamp();
 else
  if new.id is distinct from old.id then raise exception 'Identity cannot change.' using errcode='23514'; end if;
  new.uploaded_by:=old.uploaded_by;new.uploaded_at:=old.uploaded_at;
 end if;
 new.updated_at:=statement_timestamp();return new;
end $$;
revoke all on function private.guard_document_metadata() from public,anon,authenticated;
create trigger document_metadata before insert or update on public.documents for each row execute function private.guard_document_metadata();
alter table public.documents enable row level security;
revoke all on public.documents from public,anon,authenticated;
grant select,insert,update on public.documents to authenticated;
create policy "read documents" on public.documents for select to authenticated using((select public.current_role())='admin' or (access_level='Internal' and (select public.current_role()) in ('staff','finance','viewer')));
create policy "create documents" on public.documents for insert to authenticated with check((select public.current_role())='admin' or (access_level='Internal' and (select public.current_role())='staff'));
create policy "edit documents" on public.documents for update to authenticated using((select public.current_role())='admin' or (access_level='Internal' and (select public.current_role())='staff')) with check((select public.current_role())='admin' or (access_level='Internal' and (select public.current_role())='staff'));

-- SOURCE 20261104214044_operational_directory.sql
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

-- SOURCE 20261105002247_role_helper_hardening.sql
-- REQ-008: preserve the accepted role matrix while removing public definer RPCs.

create function private.active_profile_role() returns public.app_role
language sql stable security definer set search_path='' as $$
 select role from public.profiles where id=(select auth.uid()) and is_active
$$;
revoke all on function private.active_profile_role() from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.active_profile_role() to authenticated;
create or replace function public.current_role() returns public.app_role
language sql stable security invoker set search_path='' as $$
 select private.active_profile_role()
$$;
revoke all on function public.current_role() from public,anon;
grant execute on function public.current_role() to authenticated;
-- Trigger callers do not need an exposed RPC permission. Role is still default Viewer.
alter function public.handle_new_user() set search_path='';
revoke all on function public.handle_new_user(),public.touch_updated_at() from public,anon,authenticated;
alter function public.touch_updated_at() set search_path='';

-- Equivalent access predicates evaluated once per statement where possible.
drop policy "signed in profiles" on public.profiles;
create policy "signed in profiles" on public.profiles for select to authenticated
 using(id=(select auth.uid()) or (select public.current_role())='admin');
drop policy "staff can read organizations" on public.organizations;
create policy "staff can read organizations" on public.organizations for select to authenticated
 using((select public.current_role()) in ('admin','staff','finance','viewer'));
drop policy "active staff create organizations" on public.organizations;
create policy "active staff create organizations" on public.organizations for insert to authenticated
 with check((select public.current_role())='admin' or ((select public.current_role())='staff' and (relationship_owner is null or relationship_owner=(select auth.uid()))));
drop policy "active staff edit organizations" on public.organizations;
create policy "active staff edit organizations" on public.organizations for update to authenticated
 using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
drop policy "admin deletes organizations" on public.organizations;
create policy "admin deletes organizations" on public.organizations for delete to authenticated using((select public.current_role())='admin');
drop policy "signed in can read contacts" on public.contacts;
drop policy "staff can write contacts" on public.contacts;
create policy "signed in can read contacts" on public.contacts for select to authenticated using((select public.current_role()) in ('admin','staff','finance','viewer'));
create policy "staff create contacts" on public.contacts for insert to authenticated with check((select public.current_role()) in ('admin','staff'));
create policy "staff edit contacts" on public.contacts for update to authenticated using((select public.current_role()) in ('admin','staff')) with check((select public.current_role()) in ('admin','staff'));
create policy "staff delete contacts" on public.contacts for delete to authenticated using((select public.current_role()) in ('admin','staff'));
drop policy "restricted active staff directory" on public.staff_directory;
create policy "restricted active staff directory" on public.staff_directory for select to authenticated
 using((select public.current_role())='admin' or ((select public.current_role())='staff' and id=(select auth.uid())));

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
('202610130001','initial_crm',array['-- Existing initial_crm schema verified and adopted; no initial DDL replay.']),
('20261027032358','organization_ownership',array['-- REQ-001/008; ADR-010. Additive metadata + replacement of permissive write policy.
begin;
alter table public.profiles add column is_active boolean not null default true;
create schema if not exists private;
revoke all on schema private from public;

create or replace function public.current_role() returns public.app_role
language sql stable security definer set search_path = '''' as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;
revoke all on function public.current_role() from public, anon;
grant execute on function public.current_role() to authenticated;

-- A projection, not a broader grant on profiles. No email, role or timestamps.
create table public.staff_directory (
  id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null
);
alter table public.staff_directory enable row level security;
revoke all on public.staff_directory from public, anon, authenticated;
grant select on public.staff_directory to authenticated;
create policy "restricted active staff directory" on public.staff_directory
for select to authenticated using (
  public.current_role() = ''admin'' or
  (public.current_role() = ''staff'' and id = auth.uid())
);
create function private.sync_staff_directory() returns trigger
language plpgsql security definer set search_path = '''' as $$
begin
  if new.role = ''staff'' and new.is_active then
    insert into public.staff_directory(id, display_name) values(new.id, new.full_name)
    on conflict(id) do update set display_name = excluded.display_name;
  else
    delete from public.staff_directory where id = new.id;
  end if;
  return new;
end $$;
revoke all on function private.sync_staff_directory() from public, anon, authenticated;
create trigger profiles_staff_directory after insert or update on public.profiles
for each row execute function private.sync_staff_directory();
insert into public.staff_directory(id, display_name)
select id, full_name from public.profiles where role = ''staff'' and is_active;

create function private.validate_organization_owner() returns trigger
language plpgsql security definer set search_path = '''' as $$
declare actor_role public.app_role;
begin
  actor_role := public.current_role();
  if actor_role is null or actor_role not in (''admin'',''staff'') then
    raise exception ''Organization changes require active Admin or Staff access.'' using errcode = ''42501'';
  end if;
  if tg_op = ''UPDATE'' then
    if new.id is distinct from old.id then
      raise exception ''Organization identity cannot be changed.'' using errcode = ''42501'';
    end if;
    if new.relationship_owner is not distinct from old.relationship_owner then
      return new; -- Historical assignments remain visible after deactivation.
    end if;
    if actor_role <> ''admin'' then
      raise exception ''Only Admin may change relationship ownership after creation.'' using errcode = ''42501'';
    end if;
  elsif actor_role = ''staff'' and new.relationship_owner is not null and new.relationship_owner <> auth.uid() then
    raise exception ''Staff may assign only themselves on creation.'' using errcode = ''42501'';
  end if;
  if new.relationship_owner is not null then
    -- Lock the profile during assignment to serialize against deactivation/role changes.
    perform 1 from public.profiles where id = new.relationship_owner and role = ''staff'' and is_active for share;
    if not found then
      raise exception ''Select an active staff member as relationship owner.'' using errcode = ''23514'';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.validate_organization_owner() from public, anon, authenticated;
create trigger organizations_validate_owner before insert or update on public.organizations
for each row execute function private.validate_organization_owner();

-- Remove broad ALL policy: OLD/NEW comparison belongs in the trigger; RLS gates actors.
drop policy "staff can write organizations" on public.organizations;
create policy "active staff create organizations" on public.organizations for insert to authenticated
with check (public.current_role() = ''admin'' or (public.current_role() = ''staff'' and (relationship_owner is null or relationship_owner = auth.uid())));
create policy "active staff edit organizations" on public.organizations for update to authenticated
using (public.current_role() in (''admin'',''staff'')) with check (public.current_role() in (''admin'',''staff''));
create policy "admin deletes organizations" on public.organizations for delete to authenticated
using (public.current_role() = ''admin'');
-- Keep existing profile policy. Explicit grants prevent dependence on project defaults.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on public.organizations, public.contacts from anon, authenticated;
grant select, insert, update, delete on public.organizations, public.contacts to authenticated;
commit;
']),
('20261027032422','crm_fields',array['-- REQ-001/002: manual fields only. Derived metrics deliberately have no invented defaults.
begin;
alter table public.organizations
  add column primary_contact_id uuid,
  add column estimated_opportunity numeric,
  add column location text;
alter table public.contacts
  add column contact_type text,
  add column influence_level text check (influence_level in (''High'',''Medium'',''Low'')),
  add column interests text,
  add column notes text,
  add constraint contacts_organization_id_id_key unique (organization_id,id);
-- Only an explicitly selected affiliated contact can be primary; cannot silently reparent it.
alter table public.organizations add constraint organizations_primary_contact_fk
  foreign key (id,primary_contact_id) references public.contacts(organization_id,id)
  on delete set null (primary_contact_id);
alter table public.organizations add constraint organizations_estimate_finite check (estimated_opportunity is null or estimated_opportunity not in (''NaN''::numeric,''Infinity''::numeric,''-Infinity''::numeric)) not valid;
create index organizations_owner_idx on public.organizations(relationship_owner);
-- Technical URL/email validation; free-text categories retain CBC flexibility.
alter table public.organizations add constraint organizations_website_http
  check (website is null or website ~* ''^https?://[^[:space:]/?#]+([/?#][^[:space:]]*)?$'') not valid;
alter table public.contacts add constraint contacts_email_format
  check (email is null or email ~ ''^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'') not valid;
-- NOT VALID protects existing records from an unreviewed cleanup; new writes are checked.
commit;
']),
('20261027041158','activities_followups',array['-- REQ-005/008: additive activity log, participants and multiple follow-up actions.
-- Local validation only; hosted rollout requires explicit review.
begin;
-- Harden the existing timestamp helper reused by the new tables.
alter function public.touch_updated_at() set search_path = '''';
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
using (public.current_role() in (''admin'',''staff'',''finance'',''viewer''));
create policy "active CRM writers create activities" on public.activities for insert to authenticated
with check (public.current_role() in (''admin'',''staff''));
create policy "active CRM writers edit activities" on public.activities for update to authenticated
using (public.current_role() in (''admin'',''staff'')) with check (public.current_role() in (''admin'',''staff''));
create policy "read activity participants" on public.activity_contacts for select to authenticated
using (exists(select 1 from public.activities a where a.id=activity_id));
create policy "write activity participants" on public.activity_contacts for insert to authenticated
with check (public.current_role() in (''admin'',''staff'') and exists(select 1 from public.activities a where a.id=activity_id) and exists(select 1 from public.contacts c where c.id=contact_id));
create policy "replace activity participants" on public.activity_contacts for delete to authenticated
using (public.current_role() in (''admin'',''staff''));
create policy "read follow ups" on public.tasks for select to authenticated
using (exists(select 1 from public.activities a where a.id=activity_id));
create policy "create follow ups" on public.tasks for insert to authenticated
with check (public.current_role() in (''admin'',''staff'') and exists(select 1 from public.activities a where a.id=activity_id));
create policy "edit follow ups" on public.tasks for update to authenticated
using (public.current_role() in (''admin'',''staff'')) with check (public.current_role() in (''admin'',''staff''));

-- Reuse the restricted directory as an assignment capability; do not widen it.
create function private.validate_task_owner() returns trigger language plpgsql security invoker set search_path='''' as $$
begin
  if tg_op=''UPDATE'' then
    if new.id is distinct from old.id or new.activity_id is distinct from old.activity_id then
      raise exception ''Follow-up identity and activity cannot be changed.'' using errcode=''42501'';
    end if;
    if new.owner_id is not distinct from old.owner_id then return new; end if;
  end if;
  if new.owner_id is not null and not exists(select 1 from public.staff_directory d where d.id=new.owner_id) then
    raise exception ''Select a permitted active Staff action owner.'' using errcode=''23514'';
  end if;
  return new;
end $$;
revoke all on function private.validate_task_owner() from public,anon,authenticated;
create trigger tasks_owner before insert or update on public.tasks for each row execute function private.validate_task_owner();

create function public.activity_today() returns date language sql stable security invoker set search_path='''' as $$
 select (statement_timestamp() at time zone ''America/Edmonton'')::date
$$;
create function public.follow_up_status(p_due date,p_completed timestamptz,p_today date)
returns text language sql immutable security invoker set search_path='''' as $$
 select case when p_completed is not null then ''Complete'' when p_due < p_today then ''Overdue'' else ''Open'' end
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
returns timestamptz language sql stable security invoker set search_path='''' as $$
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
language plpgsql security invoker set search_path='''' as $$
declare saved_id uuid;
begin
  if public.current_role() is null or public.current_role() not in (''admin'',''staff'') then
    raise exception ''Active Admin or Staff required.'' using errcode=''42501'';
  end if;
  if p_id is null then
    insert into public.activities(organization_id,occurred_at,activity_type,location,purpose,key_discussion,sponsor_needs,cbc_opportunity,outcome)
    values(nullif(p_values->>''organization_id'','''')::uuid,(p_values->>''occurred_at'')::timestamptz,p_values->>''activity_type'',p_values->>''location'',p_values->>''purpose'',p_values->>''key_discussion'',p_values->>''sponsor_needs'',p_values->>''cbc_opportunity'',p_values->>''outcome'') returning id into saved_id;
  else
    update public.activities set organization_id=nullif(p_values->>''organization_id'','''')::uuid,
      occurred_at=(p_values->>''occurred_at'')::timestamptz,activity_type=p_values->>''activity_type'',
      location=p_values->>''location'',purpose=p_values->>''purpose'',key_discussion=p_values->>''key_discussion'',
      sponsor_needs=p_values->>''sponsor_needs'',cbc_opportunity=p_values->>''cbc_opportunity'',outcome=p_values->>''outcome''
    where id=p_id returning id into saved_id;
    if not found then raise exception ''Activity unavailable.'' using errcode=''P0002''; end if;
    delete from public.activity_contacts where activity_id=saved_id;
  end if;
  insert into public.activity_contacts(activity_id,contact_id)
  select saved_id,contact_id from (select distinct unnest(p_contacts) as contact_id) c;
  return saved_id;
end $$;
revoke all on function public.activity_today(),public.follow_up_status(date,timestamptz,date),public.activity_last_contact(uuid,uuid,uuid),public.save_activity(uuid,jsonb,uuid[]) from public,anon;
grant execute on function public.activity_today(),public.follow_up_status(date,timestamptz,date),public.activity_last_contact(uuid,uuid,uuid),public.save_activity(uuid,jsonb,uuid[]) to authenticated;
commit;
']),
('20261027060754','sponsorship_giving',array['-- REQ-003/004/006/008; approved synthetic MVP rules in ADR-012. Local rollout only.
begin;
create table public.funding_initiatives (
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in (''Program'',''Event'')),
 name text not null check(length(trim(name))>0),unique(id,kind)
);
create table public.contributions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid references public.organizations(id),contact_id uuid references public.contacts(id),
 contribution_date date not null check(isfinite(contribution_date)),
 amount numeric not null check(amount>=0 and amount not in (''NaN''::numeric,''Infinity''::numeric,''-Infinity''::numeric) and amount=round(amount,2)),
 currency text not null default ''CAD'' check(currency=''CAD''),
 contribution_type text not null check(contribution_type in (''Cash'',''In-Kind'')),
 sponsorship_level text,funding_status text not null default ''Committed'' check(funding_status in (''Prospect'',''Committed'',''Invoiced'',''Cancelled'')),
 program_id uuid,program_kind text generated always as (''Program''::text) stored,
 event_id uuid,event_kind text generated always as (''Event''::text) stored,
 foreign key(program_id,program_kind) references public.funding_initiatives(id,kind),
 foreign key(event_id,event_kind) references public.funding_initiatives(id,kind),
 agreement_start date check(isfinite(agreement_start)),agreement_end date check(isfinite(agreement_end)),
 renewal_date date check(isfinite(renewal_date)),notes text,
 check(agreement_start is null or agreement_end is null or agreement_end>=agreement_start),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.cash_receipts (
 id uuid primary key default gen_random_uuid(),contribution_id uuid not null references public.contributions(id),
 received_on date not null check(isfinite(received_on)),
 amount numeric not null check(amount>0 and amount not in (''NaN''::numeric,''Infinity''::numeric,''-Infinity''::numeric) and amount=round(amount,2)),
 reference text,is_void boolean not null default false,void_reason text,
 check(not is_void or length(trim(coalesce(void_reason,'''')))>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.giving_document_links (
 id uuid primary key default gen_random_uuid(),contribution_id uuid not null references public.contributions(id),
 label text not null check(length(trim(label))>0),
 url text not null check(url ~* ''^https?://[^[:space:]@/]+([/?#][^[:space:]]*)?$'')
);
create index contributions_organization_date_idx on public.contributions(organization_id,contribution_date desc);
create index contributions_contact_idx on public.contributions(contact_id);
create index contributions_program_idx on public.contributions(program_id);
create index contributions_event_idx on public.contributions(event_id);
create index cash_receipts_contribution_date_idx on public.cash_receipts(contribution_id,received_on);
create index cash_receipts_active_date_idx on public.cash_receipts(received_on) where not is_void;
create index giving_document_links_contribution_idx on public.giving_document_links(contribution_id);
create trigger contributions_touch before update on public.contributions for each row execute function public.touch_updated_at();
create trigger cash_receipts_touch before update on public.cash_receipts for each row execute function public.touch_updated_at();
-- Explicit grants, default-deny anonymous. Roles follow ADR-012, not CRM write permissions.
alter table public.funding_initiatives enable row level security;
alter table public.contributions enable row level security;
alter table public.cash_receipts enable row level security;
alter table public.giving_document_links enable row level security;
revoke all on public.funding_initiatives,public.contributions,public.cash_receipts,public.giving_document_links from public,anon,authenticated;
grant select,insert,update on public.funding_initiatives,public.contributions,public.cash_receipts,public.giving_document_links to authenticated;
create policy "financial readers initiatives" on public.funding_initiatives for select to authenticated using(public.current_role() in (''admin'',''staff'',''finance'',''viewer''));
create policy "financial writers initiatives insert" on public.funding_initiatives for insert to authenticated with check(public.current_role() in (''admin'',''finance''));
create policy "financial writers initiatives update" on public.funding_initiatives for update to authenticated using(public.current_role() in (''admin'',''finance'')) with check(public.current_role() in (''admin'',''finance''));
create policy "financial readers contributions" on public.contributions for select to authenticated using(public.current_role() in (''admin'',''staff'',''finance'',''viewer''));
create policy "financial writers contributions insert" on public.contributions for insert to authenticated with check(public.current_role() in (''admin'',''finance''));
create policy "financial writers contributions update" on public.contributions for update to authenticated using(public.current_role() in (''admin'',''finance'')) with check(public.current_role() in (''admin'',''finance''));
create policy "financial readers receipts" on public.cash_receipts for select to authenticated using(public.current_role() in (''admin'',''staff'',''finance'',''viewer''));
create policy "financial writers receipts insert" on public.cash_receipts for insert to authenticated with check(public.current_role() in (''admin'',''finance''));
create policy "financial writers receipts update" on public.cash_receipts for update to authenticated using(public.current_role() in (''admin'',''finance'')) with check(public.current_role() in (''admin'',''finance''));
create policy "financial readers references" on public.giving_document_links for select to authenticated using(public.current_role() in (''admin'',''staff'',''finance'',''viewer''));
create policy "financial writers references insert" on public.giving_document_links for insert to authenticated with check(public.current_role() in (''admin'',''finance''));
create policy "financial writers references update" on public.giving_document_links for update to authenticated using(public.current_role() in (''admin'',''finance'')) with check(public.current_role() in (''admin'',''finance''));

-- Parent locks serialize type changes against receipt writes; no definer/RLS bypass.
create function private.validate_cash_receipt() returns trigger language plpgsql security invoker set search_path='''' as $$
declare kind text;
begin
 if tg_op=''UPDATE'' and (new.id is distinct from old.id or new.contribution_id is distinct from old.contribution_id) then
  raise exception ''Receipt identity and contribution cannot be changed.'' using errcode=''23514'';
 end if;
 select contribution_type into kind from public.contributions where id=new.contribution_id for update;
 if kind is distinct from ''Cash'' then raise exception ''Cash receipts require a Cash contribution.'' using errcode=''23514''; end if;
 if new.received_on>public.activity_today() then raise exception ''Future amounts are pledges, not received cash.'' using errcode=''23514''; end if;
 return new;
end $$;
create function private.validate_contribution_edit() returns trigger language plpgsql security invoker set search_path='''' as $$
begin
 if new.id is distinct from old.id then raise exception ''Contribution identity cannot change.'' using errcode=''23514''; end if;
 if new.contribution_type<>''Cash'' and exists(select 1 from public.cash_receipts where contribution_id=old.id) then
  raise exception ''A contribution with cash receipt history must remain Cash.'' using errcode=''23514'';
 end if;
 return new;
end $$;
revoke all on function private.validate_cash_receipt(),private.validate_contribution_edit() from public,anon,authenticated;
create trigger cash_receipts_validate before insert or update on public.cash_receipts for each row execute function private.validate_cash_receipt();
create trigger contributions_validate before update on public.contributions for each row execute function private.validate_contribution_edit();
create view public.giving_receipts with(security_invoker=true) as
select id,contribution_id,received_on,amount::text as amount,reference,is_void,void_reason from public.cash_receipts;
create view public.contribution_details with(security_invoker=true) as
select c.id,c.organization_id,c.contact_id,c.contribution_date,c.amount::text as amount,c.currency,c.contribution_type,
 c.sponsorship_level,c.funding_status,c.program_id,c.event_id,c.agreement_start,c.agreement_end,c.renewal_date,c.notes,
 o.name as organization_name,concat_ws('' '',ct.first_name,ct.last_name) as contact_name,p.name as program_name,e.name as event_name,
 coalesce(r.received,0)::text as cash_received,
 (case when c.contribution_type=''Cash'' and c.funding_status in (''Committed'',''Invoiced'') then c.amount else 0 end)::text as pledged,
 (case when c.contribution_type=''Cash'' and c.funding_status in (''Committed'',''Invoiced'') then greatest(c.amount-coalesce(r.received,0),0) else 0 end)::text as outstanding,
 case when coalesce(r.received,0)=0 then ''Unreceived'' when r.received<c.amount then ''Partially Received'' else ''Received'' end as payment_status
from public.contributions c
left join public.organizations o on o.id=c.organization_id
left join public.contacts ct on ct.id=c.contact_id
left join public.funding_initiatives p on p.id=c.program_id
left join public.funding_initiatives e on e.id=c.event_id
left join lateral(select sum(amount) as received from public.cash_receipts where contribution_id=c.id and not is_void and received_on<=public.activity_today()) r on true;
revoke all on public.giving_receipts,public.contribution_details from public,anon,authenticated;
grant select on public.giving_receipts,public.contribution_details to authenticated;

create function public.giving_summary(p_year integer,p_organization_id uuid default null,p_contact_id uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='''' as $$
declare today date:=public.activity_today(); cutoff date;start_date date;prior_end date;current_cash numeric;prior_cash numeric;lifetime numeric;pledged numeric;outstanding numeric;in_kind numeric;
begin
 if p_year is null or p_year<2 or p_year>9999 then raise exception ''Invalid calendar year.'' using errcode=''22023''; end if;
 start_date:=make_date(p_year,1,1);cutoff:=least(today,make_date(p_year,12,31));
 prior_end:=(cutoff-interval ''1 year'')::date;
 with eligible as(select id from public.contributions where (p_organization_id is null or organization_id=p_organization_id) and (p_contact_id is null or contact_id=p_contact_id))
 select coalesce(sum(r.amount) filter(where r.received_on between start_date and cutoff),0),
 coalesce(sum(r.amount) filter(where r.received_on between (start_date-interval ''1 year'')::date and prior_end),0),
 coalesce(sum(r.amount),0) into current_cash,prior_cash,lifetime
 from public.cash_receipts r join eligible c on c.id=r.contribution_id where not r.is_void and r.received_on<=today;
 select coalesce(sum(d.pledged::numeric),0),coalesce(sum(d.outstanding::numeric),0),
 coalesce(sum(amount::numeric) filter(where contribution_type=''In-Kind'' and funding_status<>''Cancelled''),0)
 into pledged,outstanding,in_kind from public.contribution_details d where (p_organization_id is null or organization_id=p_organization_id) and (p_contact_id is null or contact_id=p_contact_id);
 return jsonb_build_object(''year'',p_year,''as_of'',today,''period_end'',cutoff,''prior_period_end'',prior_end,''currency'',''CAD'',
 ''annual_cash'',current_cash::text,''prior_cash'',prior_cash::text,''lifetime_cash'',lifetime::text,
 ''pledged'',pledged::text,''outstanding'',outstanding::text,''in_kind_declared'',in_kind::text,
 ''yoy_delta'',(current_cash-prior_cash)::text,''yoy_percent'',case when prior_cash=0 or cutoff<start_date then null else round((current_cash-prior_cash)*100/prior_cash,2)::text end,
 ''comparison_basis'',case when cutoff<start_date then ''Period not started'' when extract(year from today)=p_year then ''Comparable YTD'' else ''Full calendar year'' end);
end $$;
revoke all on function public.giving_summary(integer,uuid,uuid) from public,anon;
grant execute on function public.giving_summary(integer,uuid,uuid) to authenticated;
commit;
']),
('20261028015014','sponsor_interests',array['-- REQ-014/003/005/008, provisional ADR-013. Local synthetic demo only.
begin;
-- Small pipeline references, not a stage machine or financial commitment.
create table public.opportunities (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 name text not null check(length(btrim(name))>0),
 estimated_amount numeric check(estimated_amount>=0 and estimated_amount not in (''NaN''::numeric,''Infinity''::numeric,''-Infinity''::numeric) and estimated_amount=round(estimated_amount,2)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id)
);
create table public.sponsor_interests (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 primary_contact_id uuid, opportunity_id uuid,
 category text not null check(length(btrim(category))>0),
 strength text check(strength is null or length(btrim(strength))>0), notes text,
 archived_at timestamptz check(isfinite(archived_at)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(organization_id,primary_contact_id) references public.contacts(organization_id,id),
 foreign key(organization_id,opportunity_id) references public.opportunities(organization_id,id)
);
create table public.interest_programs (
 interest_id uuid not null references public.sponsor_interests(id),
 program_id uuid not null, program_kind text generated always as (''Program''::text) stored,
 primary key(interest_id,program_id),
 foreign key(program_id,program_kind) references public.funding_initiatives(id,kind)
);
create table public.interest_activities (
 interest_id uuid not null references public.sponsor_interests(id),
 activity_id uuid not null references public.activities(id), primary key(interest_id,activity_id)
);
-- Reuse existing tasks; no second follow-up lifecycle or copied task data.
create table public.interest_tasks (
 interest_id uuid not null references public.sponsor_interests(id),
 task_id uuid not null references public.tasks(id), primary key(interest_id,task_id)
);
create index opportunities_organization_idx on public.opportunities(organization_id);
create index sponsor_interests_org_idx on public.sponsor_interests(organization_id);
create index sponsor_interests_contact_idx on public.sponsor_interests(primary_contact_id);
create index sponsor_interests_opportunity_idx on public.sponsor_interests(opportunity_id);
create index interest_programs_program_idx on public.interest_programs(program_id);
create index interest_activities_activity_idx on public.interest_activities(activity_id);
create index interest_tasks_task_idx on public.interest_tasks(task_id);

create function private.guard_interest_metadata() returns trigger language plpgsql security invoker set search_path='''' as $$
begin
 if tg_op=''INSERT'' then
  new.created_at:=statement_timestamp(); new.updated_at:=new.created_at;
 else
  if new.id is distinct from old.id then raise exception ''Record identity cannot change.'' using errcode=''23514''; end if;
  new.created_at:=old.created_at; new.updated_at:=statement_timestamp();
 end if;
 if tg_table_name=''sponsor_interests'' then
  if (tg_op=''INSERT'' and new.archived_at is not null) or (tg_op=''UPDATE'' and new.archived_at is distinct from old.archived_at) then
   if public.current_role() is distinct from ''admin'' then raise exception ''Only Admin may archive or restore interests.'' using errcode=''42501''; end if;
   if new.archived_at is not null then new.archived_at:=statement_timestamp(); end if;
  end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_interest_metadata() from public,anon,authenticated;
create trigger sponsor_interests_metadata before insert or update on public.sponsor_interests for each row execute function private.guard_interest_metadata();
create trigger opportunities_metadata before insert or update on public.opportunities for each row execute function private.guard_interest_metadata();

alter table public.opportunities enable row level security;
alter table public.sponsor_interests enable row level security;
alter table public.interest_programs enable row level security;
alter table public.interest_activities enable row level security;
alter table public.interest_tasks enable row level security;
revoke all on public.opportunities,public.sponsor_interests,public.interest_programs,public.interest_activities,public.interest_tasks from public,anon,authenticated;
grant select,insert,update on public.opportunities,public.sponsor_interests to authenticated;
-- Link replacement is allowed, but interest/opportunity hard deletion has no grant or policy.
grant select,insert,delete on public.interest_programs,public.interest_activities,public.interest_tasks to authenticated;
create policy "read opportunities" on public.opportunities for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "insert opportunities" on public.opportunities for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "update opportunities" on public.opportunities for update to authenticated using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
create policy "read sponsor_interests" on public.sponsor_interests for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "insert sponsor_interests" on public.sponsor_interests for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "update sponsor_interests" on public.sponsor_interests for update to authenticated using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
create policy "read interest_programs" on public.interest_programs for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "insert interest_programs" on public.interest_programs for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "replace interest_programs" on public.interest_programs for delete to authenticated using((select public.current_role()) in (''admin'',''staff''));
create policy "read interest_activities" on public.interest_activities for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "insert interest_activities" on public.interest_activities for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "replace interest_activities" on public.interest_activities for delete to authenticated using((select public.current_role()) in (''admin'',''staff''));
create policy "read interest_tasks" on public.interest_tasks for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "insert interest_tasks" on public.interest_tasks for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "replace interest_tasks" on public.interest_tasks for delete to authenticated using((select public.current_role()) in (''admin'',''staff''));
-- Invoker RPC locks the interest row so concurrent replacements cannot merge link sets.
create function public.save_interest(p_id uuid,p_values jsonb,p_programs uuid[],p_activities uuid[],p_tasks uuid[]) returns uuid
language plpgsql security invoker set search_path='''' as $$
declare saved uuid;
begin
 if public.current_role() is null or public.current_role() not in (''admin'',''staff'') then raise exception ''Active Admin or Staff required.'' using errcode=''42501''; end if;
 if p_id is null then
  insert into public.sponsor_interests(organization_id,primary_contact_id,opportunity_id,category,strength,notes)
  values((p_values->>''organization_id'')::uuid,nullif(p_values->>''primary_contact_id'','''')::uuid,nullif(p_values->>''opportunity_id'','''')::uuid,btrim(p_values->>''category''),nullif(btrim(p_values->>''strength''),''''),nullif(btrim(p_values->>''notes''),'''')) returning id into saved;
 else
  update public.sponsor_interests set organization_id=(p_values->>''organization_id'')::uuid,
   primary_contact_id=nullif(p_values->>''primary_contact_id'','''')::uuid,opportunity_id=nullif(p_values->>''opportunity_id'','''')::uuid,
   category=btrim(p_values->>''category''),strength=nullif(btrim(p_values->>''strength''),''''),notes=nullif(btrim(p_values->>''notes''),'''')
   where id=p_id returning id into saved;
  if not found then raise exception ''Interest unavailable.'' using errcode=''P0002''; end if;
  delete from public.interest_programs where interest_id=saved;
  delete from public.interest_activities where interest_id=saved;
  delete from public.interest_tasks where interest_id=saved;
 end if;
 insert into public.interest_programs(interest_id,program_id) select saved,x from (select distinct unnest(p_programs) x) ids;
 insert into public.interest_activities(interest_id,activity_id) select saved,x from (select distinct unnest(p_activities) x) ids;
 insert into public.interest_tasks(interest_id,task_id) select saved,x from (select distinct unnest(p_tasks) x) ids;
 return saved;
end $$;
revoke all on function public.save_interest(uuid,jsonb,uuid[],uuid[],uuid[]) from public,anon;
grant execute on function public.save_interest(uuid,jsonb,uuid[],uuid[],uuid[]) to authenticated;

create view public.interest_details with(security_invoker=true) as
select i.*,o.name as organization_name,o.relationship_owner,
 case when o.relationship_owner is null then ''Unassigned'' else coalesce(d.display_name,''Assigned staff member (directory restricted or inactive)'') end as owner_name,
 nullif(concat_ws('' '',c.first_name,c.last_name),'''') as primary_contact_name,
 op.name as opportunity_name,op.estimated_amount::text as opportunity_amount,
 coalesce((select jsonb_agg(jsonb_build_object(''id'',p.id,''name'',p.name) order by p.name,p.id) from public.interest_programs ip join public.funding_initiatives p on p.id=ip.program_id where ip.interest_id=i.id),''[]''::jsonb) as programs,
 last_discussion.id as last_discussion_id,last_discussion.occurred_at as last_discussed,last_discussion.purpose as last_discussion_name,
 next_task.id as next_task_id,next_task.activity_id as next_activity_id,next_task.description as next_action,next_task.due_date as next_due_date
from public.sponsor_interests i join public.organizations o on o.id=i.organization_id
left join public.contacts c on c.id=i.primary_contact_id
left join public.opportunities op on op.id=i.opportunity_id
left join public.staff_directory d on d.id=o.relationship_owner
left join lateral(select a.id,a.occurred_at,coalesce(a.purpose,a.activity_type) as purpose from public.interest_activities ia join public.activities a on a.id=ia.activity_id where ia.interest_id=i.id and a.occurred_at<=statement_timestamp() order by a.occurred_at desc,a.id limit 1) last_discussion on true
left join lateral(select t.id,t.activity_id,t.description,t.due_date from public.interest_tasks it join public.tasks t on t.id=it.task_id where it.interest_id=i.id and t.completed_at is null order by t.due_date asc nulls last,t.id limit 1) next_task on true;
revoke all on public.interest_details from public,anon,authenticated;
grant select on public.interest_details to authenticated;
commit;
']),
('20261029144615','programs_recipients',array['-- REQ-010/002/006/008; provisional ADR-014, synthetic local MVP only.
begin;
create table public.programs (
 id uuid primary key default gen_random_uuid(),name text not null check(length(btrim(name))>0),description text,
 funding_program_id uuid unique, funding_kind text generated always as (''Program''::text) stored,
 foreign key(funding_program_id,funding_kind) references public.funding_initiatives(id,kind),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.program_cohorts (
 id uuid primary key default gen_random_uuid(),program_id uuid not null references public.programs(id),
 label text not null check(length(btrim(label))>0),year integer check(year between 1 and 9999),
 unique(program_id,id),unique(program_id,label),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.program_recipients (
 id uuid primary key default gen_random_uuid(),name text,
 contact_id uuid unique references public.contacts(id),organization_id uuid references public.organizations(id),
 foreign key(organization_id,contact_id) references public.contacts(organization_id,id),
 check(contact_id is not null or length(btrim(coalesce(name,'''')))>0),
 alumni_since date check(isfinite(alumni_since)),notes text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.program_enrollments (
 id uuid primary key default gen_random_uuid(),program_id uuid not null references public.programs(id),
 cohort_id uuid not null,recipient_id uuid not null references public.program_recipients(id),
 foreign key(program_id,cohort_id) references public.program_cohorts(program_id,id),
 unique(recipient_id,cohort_id),
 support_amount numeric check(support_amount>=0 and support_amount not in (''NaN''::numeric,''Infinity''::numeric,''-Infinity''::numeric) and support_amount=round(support_amount,2)),
 currency text not null default ''CAD'' check(currency=''CAD''),
 education_level text,institution text,field_of_study text,
 graduation_status text,graduation_date date check(isfinite(graduation_date)),
 employment_status text,employment_field text,notes text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index program_cohorts_program_idx on public.program_cohorts(program_id);
create index program_recipients_org_idx on public.program_recipients(organization_id);
create index program_enrollments_program_cohort_idx on public.program_enrollments(program_id,cohort_id);
create index program_enrollments_cohort_idx on public.program_enrollments(cohort_id);

create function private.guard_program_metadata() returns trigger language plpgsql security invoker set search_path='''' as $$
begin
 if tg_op=''INSERT'' then new.created_at:=statement_timestamp();
 else
  if new.id is distinct from old.id then raise exception ''Record identity cannot change.'' using errcode=''23514''; end if;
  new.created_at:=old.created_at;
 end if;
 new.updated_at:=statement_timestamp();
 if tg_table_name=''program_recipients'' then
  if new.alumni_since>public.activity_today() then raise exception ''Alumni effective date must not be future.'' using errcode=''23514''; end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_program_metadata() from public,anon,authenticated;
create trigger programs_metadata before insert or update on public.programs for each row execute function private.guard_program_metadata();
alter table public.programs enable row level security;
revoke all on public.programs from public,anon,authenticated;
grant select,insert,update on public.programs to authenticated;
create policy "read programs" on public.programs for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "create programs" on public.programs for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "edit programs" on public.programs for update to authenticated using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
create trigger program_cohorts_metadata before insert or update on public.program_cohorts for each row execute function private.guard_program_metadata();
alter table public.program_cohorts enable row level security;
revoke all on public.program_cohorts from public,anon,authenticated;
grant select,insert,update on public.program_cohorts to authenticated;
create policy "read program_cohorts" on public.program_cohorts for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "create program_cohorts" on public.program_cohorts for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "edit program_cohorts" on public.program_cohorts for update to authenticated using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
create trigger program_recipients_metadata before insert or update on public.program_recipients for each row execute function private.guard_program_metadata();
alter table public.program_recipients enable row level security;
revoke all on public.program_recipients from public,anon,authenticated;
grant select,insert,update on public.program_recipients to authenticated;
create policy "read program_recipients" on public.program_recipients for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "create program_recipients" on public.program_recipients for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "edit program_recipients" on public.program_recipients for update to authenticated using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
create trigger program_enrollments_metadata before insert or update on public.program_enrollments for each row execute function private.guard_program_metadata();
alter table public.program_enrollments enable row level security;
revoke all on public.program_enrollments from public,anon,authenticated;
grant select,insert,update on public.program_enrollments to authenticated;
create policy "read program_enrollments" on public.program_enrollments for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "create program_enrollments" on public.program_enrollments for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "edit program_enrollments" on public.program_enrollments for update to authenticated using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
-- Person-wide supported history; no name matching, inferred alumni status or outcome score.
create view public.program_recipient_details with(security_invoker=true) as
select r.*,case when c.id is not null then concat_ws('' '',c.first_name,c.last_name) else r.name end as display_name,
 coalesce(r.organization_id,c.organization_id) as linked_organization_id,o.name as organization_name,
 case when r.contact_id is null then null else public.activity_last_contact(p_contact_id=>r.contact_id) end as last_contact,
 case when r.contact_id is null then null else (select count(*) from public.activity_contacts ac join public.activities a on a.id=ac.activity_id where ac.contact_id=r.contact_id and a.occurred_at<=statement_timestamp()) end as recorded_interactions,
 case when r.contact_id is null or r.alumni_since is null then null else
  (select coalesce(sum(cr.amount),0)::text from public.contributions co join public.cash_receipts cr on cr.contribution_id=co.id
   where co.contact_id=r.contact_id and co.contribution_type=''Cash'' and not cr.is_void and cr.received_on between r.alumni_since and public.activity_today()) end as alumni_cash
from public.program_recipients r left join public.contacts c on c.id=r.contact_id
left join public.organizations o on o.id=coalesce(r.organization_id,c.organization_id);
create view public.program_enrollment_details with(security_invoker=true) as
select e.id,e.program_id,e.cohort_id,e.recipient_id,e.support_amount::text as support_amount,e.currency,
 e.education_level,e.institution,e.field_of_study,e.graduation_status,e.graduation_date,e.employment_status,e.employment_field,e.notes,e.created_at,e.updated_at,
 p.name as program_name,c.label as cohort_label,c.year as cohort_year,r.display_name as recipient_name,
 r.contact_id,r.linked_organization_id as organization_id,r.organization_name,r.alumni_since,r.last_contact,r.recorded_interactions,r.alumni_cash
from public.program_enrollments e join public.programs p on p.id=e.program_id
join public.program_cohorts c on c.id=e.cohort_id join public.program_recipient_details r on r.id=e.recipient_id;
revoke all on public.program_recipient_details,public.program_enrollment_details from public,anon,authenticated;
grant select on public.program_recipient_details,public.program_enrollment_details to authenticated;

-- Counts and known support only. No invented scholarship counts or outcome denominators.
create function public.program_summary(p_program_id uuid default null,p_cohort_id uuid default null) returns jsonb
language plpgsql stable security invoker set search_path='''' as $$
declare result jsonb;
begin
 if public.current_role() is null or public.current_role() not in (''admin'',''staff'',''finance'',''viewer'') then raise exception ''Active authenticated access required.'' using errcode=''42501''; end if;
 select jsonb_build_object(''participants'',count(distinct recipient_id),''enrollments'',count(*),
  ''known_support'',sum(support_amount)::text,''known_support_count'',count(support_amount),
  ''unknown_support_count'',count(*)-count(support_amount),''currency'',''CAD'') into result
 from public.program_enrollments e where (p_program_id is null or e.program_id=p_program_id) and (p_cohort_id is null or e.cohort_id=p_cohort_id);
 return result;
end $$;
revoke all on function public.program_summary(uuid,uuid) from public,anon;
grant execute on function public.program_summary(uuid,uuid) to authenticated;
commit;
']),
('20261102233024','membership',array['-- REQ-009/008. Provisional synthetic-demo conventions; CBC approval pending.
begin;
create table public.memberships (
 id uuid primary key default gen_random_uuid(),
 contact_id uuid references public.contacts(id),
 member_organization_id uuid references public.organizations(id),
 organization_id uuid references public.organizations(id),
 foreign key(organization_id,contact_id) references public.contacts(organization_id,id),
 check(num_nonnulls(contact_id,member_organization_id)=1),
 check(member_organization_id is null or organization_id is null or member_organization_id=organization_id),
 membership_type text not null check(length(btrim(membership_type))>0),industry text,
 start_date date not null check(isfinite(start_date)),renewal_date date check(isfinite(renewal_date) and renewal_date>=start_date),
 fee numeric check(fee>=0 and fee not in (''NaN''::numeric,''Infinity''::numeric,''-Infinity''::numeric) and fee=round(fee,2)),
 currency text not null default ''CAD'' check(currency=''CAD''),payment_status text,notes text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index memberships_contact_idx on public.memberships(contact_id);
create index memberships_member_org_idx on public.memberships(member_organization_id);
create index memberships_org_contact_idx on public.memberships(organization_id,contact_id);
create index memberships_renewal_idx on public.memberships(renewal_date);
create function private.guard_membership_metadata() returns trigger language plpgsql security invoker set search_path='''' as $$
begin
 if tg_op=''INSERT'' then new.created_at:=statement_timestamp();
 else
  if new.id is distinct from old.id then raise exception ''Identity cannot change.'' using errcode=''23514''; end if;
  new.created_at:=old.created_at;
 end if;
 new.updated_at:=statement_timestamp();return new;
end $$;
revoke all on function private.guard_membership_metadata() from public,anon,authenticated;
create trigger membership_metadata before insert or update on public.memberships for each row execute function private.guard_membership_metadata();
alter table public.memberships enable row level security;
revoke all on public.memberships from public,anon,authenticated;
grant select,insert,update on public.memberships to authenticated;
create policy "read memberships" on public.memberships for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "create memberships" on public.memberships for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "edit memberships" on public.memberships for update to authenticated using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
create view public.membership_details with(security_invoker=true) as
select m.id,m.contact_id,m.member_organization_id,m.organization_id,m.membership_type,m.industry,m.start_date,m.renewal_date,m.fee::text as fee,m.currency,m.payment_status,m.notes,m.created_at,m.updated_at,
 case when m.contact_id is not null then concat_ws('' '',c.first_name,c.last_name) else mo.name end as member_name,
 o.id as linked_organization_id,o.name as organization_name,o.relationship_owner,
 case when m.start_date>public.activity_today() then ''Scheduled'' when m.renewal_date<public.activity_today() then ''Renewal overdue'' else ''Current term'' end as status,
 case when m.contact_id is not null then public.activity_last_contact(p_contact_id=>m.contact_id) else public.activity_last_contact(p_organization_id=>m.member_organization_id) end as last_engagement
from public.memberships m left join public.contacts c on c.id=m.contact_id
left join public.organizations mo on mo.id=m.member_organization_id
left join public.organizations o on o.id=coalesce(m.organization_id,m.member_organization_id,c.organization_id);
revoke all on public.membership_details from public,anon,authenticated;
grant select on public.membership_details to authenticated;
commit;
']),
('20261102233407','mentorship',array['-- REQ-011/008. Provisional local synthetic demo; CBC acceptance pending.
begin;
create table public.mentorship_pairs (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),
 mentor_id uuid not null,mentee_id uuid not null,check(mentor_id<>mentee_id),
 foreign key(organization_id,mentor_id) references public.contacts(organization_id,id),
 foreign key(organization_id,mentee_id) references public.contacts(organization_id,id),
 program_id uuid not null references public.programs(id),cohort_id uuid not null,
 foreign key(program_id,cohort_id) references public.program_cohorts(program_id,id),
 start_date date not null check(isfinite(start_date)),target_end_date date check(isfinite(target_end_date) and target_end_date>=start_date),
 status text not null check(length(btrim(status))>0),checkin_frequency text,issues text,next_action text,action_due_date date check(isfinite(action_due_date)),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.mentorship_checkins (
 id uuid primary key default gen_random_uuid(),pair_id uuid not null references public.mentorship_pairs(id),
 checked_in_on date not null check(isfinite(checked_in_on)),mentor_satisfaction text,mentee_satisfaction text,feedback text,issues text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index mentorship_mentor_idx on public.mentorship_pairs(organization_id,mentor_id);
create index mentorship_mentee_idx on public.mentorship_pairs(organization_id,mentee_id);
create index mentorship_program_idx on public.mentorship_pairs(program_id,cohort_id);
create index mentorship_cohort_idx on public.mentorship_pairs(cohort_id);
create index mentorship_checkins_pair_idx on public.mentorship_checkins(pair_id,checked_in_on);
create function private.guard_mentorship_metadata() returns trigger language plpgsql security invoker set search_path='''' as $$
begin
 if tg_op=''INSERT'' then new.created_at:=statement_timestamp();
 else
  if new.id is distinct from old.id then raise exception ''Identity cannot change.'' using errcode=''23514''; end if;
  new.created_at:=old.created_at;
  if tg_table_name=''mentorship_checkins'' then
   if new.pair_id is distinct from old.pair_id then raise exception ''Check-in parent cannot change.'' using errcode=''23514''; end if;
  end if;
 end if;
 if tg_table_name=''mentorship_checkins'' then
  if new.checked_in_on>public.activity_today() then raise exception ''Completed check-ins cannot be future.'' using errcode=''23514''; end if;
 end if;
 new.updated_at:=statement_timestamp();return new;
end $$;
revoke all on function private.guard_mentorship_metadata() from public,anon,authenticated;
create trigger mentorship_pairs_metadata before insert or update on public.mentorship_pairs for each row execute function private.guard_mentorship_metadata();
alter table public.mentorship_pairs enable row level security;
revoke all on public.mentorship_pairs from public,anon,authenticated;
grant select,insert,update on public.mentorship_pairs to authenticated;
create policy "read mentorship_pairs" on public.mentorship_pairs for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "create mentorship_pairs" on public.mentorship_pairs for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "edit mentorship_pairs" on public.mentorship_pairs for update to authenticated using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
create trigger mentorship_checkins_metadata before insert or update on public.mentorship_checkins for each row execute function private.guard_mentorship_metadata();
alter table public.mentorship_checkins enable row level security;
revoke all on public.mentorship_checkins from public,anon,authenticated;
grant select,insert,update on public.mentorship_checkins to authenticated;
create policy "read mentorship_checkins" on public.mentorship_checkins for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "create mentorship_checkins" on public.mentorship_checkins for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "edit mentorship_checkins" on public.mentorship_checkins for update to authenticated using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
create view public.mentorship_details with(security_invoker=true) as
select p.*,concat_ws('' '',m.first_name,m.last_name) as mentor_name,concat_ws('' '',n.first_name,n.last_name) as mentee_name,
 o.name as organization_name,pr.name as program_name,c.label as cohort_label,
 (select max(checked_in_on) from public.mentorship_checkins x where x.pair_id=p.id) as last_checkin,
 (select count(*) from public.mentorship_checkins x where x.pair_id=p.id) as checkins_completed,
 (select mentor_satisfaction from public.mentorship_checkins x where x.pair_id=p.id order by checked_in_on desc,id limit 1) as mentor_satisfaction,
 (select mentee_satisfaction from public.mentorship_checkins x where x.pair_id=p.id order by checked_in_on desc,id limit 1) as mentee_satisfaction
from public.mentorship_pairs p join public.contacts m on m.id=p.mentor_id join public.contacts n on n.id=p.mentee_id
join public.organizations o on o.id=p.organization_id join public.programs pr on pr.id=p.program_id join public.program_cohorts c on c.id=p.cohort_id;
revoke all on public.mentorship_details from public,anon,authenticated;
grant select on public.mentorship_details to authenticated;
commit;
']),
('20261102233752','documents',array['-- REQ-012/008. Metadata only; no binary storage or public bucket.
begin;
create table public.documents (
 id uuid primary key default gen_random_uuid(),name text not null check(length(btrim(name))>0),document_type text,
 organization_id uuid references public.organizations(id),contact_id uuid references public.contacts(id),
 foreign key(organization_id,contact_id) references public.contacts(organization_id,id),
 initiative_id uuid references public.funding_initiatives(id),agreement_id uuid references public.contributions(id),
 agreement_classification text,version text,effective_date date check(isfinite(effective_date)),expiry_date date check(isfinite(expiry_date)),
 check(effective_date is null or expiry_date is null or expiry_date>=effective_date),
 access_level text not null default ''Internal'' check(access_level in (''Internal'',''Admin only'')),
 uploaded_by uuid not null references public.profiles(id),uploaded_at timestamptz not null default now(),updated_at timestamptz not null default now(),notes text
);
create index documents_org_contact_idx on public.documents(organization_id,contact_id);
create index documents_contact_idx on public.documents(contact_id);
create index documents_initiative_idx on public.documents(initiative_id);
create index documents_agreement_idx on public.documents(agreement_id);
create index documents_uploader_idx on public.documents(uploaded_by);
create function private.guard_document_metadata() returns trigger language plpgsql security invoker set search_path='''' as $$
begin
 if tg_op=''INSERT'' then new.uploaded_by:=auth.uid();new.uploaded_at:=statement_timestamp();
 else
  if new.id is distinct from old.id then raise exception ''Identity cannot change.'' using errcode=''23514''; end if;
  new.uploaded_by:=old.uploaded_by;new.uploaded_at:=old.uploaded_at;
 end if;
 new.updated_at:=statement_timestamp();return new;
end $$;
revoke all on function private.guard_document_metadata() from public,anon,authenticated;
create trigger document_metadata before insert or update on public.documents for each row execute function private.guard_document_metadata();
alter table public.documents enable row level security;
revoke all on public.documents from public,anon,authenticated;
grant select,insert,update on public.documents to authenticated;
create policy "read documents" on public.documents for select to authenticated using((select public.current_role())=''admin'' or (access_level=''Internal'' and (select public.current_role()) in (''staff'',''finance'',''viewer'')));
create policy "create documents" on public.documents for insert to authenticated with check((select public.current_role())=''admin'' or (access_level=''Internal'' and (select public.current_role())=''staff''));
create policy "edit documents" on public.documents for update to authenticated using((select public.current_role())=''admin'' or (access_level=''Internal'' and (select public.current_role())=''staff'')) with check((select public.current_role())=''admin'' or (access_level=''Internal'' and (select public.current_role())=''staff''));
commit;
']),
('20261104214044','operational_directory',array['-- REQ-001/002/008: bounded directory reads. Invoker views preserve base-table RLS.
-- No lifecycle, affiliation, finance or access-policy changes.
create view public.organization_directory with (security_invoker=true) as
select id, name, coalesce(industry,''Industry not recorded'') as context,
 relationship_status::text as status, coalesce(organization_type,''Type not recorded'') as category,
 coalesce(organization_type,'''') as "categoryId", coalesce(location,'''') as location,
 priority_level as priority, ''''::text as email,
 concat_ws('' '',name,industry,organization_type,location,id::text) as search_text
from public.organizations;
create view public.contact_directory with (security_invoker=true) as
select c.id, concat_ws('' '',c.first_name,c.last_name) as name,
 coalesce(c.title,''Title not recorded'') as context, coalesce(c.contact_type,''Type not recorded'') as status,
 coalesce(o.name,''Not linked'') as category, coalesce(c.organization_id::text,'''') as "categoryId",
 coalesce(c.email,'''') as email, ''''::text as location, ''''::text as priority,
 concat_ws('' '',c.first_name,c.last_name,c.title,o.name,c.email,c.id::text) as search_text
from public.contacts c left join public.organizations o on o.id=c.organization_id;
revoke all on public.organization_directory,public.contact_directory from public,anon,authenticated;
grant select on public.organization_directory,public.contact_directory to authenticated;
']),
('20261105002247','role_helper_hardening',array['-- REQ-008: preserve the accepted role matrix while removing public definer RPCs.
begin;
create function private.active_profile_role() returns public.app_role
language sql stable security definer set search_path='''' as $$
 select role from public.profiles where id=(select auth.uid()) and is_active
$$;
revoke all on function private.active_profile_role() from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.active_profile_role() to authenticated;
create or replace function public.current_role() returns public.app_role
language sql stable security invoker set search_path='''' as $$
 select private.active_profile_role()
$$;
revoke all on function public.current_role() from public,anon;
grant execute on function public.current_role() to authenticated;
-- Trigger callers do not need an exposed RPC permission. Role is still default Viewer.
alter function public.handle_new_user() set search_path='''';
revoke all on function public.handle_new_user(),public.touch_updated_at() from public,anon,authenticated;
alter function public.touch_updated_at() set search_path='''';

-- Equivalent access predicates evaluated once per statement where possible.
drop policy "signed in profiles" on public.profiles;
create policy "signed in profiles" on public.profiles for select to authenticated
 using(id=(select auth.uid()) or (select public.current_role())=''admin'');
drop policy "staff can read organizations" on public.organizations;
create policy "staff can read organizations" on public.organizations for select to authenticated
 using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
drop policy "active staff create organizations" on public.organizations;
create policy "active staff create organizations" on public.organizations for insert to authenticated
 with check((select public.current_role())=''admin'' or ((select public.current_role())=''staff'' and (relationship_owner is null or relationship_owner=(select auth.uid()))));
drop policy "active staff edit organizations" on public.organizations;
create policy "active staff edit organizations" on public.organizations for update to authenticated
 using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
drop policy "admin deletes organizations" on public.organizations;
create policy "admin deletes organizations" on public.organizations for delete to authenticated using((select public.current_role())=''admin'');
drop policy "signed in can read contacts" on public.contacts;
drop policy "staff can write contacts" on public.contacts;
create policy "signed in can read contacts" on public.contacts for select to authenticated using((select public.current_role()) in (''admin'',''staff'',''finance'',''viewer''));
create policy "staff create contacts" on public.contacts for insert to authenticated with check((select public.current_role()) in (''admin'',''staff''));
create policy "staff edit contacts" on public.contacts for update to authenticated using((select public.current_role()) in (''admin'',''staff'')) with check((select public.current_role()) in (''admin'',''staff''));
create policy "staff delete contacts" on public.contacts for delete to authenticated using((select public.current_role()) in (''admin'',''staff''));
drop policy "restricted active staff directory" on public.staff_directory;
create policy "restricted active staff directory" on public.staff_directory for select to authenticated
 using((select public.current_role())=''admin'' or ((select public.current_role())=''staff'' and id=(select auth.uid())));
commit;
']);
notify pgrst,'reload schema';
commit;
