# Data model audit and proposal

> Historical planning/audit content below. Current observed architecture and operational limits: [release/recovery](release-and-recovery.md), [engineering findings](../audits/version3-engineering-remediation.md) and [executed verification](../delivery/version3-reliability-verification.md). Existing implementation does not settle CBC/instructor approval.


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
| Interests | sponsor_interests → organization; interest_programs; interest_activities; optional opportunity/task links | pp.9–10, REQ-014; related REQ-003 | Single/multiple contacts, link selection, derived discussion rules; see Sponsor Interests worksheet |
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

## Giving implementation — ADR-012, REQ-003/004/006/008

The historical baseline/proposals above are superseded for Giving by additive migration `20261027060754_sponsorship_giving.sql`. The locked `cbc_demo_draft` proposal is not promoted or exposed. The approved synthetic MVP uses four small public tables:

| Table | Relationships and validation | Access |
|---|---|---|
| contributions | Optional organization/contact FKs; finite contribution/agreement/renewal dates; ordered agreement dates; CAD amount exact numeric >=0 with max two decimals; Cash/In-Kind; manual sponsorship level and planning stage | Active Admin/Finance insert/update; all four active roles select |
| funding_initiatives | Program/Event typed lookup; composite FKs prevent using an Event as a Program | Same financial policy; full program/event operations deferred |
| cash_receipts | Immutable identity/parent; Cash parent only; positive exact numeric; nonfuture received date; void requires reason; parent lock serializes type changes | Same financial policy; no delete grants |
| giving_document_links | Contribution FK; nonblank label; HTTP(S) URL; references only | Same financial policy; no uploaded files or external permissions |

Every table enables RLS with explicit grants; anonymous/inactive denied. No client delete rights. Existing organization ownership/profile/directory policies remain unchanged. Validation triggers run as invoker with empty search_path; no privileged finance RPC bypass is introduced.

`giving_receipts` and `contribution_details` are security-invoker views. Monetary fields are text in API results to retain PostgreSQL decimal precision; forms submit exact decimal strings. `giving_summary(year, organization?, contact?)` is an invoker RPC aggregating nonvoid actual receipts. Annual/lifetime cash, prior comparable cash, delta/percentage, all-time active pledged/outstanding and separately declared in-kind are queried from the database. Current-year comparisons are YTD through Calgary today against the same prior cutoff; completed years use full calendar years. Zero prior baseline yields null percentage. Pledge stage changes never create revenue or erase receipts. Outstanding floors at zero; overpayments remain cash. The minimum RPC year is 2 to support prior-year comparison.

Organization/contact histories use explicit donor links. A contribution linked to both is one financial identity, never counted twice in global totals. Detail donor totals use organization if linked, otherwise contact; unlinked contributions retain global and record totals but explicitly lack donor totals. Renewal is manual planning metadata and shown per contribution; no next-renewal formula is assumed. Documents require manual reference entry, then display as linked records.

Deferred: refunds/negative cash, reconciliation, immutable finance audit history, automatic renewal scheduling, approved tier taxonomy, currency conversion, in-kind valuation and production accounting approval. Finance access is approved only for this synthetic MVP (ADR-012).


## Sponsor Interests implementation — REQ-014/003/005/008

Provisional ADR-013 promotes a reviewed slice into `20261028015014_sponsor_interests.sql`; the locked draft remains inaccessible and unchanged. Public `sponsor_interests` has mandatory organization, optional same-organization contact/opportunity, manual category/strength/notes, archive and creation/update metadata. Composite FKs prevent incompatible linking and later contact/opportunity reparenting. Organization ownership is inherited live through the existing restricted directory projection.

Small `opportunities` references have organization/name and an optional exact manual estimate; currency remains pending, no stages/finance recognition. `interest_programs` reuses typed Program funding references; `interest_activities` explicitly links existing activities; `interest_tasks` reuses existing tasks. No automatic matching, duplicated task lifecycle or broad Programs implementation. No interest/opportunity delete grant. Link deletion supports intentional replacement only.

