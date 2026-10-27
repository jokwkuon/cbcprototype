# Data model audit and proposal

Audit: 2026-10-26. This document supplements [conceptual ERD](erd.md), [overview](overview.md), [data dictionary](../data/data-dictionary.csv), and the [field matrix](../requirements/field-matrix.md). It does not replace open decisions or authorize migrations. All PDF references are physical pages.

## Observed repository schema

Only `database/migrations/202610130001_initial_crm.sql` exists. It was read, not applied; no deployed schema was inspected.

| Table | Columns present in migration | Relationships / constraints |
|---|---|---|
| profiles | id UUID, full_name text, role app_role, created_at/updated_at timestamptz | id → auth.users, cascade; role defaults viewer; name nonnull |
| organizations | id UUID, name text, organization_type text, industry text, website text, relationship_owner UUID, relationship_status enum, relationship_strength text, priority_level text, potential text, notes text, created_at/updated_at timestamptz | owner → profiles, set null; name nonblank; status defaults Prospect; strength/priority/potential constrained High/Medium/Low, default Medium |
| contacts | id UUID, organization_id UUID, first_name/last_name text, title/email/phone text, created_at/updated_at timestamptz | organization → organizations, set null; names nonblank; one optional organization per contact |

Enums: roles admin/staff/finance/viewer; relationship statuses Prospect/Cultivate/Proposal/Committed/Active/Lapsed. UUID/default timestamp creation, updated-at triggers, new-auth-user profile trigger, indexes and RLS policies are present in SQL. They are not execution evidence. Current read policies include all four named roles; organization/contact writes allow admin/staff; profile select is self/admin. No profile write policy exists. Grants and actual role behavior remain untested. A board-specific role is absent; do not equate viewer with approved board permissions.

Server actions trim text, require names, validate email using a regex and normalize website prefixes. Forms do not expose relationship owner, strength or potential. Detail renders strength and potential but not owner. Contact organization is a user-selected FK; the source labels its displayed relationship AUTO. Primary-contact selection is absent. `updated_at` is stored but not exposed in the TypeScript entity types. UUID and timestamp metadata are implementation support fields, not additional PDF business requirements.

The existing conceptual ERD proposes `organization_contacts` (many affiliations), whereas the migration uses `contacts.organization_id` (single affiliation). Neither is evidence that CBC approved cardinality. Decide before introducing a join table or affiliation migration.

## Proposed small relational components

Every item below is absent unless explicitly identified above. Names are design candidates, not executable DDL. No amount, risk score, date rule or KPI formula is approved here.

| Component | Proposed tables / relationships | Source / requirement | Decision needed |
|---|---|---|---|
| Organization extensions | organizations.primary_contact_id → contacts; estimated_opportunity decimal; optional location; existing owner → profiles | pp.1–2, REQ-001 | Primary contact selection/one per organization; contact must belong to organization; structured vs free-text location; currency |
| Contact extensions | contact_type, influence_level, interests, notes; optional contact_interests join | pp.3–4, REQ-002 | Lookups and affiliation cardinality; individual participant identity reuse |
| Opportunities | opportunities → organization, optional contact/program; proposal stage, estimated amount; optional interest links | pp.2,9–10,19–20, REQ-003 | Stage transitions, probability, pipeline eligibility; no approved stage formula |
| Commitments / receipts / agreements | commitments → organization/agreement; receipts → commitment where applicable; contributions as shared financial identity or reporting layer; agreements dates → organization | pp.5–6, REQ-004, ADR-007 | Decide canonical transaction model, installments, unallocated receipts, currency, in-kind valuation, refunds and recognition period; do not double count contribution/commitment/receipt |
| Activities and actions | activities → organization; activity_contacts join; tasks → activity/organization/contact/owner | pp.7–8, REQ-005 | Completion event/source, recurrence, overdue date boundary, multiple actions and next-action tie-break; future meetings vs past contact |
| Interests | sponsor_interests → organization; interest_programs; interest_activities; optional opportunity/task links | pp.9–10, REQ-003 extension | Dedicated requirement ID missing; single/multiple contacts, link selection, derived discussion rules |
| Programs and outcomes | programs; events or shared initiatives; cohorts → program; participants (identity model TBD); enrollments → participant/cohort; support awards and outcome history | pp.11–12, REQ-010 | Person reuse, repeat cohorts, multiple awards, outcome denominators and field-alignment classification |
| Mentorship | mentorship_pairs → mentor/mentee/cohort; checkins → pair; feedback → checkin/pair/respondent; follow-up tasks | pp.13–14, REQ-011 | Who may mentor, check-in completion, survey scale, latest-score selection and health thresholds |
| Membership | memberships → person OR organization plus optional organization affiliation; membership periods/payments; engagement links | pp.15–16, REQ-009 | Exclusive holder identity, renewals/history, fees vs giving, active/lapsed rules, retention vs renewal, risk and engagement formulas |
| Document metadata | documents; document_versions; typed organization/contact/initiative/agreement link tables; uploader/owner → profiles | pp.17–18, REQ-012 | Drive vs storage (ADR-006), owner vs uploader, status, access/version rules; actual file permissions must agree with metadata |
| Shared evidence | attendance → person/event; volunteer_logs → person/activity; engagement sourced from existing participation records | pp.4,12,16,20, REQ-002/006/009/010 extensions | Event identity, volunteer-hour approval, person deduplication, shared definitions and requirement IDs |
| Targets and reports | funding_targets by approved period; parameterized queries over source records; optional reviewed narrative | pp.19–20, REQ-006/013 | Target owner, reporting calendar, approved definitions, filters/export, diversity meaning; no aggregate cache needed initially |
| Settings | existing profiles/roles plus controlled lookup tables only if approved | navigation pp.3–20, REQ-008 extension | No Settings field guide exists; define editing authority and lookup scope before implementation |

