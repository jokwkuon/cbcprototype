-- REQ-008: preserve the accepted role matrix while removing public definer RPCs.
begin;
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
commit;
