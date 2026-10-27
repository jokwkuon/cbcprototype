# Architecture field matrix

Baseline audit and Day 1 update: 2026-10-26, branch `feature/mvp-foundation`. Source: safe local copy of *CBC Database Architecture 2026.pdf*, 20 physical PDF pages. Page numbers below are **physical pages**, not the illustrated footer or database-page number. No source examples or personal records are reproduced.

This is a field-level inventory and proposed design, not an approved schema. [Register](register.csv) and [decisions](../project/decisions.md) remain authoritative for approval. The requested board demo represents every source page/field; modules marked LATER in the register need scope reconciliation before operational implementation.

M = manual; A = source AUTO (linked, system-populated or calculated, not necessarily a formula). All missing mappings and routes are proposals. Names beginning with `giving`, `outcomes`, `engagement`, or ending in `latest`, `count`, `next` describe proposed queries, not existing columns or approved calculations. Default UI location is the module detail page, editable fields also in create/edit forms; derived fields are read-only. Directory-specific fields and metrics follow below.

Status: **Code** = migration + read/write UI/action inspected, runtime unverified; **Partial** = migration exists but editor or display absent; **Missing** = required mapping/UI absent. Day 1 adds **Local DB + browser fixture** (isolated PostgreSQL assertions and browser coverage against a synthetic Supabase HTTP fixture), **Represented / pending** (read-only label exists, no calculation), and **Draft only** (locked entity proposal, no module UI). None means hosted end-to-end verification or CBC acceptance.

Validation legend (proposed unless explicitly marked existing): **T** trim text; requiredness/length need CBC review. **R** valid existing referenced record and authorized selection, relationship cardinality needs review. **D** valid date/time, chronology and timezone rules need approval. **N** decimal precision/currency/sign and aggregation rules need approval. **E** approved controlled values; do not infer exhaustive enums from examples. **C** source linkage, null/tie/period/eligibility rules and reconciliation example required; show “Definition pending” until approved. Existing names have nonblank DB/action checks; email has action regex + HTML validation; FK integrity exists for contact organization and organization owner. Existing status enum and High/Medium/Low checks are in the migration; their business approval is unverified. Day 1 parser validates HTTP(S) URLs without embedded credentials, finite estimated amounts, enums, identifiers and email. Incremental DB constraints cover finite amounts, email/URL syntax and same-organization primary contact; historical URL/email checks use NOT VALID to avoid forced data cleanup. See ADR-010 for ownership and active status.

## Organizations — REQ-001

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| ORG-01 | Organization Name | 2 | text | M | organizations.name | /organizations detail/form | Existing nonblank DB + action | Local DB + browser fixture |
| ORG-02 | Organization Type | 2 | text | M | organizations.organization_type | /organizations detail/form | T | Local DB + browser fixture |
| ORG-03 | Industry | 2 | text | M | organizations.industry | /organizations detail/form | T | Local DB + browser fixture |
| ORG-04 | Website | 2 | text / URL | M | organizations.website | /organizations detail/form | HTTP(S) parser; DB syntax check | Local DB + browser fixture |
| ORG-05 | Primary Contact | 2 | contact reference | A | organizations.primary_contact_id | /organizations edit: affiliated-contact selector; linked detail | Composite FK; explicit selection; delete clears pointer | Local DB + browser fixture |
| ORG-06 | Relationship Owner | 2 | user reference | M | organizations.relationship_owner | /organizations create/admin edit + detail | ADR-010: RLS, active-Staff target check, immutable staff ownership | Local DB + browser fixture |
| ORG-07 | Relationship Status | 2 | enum | M | organizations.relationship_status | /organizations detail/form | Existing enum/check; CBC approval pending | Local DB + browser fixture |
| ORG-08 | Relationship Strength | 2 | enum | M | organizations.relationship_strength | /organizations create/edit + detail | Existing H/M/L checks + shared parser | Local DB + browser fixture |
| ORG-09 | Priority Level | 2 | enum | M | organizations.priority_level | /organizations detail/form | Existing enum/check; CBC approval pending | Local DB + browser fixture |
| ORG-10 | Potential | 2 | enum | M | organizations.potential | /organizations create/edit + detail | Existing H/M/L checks + shared parser | Local DB + browser fixture |
| ORG-11 | Estimated Opportunity | 2 | decimal / currency | M | organizations.estimated_opportunity | /organizations detail/form | Finite numeric parser + DB check; currency rules pending | Local DB + browser fixture |
| ORG-12 | Current Contribution | 2 | money aggregate | A | giving.current_period (proposed) | /organizations detail: Definition pending | C; no formula implemented | Represented / pending |
| ORG-13 | Lifetime Giving | 2 | money aggregate | A | giving.lifetime (proposed) | /organizations detail: Definition pending | C; no formula implemented | Represented / pending |
| ORG-14 | Last Contact | 2 | timestamp | A | activities.latest (proposed) | /organizations detail: Definition pending | C; no formula implemented | Represented / pending |
| ORG-15 | Next Action | 2 | task reference | A | tasks.next (proposed) | /organizations detail: Definition pending | C; no formula implemented | Represented / pending |
| ORG-16 | Next Action Date | 2 | date | A | tasks.next.due_date (proposed) | /organizations detail: Definition pending | C; no formula implemented | Represented / pending |
| ORG-17 | Renewal Date | 2 | date | A | agreements.renewal_date (proposed) | /organizations detail: Definition pending | C; no formula implemented | Represented / pending |
| ORG-18 | Notes | 2 | text | M | organizations.notes | /organizations detail/form | T | Local DB + browser fixture |