Use UUID identities, explicit foreign keys and small join tables where needed. Avoid polymorphic IDs that cannot enforce referential integrity. Monetary amounts should use an approved fixed precision and currency; counts, timestamps, dates and scores remain distinct types. Requiredness, delete behavior, uniqueness, lifecycle history and audit retention are proposals for review, not assumptions to encode now.

## Derived data and dependency order

Organization/contact Last Contact depends on eligible activities; next actions depend on task lifecycle and tie-break rules. Giving summaries depend on the approved financial model. Interest summaries depend on explicit interest/activity/opportunity links. Alumni engagement needs a shared person identity, not matching names. Pair health depends on check-ins/feedback; membership status/risk depends on payment/engagement definitions. Dashboard and reports reuse approved queries rather than independent formulas. Return an explicit pending-definition state for unresolved calculations; never turn missing definitions or query errors into factual zeroes.

The PDF's AUTO fields can be references (primary contact), system metadata (uploader) or calculations (giving). A manual association may feed an AUTO display. Do not let users type calculated values to make a demonstration look complete. Support synthetic previews as visibly labeled fixtures, separate from any stored-record aggregation.

## Open decisions and acceptance gates

ADR-001/008: confirm board-demo scope and prototype expectations; reconcile register LATER modules with complete page representation. ADR-002/003: instructor confirms skills/deliverables and existing stack. ADR-004: report/dashboard delivery. ADR-005: authentication and role matrix. ADR-006: file links/storage. ADR-007: financial modeling. ADR-009: source confidentiality, ownership/support and publication remediation. CBC must name approvers for finance, program outcomes, membership, mentorship and access. Until then this model is an implementation proposal only.

## Day 1 implementation update — supersedes baseline observations above

REQ-001/002/008, ADR-010. The hosted schema was inspected through metadata only and matched the original three-table columns/policies; hosted migration history was empty. No hosted records were read and no hosted migration was applied. Baseline/history reconciliation is required before incremental deployment; never replay the initial migration or reset existing data.

`20261027032358_organization_ownership.sql` adds `profiles.is_active` and `staff_directory(id,display_name)`, synchronized by a private trigger. Existing profile self/admin read restrictions remain. Active Admin sees active Staff options; Staff sees self; Finance/Viewer see none. The role helper now returns no role for inactive profiles. Actor RLS plus a private trigger enforce staff self-assignment on create, admin-only reassignment/clearing, active-Staff targets, and immutable organization IDs. Staff cannot delete/reinsert to bypass assignment rules. Role/active-state changes remain trusted-operator operations. Historical inactive assignments are preserved on ordinary edits; restricted owner names are displayed honestly without granting broader directory access.

`20261027032422_crm_fields.sql` adds organizations.primary_contact_id/estimated_opportunity/location and contacts.contact_type/influence_level/interests/notes. A composite FK enforces primary-contact affiliation. A primary contact cannot silently move organizations; deletion clears its pointer. Estimated values must be finite. URL/email constraints use NOT VALID so no historic cleanup is forced. There is no approved currency, financial interpretation or new KPI formula. Category text remains flexible; single contact affiliation remains the existing model.

