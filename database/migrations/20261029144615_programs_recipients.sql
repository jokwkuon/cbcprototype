-- REQ-010/002/006/008; provisional ADR-014, synthetic local MVP only.
begin;
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
commit;