## Contacts — REQ-002

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| CON-01 | First Name | 4 | text | M | contacts.first_name | /contacts detail/form | Existing nonblank DB + action | Local DB + browser fixture |
| CON-02 | Last Name | 4 | text | M | contacts.last_name | /contacts detail/form | Existing nonblank DB + action | Local DB + browser fixture |
| CON-03 | Title | 4 | text | M | contacts.title | /contacts detail/form | T | Local DB + browser fixture |
| CON-04 | Organization | 4 | organization reference | A | contacts.organization_id | /contacts form selector + linked detail; AUTO display, manual association | C | Local DB + browser fixture |
| CON-05 | Email | 4 | text / email | M | contacts.email | /contacts detail/form | Email parser + HTML + DB syntax check | Local DB + browser fixture |
| CON-06 | Phone | 4 | text | M | contacts.phone | /contacts detail/form | T | Local DB + browser fixture |
| CON-07 | Contact Type | 4 | lookup | M | contacts.contact_type | /contacts detail/form | Free text; controlled taxonomy pending | Local DB + browser fixture |
| CON-08 | Influence Level | 4 | enum | M | contacts.influence_level | /contacts detail/form | Nullable H/M/L parser + DB check | Local DB + browser fixture |
| CON-09 | Relationship Owner | 4 | user reference | A | organizations.relationship_owner | /contacts detail: inherited owner label | Linked organization; restricted directory visibility | Local DB + browser fixture |
| CON-10 | Last Contact | 4 | timestamp | A | activities.latest (proposed) | /contacts detail: Definition pending | C; no formula implemented | Represented / pending |
| CON-11 | Next Action | 4 | task reference | A | tasks.next (proposed) | /contacts detail: Definition pending | C; no formula implemented | Represented / pending |
| CON-12 | Events Attended | 4 | count / history | A | contacts.attendance (proposed) | /contacts detail: Definition pending | C; no formula implemented | Represented / pending |
| CON-13 | Giving History | 4 | contribution history | A | contacts.contributions (proposed) | /contacts detail: Definition pending | C; no formula implemented | Represented / pending |
| CON-14 | Interests | 4 | text / links | M | contacts.interests | /contacts detail/form | T | Local DB + browser fixture |
| CON-15 | Notes | 4 | text | M | contacts.notes | /contacts detail/form | T | Local DB + browser fixture |