Organization/contact forms, actions and detail views now cover all 33 detailed fields, including 10 read-only pending definitions. Shared form/field definitions and parsers replace duplicated create/edit markup. Contact ownership is inherited from its linked organization. Page-only location is persisted; source tabs/history panels are represented with pending-module states. Multi-type organization tags remain a single free-text field pending taxonomy/cardinality approval.

The 29-table proposal in `database/proposals/` is intentionally separate, unexposed and denied to clients. It contains manual data/link candidates for remaining domains, not approved workflow/calculation implementations. The proposal and both migrations were applied only in disposable PostgreSQL tests. Browser tests separately exercise the real application against an in-memory synthetic Supabase HTTP contract; hosted Auth/PostgREST integration remains unverified. See delivery progress for executed results and remaining gaps.

## Activities implementation — REQ-005/008

The baseline sections are historical; `20261027041158_activities_followups.sql` is the latest local-only implementation. It creates:

- `public.activities`: optional organization FK, required finite timestamptz and nonblank free-text type, location/purpose/discussion/sponsor-needs/opportunity/outcome, timestamps.
- `public.activity_contacts`: composite activity/contact key with FKs; zero-to-many participants, explicit historical associations independent of current contact affiliations.
- `public.tasks`: activity FK, nonblank description, optional profile owner and finite due date, completion/timestamps. Multiple actions per activity; no duplicated organization/contact relationship columns that could drift.
- `public.follow_ups`: security-invoker view joining activity/organization data and only directory-visible owner names; status is computed on SELECT. No mutable status column or broader profile grant.

`save_activity` is an invoker RPC that atomically inserts/updates the log and replaces participants. Invalid links roll back all changes. `activity_last_contact` is an invoker aggregate over eligible linked activities; future timestamps are excluded. `activity_today` uses Calgary time and `follow_up_status` gives completion precedence over date-only overdue logic. All API functions have explicit execution grants; no new security-definer function is added. The existing timestamp trigger helper is hardened with an empty search path.

Active Admin/Staff can create/update; Finance/Viewer can read; anonymous/inactive users cannot access the rows. Participant replacement has narrowly granted delete access; no activity/task delete workflow is granted. A private task trigger validates changed owners against the existing restricted directory. Task identity/activity cannot be silently changed; unchanged historical owner assignments remain valid after deactivation. ADR-010 organization ownership and directory/profile permissions are unchanged.

Organization and contact details query actual linked histories, display nonfuture Last Contact, and select the next incomplete action by due date (undated last) then UUID. The action queue shows all overdue plus today through day six, excludes completed actions and counts undated actions separately. Monday–Sunday due-week and exact Meeting-type future counts are explicit demo conventions in ADR-011; no relationship-health score or financial KPI is fabricated.

The locked `cbc_demo_draft` activity/task candidates remain historical proposals and are not copied into the public API automatically. Public tables above are the implementation. All migrations and assertions ran on a disposable user-local PostgreSQL 18.6 server because Docker was unavailable; hosted Supabase PostgreSQL 17 and hosted Auth/PostgREST behavior remain unverified. The local security advisor reports the inherited `pgcrypto`-in-public warning; extension relocation is deferred to reviewed rollout. No hosted SQL changes were applied.

## Integration-readiness audit

The four existing migration files were kept unchanged and applied through actual Supabase history on a new official native PostgreSQL 17.11/Auth/PostgREST stack. No proposal or test bootstrap is applied to the real default database. All public base tables have RLS and explicit grants work with automatic API exposure disabled. The canonical initial 12-digit version is accepted by the pinned CLI; all later files have 14-digit timestamps. Dependency order is initial CRM → ownership/directory → CRM manual fields/composite primary contact → activities/tasks/calculations. Two pending-migration/seed replays are stable without manual edits.

The composite organization primary-contact FK makes an unqualified PostgREST contacts-to-organizations embed ambiguous. Application queries now explicitly name `contacts_organization_id_fkey`, selecting affiliation rather than inverse primary-contact linkage. This is an API query correction, not a cardinality/schema/policy change. Real API/browser tests confirm the relationship, actions and calculated values.

Fresh Supabase installs pgcrypto in extensions, so `CREATE EXTENSION IF NOT EXISTS` preserves the correct location and local advisors report zero findings. The earlier public-schema warning arose on bare PostgreSQL tests; existing hosted placement is not established by that evidence. No extension relocation was performed. Full audit, private seed tooling, environment boundaries and hosted approval gates are documented in [integration readiness](../delivery/hosted-integration-readiness.md).
