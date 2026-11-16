-- REQ-011/008. Provisional local synthetic demo; CBC acceptance pending.
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
commit;