## Sponsorship & Giving — REQ-003/004

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| GIV-01 | Organization | 6 | organization reference | M | cbc_demo_draft.contributions.organization_id | /giving detail/form | R | Draft DB only; UI missing |
| GIV-02 | Contact | 6 | contact reference | M | cbc_demo_draft.contributions.contact_id | /giving detail/form | R | Draft DB only; UI missing |
| GIV-03 | Contribution Date | 6 | date | M | cbc_demo_draft.contributions.contribution_date | /giving detail/form | D | Draft DB only; UI missing |
| GIV-04 | Amount | 6 | decimal / currency | M | cbc_demo_draft.contributions.amount | /giving detail/form | N | Draft DB only; UI missing |
| GIV-05 | Contribution Type | 6 | lookup | M | cbc_demo_draft.contributions.contribution_type | /giving detail/form | E | Draft DB only; UI missing |
| GIV-06 | Sponsorship Level | 6 | lookup | M | cbc_demo_draft.contributions.sponsorship_level | /giving detail/form | E | Draft DB only; UI missing |
| GIV-07 | Program / Event | 6 | initiative reference | M | cbc_demo_draft.contributions.program_id / event_id | /giving detail/form | R | Draft DB only; UI missing |
| GIV-08 | Funding Status | 6 | lookup | M | cbc_demo_draft.contributions.funding_status | /giving detail/form | E | Draft DB only; UI missing |
| GIV-09 | Agreement Start | 6 | date | M | cbc_demo_draft.agreements.start_date | /giving detail/form | D | Draft DB only; UI missing |
| GIV-10 | Agreement End | 6 | date | M | cbc_demo_draft.agreements.end_date | /giving detail/form | D | Draft DB only; UI missing |
| GIV-11 | Renewal Date | 6 | date | A | agreements.renewal_date (proposed) | /giving detail (read-only) | C | Missing |
| GIV-12 | Current-Year Giving | 6 | money aggregate | A | giving.current_year (proposed) | /giving detail (read-only) | C | Missing |
| GIV-13 | Lifetime Giving | 6 | money aggregate | A | giving.lifetime (proposed) | /giving detail (read-only) | C | Missing |
| GIV-14 | YoY Change | 6 | decimal / percent | A | giving.yoy (proposed) | /giving detail (read-only) | C | Missing |
| GIV-15 | Outstanding Commitment | 6 | money aggregate | A | giving.outstanding (proposed) | /giving detail (read-only) | C | Missing |
| GIV-16 | Documents | 6 | document links | A | contributions.document_links (proposed) | /giving detail (read-only) | C | Missing |

## Activities & Follow-Ups — REQ-005

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| ACT-01 | Date / Time | 8 | timestamp | M | cbc_demo_draft.activities.occurred_at | /activities detail/form | D | Draft DB only; UI missing |
| ACT-02 | Activity Type | 8 | lookup | M | cbc_demo_draft.activities.activity_type | /activities detail/form | E | Draft DB only; UI missing |
| ACT-03 | Organization | 8 | organization reference | M | cbc_demo_draft.activities.organization_id | /activities detail/form | R | Draft DB only; UI missing |
| ACT-04 | Contact(s) | 8 | contact references | M | cbc_demo_draft.activity_contacts.contact_id | /activities detail/form | R | Draft DB only; UI missing |
| ACT-05 | Location | 8 | text | M | cbc_demo_draft.activities.location | /activities detail/form | T | Draft DB only; UI missing |
| ACT-06 | Purpose | 8 | text | M | cbc_demo_draft.activities.purpose | /activities detail/form | T | Draft DB only; UI missing |
| ACT-07 | Key Discussion | 8 | text | M | cbc_demo_draft.activities.key_discussion | /activities detail/form | T | Draft DB only; UI missing |
| ACT-08 | Sponsor Needs | 8 | text | M | cbc_demo_draft.activities.sponsor_needs | /activities detail/form | T | Draft DB only; UI missing |
| ACT-09 | CBC Opportunity | 8 | text | M | cbc_demo_draft.activities.cbc_opportunity | /activities detail/form | T | Draft DB only; UI missing |
| ACT-10 | Outcome | 8 | text | M | cbc_demo_draft.activities.outcome | /activities detail/form | T | Draft DB only; UI missing |
| ACT-11 | Next Action | 8 | text | M | cbc_demo_draft.tasks.description | /activities detail/form | T | Draft DB only; UI missing |
| ACT-12 | Action Owner | 8 | user reference | M | cbc_demo_draft.tasks.owner_id | /activities detail/form | R | Draft DB only; UI missing |
| ACT-13 | Due Date | 8 | date | M | cbc_demo_draft.tasks.due_date | /activities detail/form | D | Draft DB only; UI missing |
| ACT-14 | Status | 8 | enum | A | tasks.status (proposed) | /activities detail (read-only) | C | Missing |
| ACT-15 | Last Contact | 8 | timestamp | A | activities.latest (proposed) | /activities detail (read-only) | C | Missing |

