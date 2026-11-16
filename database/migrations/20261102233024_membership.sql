-- REQ-009/008. Provisional synthetic-demo conventions; CBC approval pending.
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
commit;
