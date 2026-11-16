-- REVIEW ONLY: REQ-003/004/007/008/009/010/011 and proposed REQ-015.
-- NOT a canonical migration. NOT executed or SQL-verified in this increment.
-- Keep outside database/proposals: that directory is included by the current SQL runner.
-- CBC must approve the access matrix, identities, lifecycle vocabulary, retention,
-- amounts/currencies and transition rules before any promotion/implementation.
-- Rollback wrapper prevents accidental persistence if manually inspected in psql.
begin;
create schema cbc_operational_proposal;
revoke all on schema cbc_operational_proposal from public,anon,authenticated;

create table cbc_operational_proposal.program_staff_assignments (
 id uuid primary key default gen_random_uuid(),
 program_id uuid not null references public.programs(id),
 profile_id uuid not null references public.profiles(id),
 capability text not null, -- approved capability vocabulary remains a decision
 granted_at timestamptz not null default now(), revoked_at timestamptz
);
create unique index program_staff_active_assignment on cbc_operational_proposal.program_staff_assignments(program_id,profile_id,capability) where revoked_at is null;

create table cbc_operational_proposal.applications (
 id uuid primary key default gen_random_uuid(),
 program_id uuid not null references public.programs(id), cohort_id uuid,
 recipient_id uuid not null references public.program_recipients(id),
 submitted_at timestamptz, recorded_status text, version bigint not null default 1,
 foreign key(program_id,cohort_id) references public.program_cohorts(program_id,id)
 -- No automatic enrollment backfill or status inference. Application uniqueness pending.
);
create index applications_program_idx on cbc_operational_proposal.applications(program_id,cohort_id);
create index applications_recipient_idx on cbc_operational_proposal.applications(recipient_id);
create table cbc_operational_proposal.application_sensitive_details (
 application_id uuid primary key references cbc_operational_proposal.applications(id),
 eligibility_review_reference text, consent_reference text
 -- Minimal fields only; no copied supporting-document contents or derived eligibility.
);
create table cbc_operational_proposal.application_reviews (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references cbc_operational_proposal.applications(id),
 reviewer_id uuid not null references public.profiles(id),
 recorded_decision text, conflict_state text, reviewed_at timestamptz, version bigint not null default 1
 -- Rubric, reviewer uniqueness/conflict enforcement and decision authority pending.
);
create index reviews_application_idx on cbc_operational_proposal.application_reviews(application_id);
create index reviews_reviewer_idx on cbc_operational_proposal.application_reviews(reviewer_id);
create table cbc_operational_proposal.review_private_notes (
 review_id uuid primary key references cbc_operational_proposal.application_reviews(id), notes text
);
create table cbc_operational_proposal.program_awards (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references cbc_operational_proposal.applications(id),
 enrollment_id uuid references public.program_enrollments(id),
 amount numeric, currency text, awarded_on date, decision_reference text
 -- Amount/sign/currency constraints, application/enrollment identity agreement,
 -- disbursement ledger and finance writer scope must be specified before promotion.
 -- No link into giving_summary or automatic conversion of existing declared support.
);
create index awards_application_idx on cbc_operational_proposal.program_awards(application_id);
create index awards_enrollment_idx on cbc_operational_proposal.program_awards(enrollment_id);

create table cbc_operational_proposal.mentor_availability (
 id uuid primary key default gen_random_uuid(), contact_id uuid not null references public.contacts(id),
 available_from date, available_until date, recorded_capacity integer, review_reference text
 -- Capacity units, valid ranges, eligibility and consent require explicit definitions.
);
create index mentor_availability_contact_idx on cbc_operational_proposal.mentor_availability(contact_id);
create table cbc_operational_proposal.mentorship_safeguarding_notes (
 id uuid primary key default gen_random_uuid(), pair_id uuid not null references public.mentorship_pairs(id),
 recorded_at timestamptz not null default now(), author_id uuid not null references public.profiles(id), notes text
 -- Dedicated safeguarding capability; never inherit general CRM broad-role read.
);
create index safeguarding_pair_idx on cbc_operational_proposal.mentorship_safeguarding_notes(pair_id,recorded_at);

create table cbc_operational_proposal.program_sessions (
 id uuid primary key default gen_random_uuid(), program_id uuid references public.programs(id),
 title text not null, starts_at timestamptz, ends_at timestamptz, location text, recorded_status text
 -- Status vocabulary, session/program identity and time validation to be approved.
);
create index sessions_program_idx on cbc_operational_proposal.program_sessions(program_id,starts_at);
create table cbc_operational_proposal.session_attendance (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references cbc_operational_proposal.program_sessions(id),
 recipient_id uuid not null references public.program_recipients(id),
 recorded_state text, recorded_by uuid not null references public.profiles(id), version bigint not null default 1,
 unique(session_id,recipient_id)
 -- Recipient-only versus contact/member participation identity remains an explicit decision.
);
create index attendance_recipient_idx on cbc_operational_proposal.session_attendance(recipient_id,session_id);

create table cbc_operational_proposal.import_batches (
 id uuid primary key default gen_random_uuid(), source_label text not null, checksum text not null,
 status text, actor_id uuid not null references public.profiles(id),
 idempotency_key uuid not null unique, created_at timestamptz not null default now()
);
create table cbc_operational_proposal.import_rows (
 batch_id uuid not null references cbc_operational_proposal.import_batches(id), row_number integer not null,
 validation_state text, proposed_reference uuid, primary key(batch_id,row_number)
 -- Raw source data retention/mapping policy intentionally unspecified; never store credentials.
);
create table cbc_operational_proposal.duplicate_reviews (
 id uuid primary key default gen_random_uuid(), entity_kind text not null,
 candidate_id uuid not null, comparison_id uuid not null, reviewer_id uuid references public.profiles(id),
 recorded_resolution text, reviewed_at timestamptz
 -- Typed target FKs and approved merge procedure required; no automatic name-based merge.
);
create table cbc_operational_proposal.audit_events (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id),
 recorded_at timestamptz not null default now(), entity_kind text not null, subject_id uuid not null,
 operation text not null
 -- Approved minimized diff columns and trusted append-only triggers still required.
);
create index audit_subject_idx on cbc_operational_proposal.audit_events(entity_kind,subject_id,recorded_at);

-- Fail-closed placeholders, NOT a working access implementation. No browser grants/policies.
do $$ declare item record; begin
 for item in select tablename from pg_tables where schemaname='cbc_operational_proposal' loop
  execute format('alter table cbc_operational_proposal.%I enable row level security',item.tablename);
  execute format('revoke all on cbc_operational_proposal.%I from public,anon,authenticated',item.tablename);
 end loop;
end $$;

-- Separate mentorship-affiliation draft (DO NOT EXECUTE): discover existing constraint
-- names via pg_constraint, validate IDs, then replace both organization/contact composite
-- FKs with mentor_id -> contacts(id) and mentee_id -> contacts(id), only if CBC approves.
-- Retain mentor_id <> mentee_id and program/cohort FK. Do not drop constraints by CASCADE.
-- Administering organization, reparenting and rollback conflict rules remain open.
-- Membership responsibility similarly remains inherited-versus-independent pending;
-- no new owner column or role mapping is silently introduced here.
rollback;