## Sponsor Interests — REQ-003 (extension; no dedicated ID)

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| INT-01 | Organization | 10 | organization reference | M | cbc_demo_draft.sponsor_interests.organization_id | /interests detail/form | R | Draft DB only; UI missing |
| INT-02 | Primary Contact | 10 | contact reference | A | sponsor_interests.primary_contact_id (proposed) | /interests detail (read-only) | C | Missing |
| INT-03 | Interest Category | 10 | lookup | M | cbc_demo_draft.sponsor_interests.category | /interests detail/form | E | Draft DB only; UI missing |
| INT-04 | Interest Strength | 10 | enum | M | cbc_demo_draft.sponsor_interests.strength | /interests detail/form | E | Draft DB only; UI missing |
| INT-05 | Program Alignment | 10 | program references | M | cbc_demo_draft.interest_programs.program_id | /interests detail/form | R | Draft DB only; UI missing |
| INT-06 | Last Discussed | 10 | timestamp | A | interest_activities.latest_date (proposed) | /interests detail (read-only) | C | Missing |
| INT-07 | Last Discussion | 10 | activity reference | A | interest_activities.latest (proposed) | /interests detail (read-only) | C | Missing |
| INT-08 | Related Opportunity | 10 | opportunity reference | A | sponsor_interests.opportunity_id (proposed) | /interests detail (read-only) | C | Missing |
| INT-09 | Relationship Owner | 10 | user reference | A | organizations.relationship_owner (proposed) | /interests detail (read-only) | C | Missing |
| INT-10 | Next Action | 10 | task reference | A | tasks.next (proposed) | /interests detail (read-only) | C | Missing |
| INT-11 | Notes | 10 | text | M | cbc_demo_draft.sponsor_interests.notes | /interests detail/form | T | Draft DB only; UI missing |

## Programs & Recipients — REQ-010

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| PRO-01 | Program | 12 | program reference | M | cbc_demo_draft.cohorts.program_id via enrollments.cohort_id | /programs detail/form | R | Draft DB only; UI missing |
| PRO-02 | Recipient / Participant | 12 | person reference | M | cbc_demo_draft.enrollments.participant_id | /programs detail/form | R | Draft DB only; UI missing |
| PRO-03 | Cohort / Year | 12 | cohort reference | M | cbc_demo_draft.enrollments.cohort_id | /programs detail/form | R | Draft DB only; UI missing |
| PRO-04 | Award / Support Amount | 12 | decimal / currency | M | cbc_demo_draft.enrollments.support_amount | /programs detail/form | N | Draft DB only; UI missing |
| PRO-05 | Education Level | 12 | lookup | M | cbc_demo_draft.enrollments.education_level | /programs detail/form | E | Draft DB only; UI missing |
| PRO-06 | Institution | 12 | text / reference | M | cbc_demo_draft.enrollments.institution | /programs detail/form | R | Draft DB only; UI missing |
| PRO-07 | Field of Study | 12 | lookup | M | cbc_demo_draft.enrollments.field_of_study | /programs detail/form | E | Draft DB only; UI missing |
| PRO-08 | Graduation Status | 12 | lookup | M | cbc_demo_draft.enrollments.graduation_status | /programs detail/form | E | Draft DB only; UI missing |
| PRO-09 | Graduation Date | 12 | date | M | cbc_demo_draft.enrollments.graduation_date | /programs detail/form | D | Draft DB only; UI missing |
| PRO-10 | Employment Status | 12 | lookup | M | cbc_demo_draft.enrollments.employment_status | /programs detail/form | E | Draft DB only; UI missing |
| PRO-11 | Employment Field | 12 | lookup | M | cbc_demo_draft.enrollments.employment_field | /programs detail/form | E | Draft DB only; UI missing |
| PRO-12 | Field Alignment | 12 | boolean / classification | A | outcomes.field_alignment (proposed) | /programs detail (read-only) | C | Missing |
| PRO-13 | CBC Engagement | 12 | activity history | A | enrollments.engagement (proposed) | /programs detail (read-only) | C | Missing |
| PRO-14 | Alumni Giving | 12 | money aggregate | A | giving.alumni (proposed) | /programs detail (read-only) | C | Missing |
| PRO-15 | Last Contact | 12 | timestamp | A | activities.latest (proposed) | /programs detail (read-only) | C | Missing |

