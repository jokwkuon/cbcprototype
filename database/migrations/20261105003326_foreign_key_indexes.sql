-- REQ-008/005: cover FK lookups without changing any relationship or financial rule.
create index if not exists contributions_event_fk_idx on public.contributions(event_id,event_kind);
create index if not exists contributions_program_fk_idx on public.contributions(program_id,program_kind);
create index if not exists interest_programs_program_fk_idx on public.interest_programs(program_id,program_kind);
create index if not exists organizations_primary_contact_fk_idx on public.organizations(id,primary_contact_id);
create index if not exists program_recipients_contact_fk_idx on public.program_recipients(organization_id,contact_id);
create index if not exists programs_funding_program_fk_idx on public.programs(funding_program_id,funding_kind);
create index if not exists sponsor_interests_opportunity_fk_idx on public.sponsor_interests(organization_id,opportunity_id);
create index if not exists sponsor_interests_contact_fk_idx on public.sponsor_interests(organization_id,primary_contact_id);
create index if not exists tasks_owner_fk_idx on public.tasks(owner_id);
