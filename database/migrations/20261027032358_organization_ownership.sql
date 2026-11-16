-- REQ-001/008; ADR-010. Additive metadata + replacement of permissive write policy.
begin;
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
commit;