## Mentorship — REQ-011

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| MEN-01 | Mentor | 14 | person reference | M | cbc_demo_draft.mentorship_pairs.mentor_id | /mentorship detail/form | R | Draft DB only; UI missing |
| MEN-02 | Mentee | 14 | person reference | M | cbc_demo_draft.mentorship_pairs.mentee_id | /mentorship detail/form | R | Draft DB only; UI missing |
| MEN-03 | Program / Cohort | 14 | cohort reference | M | cbc_demo_draft.mentorship_pairs.cohort_id | /mentorship detail/form | R | Draft DB only; UI missing |
| MEN-04 | Start Date | 14 | date | M | cbc_demo_draft.mentorship_pairs.start_date | /mentorship detail/form | D | Draft DB only; UI missing |
| MEN-05 | Target End Date | 14 | date | M | cbc_demo_draft.mentorship_pairs.target_end_date | /mentorship detail/form | D | Draft DB only; UI missing |
| MEN-06 | Status | 14 | lookup | M | cbc_demo_draft.mentorship_pairs.status | /mentorship detail/form | E | Draft DB only; UI missing |
| MEN-07 | Check-In Frequency | 14 | cadence | M | cbc_demo_draft.mentorship_pairs.checkin_frequency | /mentorship detail/form | D | Draft DB only; UI missing |
| MEN-08 | Last Check-In | 14 | timestamp | A | checkins.latest (proposed) | /mentorship detail (read-only) | C | Missing |
| MEN-09 | Check-Ins Completed | 14 | integer | A | checkins.count (proposed) | /mentorship detail (read-only) | C | Missing |
| MEN-10 | Pair Health | 14 | classification | A | mentorship_pairs.pair_health (proposed) | /mentorship detail (read-only) | C | Missing |
| MEN-11 | Mentor Satisfaction | 14 | survey score | A | feedback.mentor_latest (proposed) | /mentorship detail (read-only) | C | Missing |
| MEN-12 | Mentee Satisfaction | 14 | survey score | A | feedback.mentee_latest (proposed) | /mentorship detail (read-only) | C | Missing |
| MEN-13 | Issues / Flags | 14 | text | M | cbc_demo_draft.mentorship_pairs.issues | /mentorship detail/form | T | Draft DB only; UI missing |
| MEN-14 | Next Action | 14 | text | M | cbc_demo_draft.tasks.description | /mentorship detail/form | T | Draft DB only; UI missing |
| MEN-15 | Action Due Date | 14 | date | M | cbc_demo_draft.tasks.due_date | /mentorship detail/form | D | Draft DB only; UI missing |

## Membership — REQ-009

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| MEM-01 | Member | 16 | person or organization reference | M | cbc_demo_draft.memberships.contact_id OR member_organization_id | /membership detail/form | R | Draft DB only; UI missing |
| MEM-02 | Membership Type | 16 | lookup | M | cbc_demo_draft.memberships.membership_type | /membership detail/form | E | Draft DB only; UI missing |
| MEM-03 | Organization | 16 | organization reference | M | cbc_demo_draft.memberships.organization_id | /membership detail/form | R | Draft DB only; UI missing |
| MEM-04 | Industry | 16 | lookup | M | cbc_demo_draft.memberships.industry | /membership detail/form | E | Draft DB only; UI missing |
| MEM-05 | Start Date | 16 | date | M | cbc_demo_draft.memberships.start_date | /membership detail/form | D | Draft DB only; UI missing |
| MEM-06 | Renewal Date | 16 | date | M | cbc_demo_draft.memberships.renewal_date | /membership detail/form | D | Draft DB only; UI missing |
| MEM-07 | Membership Fee | 16 | decimal / currency | M | cbc_demo_draft.memberships.fee | /membership detail/form | N | Draft DB only; UI missing |
| MEM-08 | Payment Status | 16 | lookup | M | cbc_demo_draft.memberships.payment_status | /membership detail/form | E | Draft DB only; UI missing |
| MEM-09 | Status | 16 | classification | A | memberships.status (proposed) | /membership detail (read-only) | C | Missing |
| MEM-10 | Events Attended | 16 | integer | A | attendance.count (proposed) | /membership detail (read-only) | C | Missing |
| MEM-11 | Program Participation | 16 | program history | A | memberships.enrollments (proposed) | /membership detail (read-only) | C | Missing |
| MEM-12 | Last Engagement | 16 | timestamp | A | engagement.latest (proposed) | /membership detail (read-only) | C | Missing |
| MEM-13 | Engagement Score | 16 | decimal | A | engagement.score (proposed) | /membership detail (read-only) | C | Missing |
| MEM-14 | Renewal Risk | 16 | classification | A | memberships.renewal_risk (proposed) | /membership detail (read-only) | C | Missing |
| MEM-15 | Relationship Owner | 16 | user reference | A | organizations.relationship_owner (proposed) | /membership detail (read-only) | C | Missing |

