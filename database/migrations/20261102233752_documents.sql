-- REQ-012/008. Metadata only; no binary storage or public bucket.
begin;
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
commit;
