-- REQ-001/002: manual fields only. Derived metrics deliberately have no invented defaults.
begin;
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
commit;