## Documents — REQ-012

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| DOC-01 | Document Name | 18 | text | M | cbc_demo_draft.documents.name | /documents detail/form | T | Draft DB only; UI missing |
| DOC-02 | Document Type | 18 | lookup | M | cbc_demo_draft.documents.document_type | /documents detail/form | E | Draft DB only; UI missing |
| DOC-03 | Organization | 18 | organization reference | M | cbc_demo_draft.document_organizations.organization_id | /documents detail/form | R | Draft DB only; UI missing |
| DOC-04 | Contact | 18 | contact reference | M | cbc_demo_draft.document_contacts.contact_id | /documents detail/form | R | Draft DB only; UI missing |
| DOC-05 | Program / Event | 18 | initiative reference | M | document_initiatives.initiative_id (proposed) | /documents detail/form | R | Missing |
| DOC-06 | Upload Date | 18 | timestamp | A | documents.uploaded_at (proposed) | /documents detail (read-only) | C | Missing |
| DOC-07 | Uploaded By | 18 | user reference | A | documents.uploaded_by (proposed) | /documents detail (read-only) | C | Missing |
| DOC-08 | Version | 18 | text | M | cbc_demo_draft.documents.version | /documents detail/form | T | Draft DB only; UI missing |
| DOC-09 | Effective Date | 18 | date | M | cbc_demo_draft.documents.effective_date | /documents detail/form | D | Draft DB only; UI missing |
| DOC-10 | Expiry Date | 18 | date | M | cbc_demo_draft.documents.expiry_date | /documents detail/form | D | Draft DB only; UI missing |
| DOC-11 | Related Agreement | 18 | agreement reference | A | document_agreements.agreement_id (proposed) | /documents detail (read-only) | C | Missing |
| DOC-12 | Access Level | 18 | permission classification | M | cbc_demo_draft.documents.access_level | /documents detail/form | T | Draft DB only; UI missing |
| DOC-13 | Last Updated | 18 | timestamp | A | documents.updated_at (proposed) | /documents detail (read-only) | C | Missing |

## Directory illustrations and page-only fields

These entries supplement the field guides; aliases reuse their field rows rather than adding duplicate storage. All listed metric mappings are proposed unless stated otherwise. All metrics are calculated (A), read-only, validated under C, and Missing unless explicitly stated. Each semicolon-separated label is a separate required display field with the same metadata.

