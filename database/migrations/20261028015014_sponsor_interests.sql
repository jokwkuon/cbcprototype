-- REQ-014/003/005/008, provisional ADR-013. Local synthetic demo only.
begin;
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
commit;