The invoker save RPC locks and saves the interest plus link sets atomically. The security-invoker detail view selects one latest nonfuture explicitly linked discussion (timestamp descending/UUID ascending) and one incomplete explicitly linked task (due ascending, undated last, UUID). Active roles read; Admin/Staff write; only Admin changes archive state. Private metadata triggers protect IDs, creation/update/archive times. CBC approval and full audit history remain pending/deferred; existing ownership and Giving permissions are unchanged.


## Programs & Recipients implementation — REQ-010/002/006/008

The existing provisional ADR-014 slice is implemented by `20261029144615_programs_recipients.sql`, not by exposing the locked draft. `programs` optionally link a unique typed funding Program reference. `program_cohorts` have program/label uniqueness and optional year. `program_recipients` are standalone or uniquely contact-linked identities, with optional explicit affiliated organization and alumni effective date. `program_enrollments` link a recipient to one matching program/cohort, unique per recipient/cohort, with nullable exact CAD support and manual education/graduation/employment fields.

All four tables have RLS, explicit active-role reads and Admin/Staff writes; no hard deletion. Existing financial/profile/ownership permissions are unchanged. Composite FKs reject incompatible cohort/program and explicit contact/organization links, including target reparenting. Invoker metadata triggers preserve IDs/creation and generate modification timestamps. Invoker recipient/enrollment views reuse linked contact identity, nonfuture past interactions/Last Contact and nonvoid alumni cash from an explicit effective date through Calgary today. Alumni cash is person-wide, never a per-program allocation. No service-role access is introduced into the frontend.

`program_summary` is an invoker RPC counting distinct recipients and enrollment records in the supplied program/cohort scope and summing known support with known/missing counts. Null support stays unknown, separate from cash receipts. The Programs directory normalizes filters against authorized programs/cohorts before calling the RPC or loading enrollments; search narrows directory rows only. Field Alignment and outcome rates remain pending; engagement classification is partial. Current runtime evidence and all 133 field classifications are in [progress](../delivery/progress.md#current-field-audit). CBC approval, audit history and hosted rollout remain separate gates.

## Board completion — REQ-009/011/012/013/006/008 (2026-11-02)

The locked proposal remains unchanged. Three additive canonical migrations now implement:

- `memberships`: exactly one contact/corporate member, optional matching affiliation, manual type/industry/payment label, finite ordered start/renewal dates and nullable exact CAD planning fee. `membership_details` is an invoker view deriving provisional date status, inherited organization/owner and latest recorded past interaction. Terms are history records; no entitlement, receipt or retention calculation is inferred.
- `mentorship_pairs`: distinct contact identities within one enforced organization, valid operational program/cohort composite link, manual status/cadence/issues/action dates. `mentorship_checkins` stores completed nonfuture check-in dates and raw satisfaction/feedback/issues. `mentorship_details` is an invoker view of recorded count/max date and deterministic latest feedback. Check-in parent is immutable. Pair Health remains pending.
- `documents`: metadata-only name/type/version/dates/classification, actual FKs to organization/contact/funding initiative/commitment, protected original creator/registration/update timestamps. Internal is active-role readable/Admin-Staff writable; Admin only is Admin-readable/writable. No binary object, storage bucket or file authorization is claimed.

All three domains enable RLS, grant only select/insert/update, protect identities/server metadata with invoker triggers and index relationship columns. Operational Admin/Staff versus Finance/Viewer boundaries and inactive/anonymous denial reuse existing profile-authorized roles. Documents narrows access by classification. No new security-definer or service-role reporting endpoint is introduced. ADR-016/017/018 document provisional business conventions.

Reports reuse complete paginated invoker queries and exact cents. Dashboard summaries have explicit unavailable states. CSV exports use the same authenticated source/filter paths and neutralize spreadsheet formulas. Current field traceability/limitations and executed SQL/API/browser evidence are in delivery coverage/progress; source-code presence is not board acceptance. Existing seven migrations are preserved unchanged. New migration candidates were iterated locally before committing and validated from scratch after finalization; no existing hosted state/history was altered.