| Source p. / page | Field(s) | Type / M or A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|
| 1 Organizations (embedded image, visually inspected) | Name; Website; Industry; Notes; Owner; Status; Strength; Potential | aliases / M | ORG-01/04/03/18/06/07/08/10 | Organization profile header/details | Per referenced rows | Day 1 coverage per ORG rows; restricted owner label |
| 1 Organizations | Location | text / M | organizations.location | Organization form/detail | Optional free text; structure pending | Local DB column + browser fixture |
| 1 Organizations | Relationship Type / tags | multi-value lookup / M (proposal) | organization_types join (proposed); existing organization_type is single text | Profile header/details | E; reconcile Organization Type vs Relationship Type and multiple tags | Partial; single type text only |
| 1 Organizations | Contacts; Giving History; Activities; Interests; Documents (tab counts) | integer / A | linked record counts for each named domain | Profile tabs | C; access-aware counts | Section links and pending history panels represented; contacts list exists; tab counts missing |
| 1 Organizations | Recent Activity: date; type; purpose; owner | timestamp; lookup; text; user reference / A | activities + profiles (proposed) | Recent Activity panel | C; eligible activity/order/access | Missing |
| 1 shared header | Global search; user display name/avatar; notifications; calendar | query text / M; identity / A; actions | search across org/contact/tag; auth profile; notifications/calendar unspecified | Shared header | Search input/permissions; identity source; action behavior TBD | Search input unwired; user name/initials in code; avatar/notification/calendar absent |
| 3 Contacts | Total Contacts | integer / A | contacts count | Contacts KPI | Exact count query; respects existing read policy | Code + browser directory render; no approved segmentation formula |
| 3 Contacts | Decision Makers; Recently Contacted | integer / A | contacts.contact_type; activities within approved window | Contacts KPIs | C; define classification/window | Represented / pending |
| 3 Contacts | Contact; Title; Organization; Type; Influence; Last Contact | aliases / M or A per CON rows | CON-01/02/03/04/07/08/10 | Contacts directory | Per referenced rows | Day 1: first five in directory; Last Contact explicitly pending |
| 5 Giving | Revenue YTD; Committed; Outstanding | money / A | receipts YTD; commitments; outstanding query | Giving KPIs | C + N | Missing |
| 5 Giving | Date; Organization; Amount; Level; Program / Event; Status | aliases / M | GIV-03/01/04/06/07/08 | Giving directory | Per referenced rows | Missing |
| 7 Activities | Date; Type; Organization; Purpose; Next Action; Owner | aliases / M | ACT-01/02/03/06/11/12 | Activities directory | Per referenced rows | Missing |
| 7 Activities | Due this week; Overdue; Upcoming meetings | integer / A | tasks due; overdue; activities scheduled | Open actions panel | C; timezone/week/future rules | Missing |
| 9 Interests | Organization; Interest; Strength; Program Alignment; Owner | aliases / M or A | INT-01/03/04/05/09 | Interests directory | Per referenced rows | Missing |
| 9 Interests | Opportunity (amount) | money / A | opportunities.estimated_amount | Interests directory | C + N; distinct from opportunity link | Missing |
| 11 Programs | Participants; Scholarships | integer / A | enrollments eligible participants; awards count | Programs KPIs | C; count persons vs enrollments | Missing |
| 11 Programs | Graduation Rate; Employed in Field | percent / A | approved outcome queries | Programs KPIs | C; denominators/cohorts | Missing |
| 11 Programs | Recipient; Program; Cohort; Level; Field | aliases / M | PRO-02/01/03/05/07 | Programs directory | Per referenced rows | Missing |
| 11 Programs | Outcome | classification / A (proposal; source unspecified) | enrollment outcome query | Programs directory | C; reconcile graduation/employment labels | Missing |
| 13 Mentorship | Active Pairs; Check-ins This Month | integer / A | pairs eligible status; checkins month | Mentorship KPIs | C | Missing |
| 13 Mentorship | Pair Health (aggregate) | percent / A | approved health aggregation | Mentorship KPI | C; separate from per-pair label | Missing |
| 13 Mentorship | Mentor; Mentee; Status; Frequency; Last Check-In; Pair Health | aliases / M or A | MEN-01/02/06/07/08/10 | Mentorship directory | Per referenced rows | Missing |
| 15 Membership | Active Members; New This Year; At Renewal Risk | integer / A | membership status; start period; risk query | Membership KPIs | C | Missing |
| 15 Membership | Renewal Rate | percent / A | approved renewal query | Membership KPI | C; distinguish retention | Missing |
| 15 Membership | Member; Type; Industry; Status; Renewal; Renewal Risk | aliases / M or A | MEM-01/02/04/09/06/14 | Membership directory | Per referenced rows | Missing |
| 17 Documents | Document; Type; Related To; Updated | aliases / M or A | DOC-01/02; document links; DOC-13 | Documents directory | Per referenced rows; Related To combines links | Missing |
| 17 Documents | Owner | user reference / unspecified (proposed M) | documents.owner_id (proposed) | Documents directory | R; owner is not necessarily uploader | Missing |
| 17 Documents | Status | lookup / unspecified (proposed M) | documents.status (proposed) | Documents directory | E; clarify mixed lifecycle/payment labels | Missing |

## Reports — physical p.19, REQ-013

Each report is a missing page/workflow. All outputs are calculated/read-only, proposed queries over the named domains; validation C applies to every output. Output schema, filters, export format and metric definitions are not specified beyond these categories and require approval. Proposed UI: `/reports` with a Run Report action per category, explicit pending definitions, and synthetic preview. No report query/table/route exists.

| Report | Specified output fields/topics | Proposed database sources | Type | Status |
|---|---|---|---|---|
| Executive Performance | Funding; sponsorship; membership; program KPIs | giving, organizations, memberships, enrollments | aggregate measures | Missing |
| Sponsor Relationship | Pipeline; renewals; interactions; opportunities | opportunities, agreements, activities | money/date/history | Missing |
| Scholarship Impact | Awards; graduation; employment; alumni engagement | enrollments, outcomes, engagement | money/count/percent/history | Missing |
| Mentorship | Pairings; check-ins; satisfaction; at-risk relationships | pairs, checkins, feedback | count/score/classification | Missing |
| Membership | Growth; retention; engagement; renewal risk | memberships, engagement | count/percent/score/classification | Missing |
| Financial | Revenue; commitments; giving history; event ROI | receipts, commitments, contributions, event costs | money/history/ratio | Missing |

## Executive dashboard — physical p.20, REQ-006

All mappings below are proposed queries/configuration; every display is missing from the current dashboard unless specified. All metrics are A and validation C applies separately to each listed metric. Calculated percentages/ratios require approved denominator and zero/null behavior. Do not copy illustrated figures or narrative as approved outcomes.

| Fields | Type | Database mapping (proposed) | UI location | Validation / status |
|---|---|---|---|---|
| Period selection (year/YTD) | period / M | report parameters | /dashboard header | Valid supported period; missing |
| Sponsorship Revenue; percent of target | money; percent / A | approved revenue query + funding_targets | headline | C; missing |
| Active Sponsors; new sponsors | integer / A | approved sponsor classification and period query | headline | C; missing; current Active relationships count is not equivalent |
| Sponsor Pipeline; Future funding | money; descriptive label / A | opportunities query | headline | C; missing |
| Renewal Rate; at-risk count | percent; integer / A | agreements/memberships scope TBD | headline | C; missing |
| Active Members; YoY change | integer; percent / A | memberships eligible status and periods | headline | C; missing |
| Relationships: Active; Prospects; Proposal; At Risk | integers / A | organizations + approved risk query | relationships panel | C; first three status counts exist in code, At Risk missing |
| Raised; goal; percent funded; remaining | money; money; percent; money / A | receipts + funding_targets | financial health | C; missing; goal input source/owner not specified |
| Pipeline; Outstanding; Event ROI | money; money; ratio / A | opportunities; commitments/receipts; event revenue/costs | financial health | C; missing |
| Action priority; organization; action; due date (next 7 days) | enum; reference; text; date / A | tasks + organizations | action queue | C; missing; interval boundaries/timezone TBD |
| Awarded; Funds; Graduation; Field | integer; money; percent; percent / A | awards + approved outcome queries | education impact | C; missing; clarify Field as employment or alignment |
| Awards; Engaged alumni | integer / A | awards; alumni engagement query | education impact | C; missing; Awards may alias Awarded |
| Graduation; employment; field alignment; alumni contribution tracking | percent/classification/money / A | outcomes + alumni giving | education impact detail | C; missing; no precise additional layout specified |
| Active pairs; pair health | integer; percent / A | mentorship_pairs + health query | mentorship panel | C; missing |
| Active members; retention | integer; percent / A | memberships + retention query | membership panel | C; missing; do not substitute renewal rate |
| Industry diversity (label); Diverse sectors (value) | text; integer / A | membership/organization industry distribution | diversity panel | C; missing; meaning/denominator TBD |
| People; Volunteer hrs; Alumni giving | integer; decimal hours; money / A | unique people; volunteer_logs; alumni receipts | community impact | C; missing; no volunteer hours source table exists |
| Executive view / narrative | text / A (proposal; source unspecified) | approved narrative rules or reviewed commentary | executive panel | C; missing; no generated factual claims without approval |

## Navigation and controls

Physical pages 1,3–20 show Dashboard, Organizations, Contacts, Giving, Activities, Interests, Programs, Mentorship, Membership, Documents, Reports and Settings. Only the first three have working link targets in source; nine are inert “Soon” labels. Settings has **no field specification**: user/role and lookup editors are proposals requiring REQ-008 and CBC definition, not inferred PDF requirements. Proposed `/settings` must show this limitation.

Directory illustrations include Search and Add New. Organizations/Contacts have code for local directory search and create; global header search is now disabled and labeled unavailable. Other directory searches/forms are missing. Reports' Add New meaning is undefined. Dashboard Export Report is absent and needs format/access approval. No invented Settings fields or KPI formulas are approved by this inventory.

## Day 1 verification boundary

REQ-001/002/008: Organizations and Contacts represent **33 of 133** detailed fields: 23 stored/linked fields and 10 explicitly pending displays. Location from p.1 is additional. The remaining 100 detailed fields have no module UI yet. Metadata inspection found hosted baseline columns/policies matching the initial migration but no hosted migration history. Hosted data was not queried and no hosted migration was applied.

New manual fields and ownership rules are in the two incremental migration files. Actual SQL verification uses disposable PostgreSQL with a minimal Supabase auth contract; browser verification uses the real app/actions against a test-only in-memory HTTP fixture. Neither alone establishes hosted Supabase E2E behavior. The 29-entity draft in `database/proposals/` prepares missing relationships under an inaccessible schema; it is not an implemented workflow or an approved finance model. See [progress](../delivery/progress.md) for final executed results.
