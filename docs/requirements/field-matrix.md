# Architecture field matrix

Current field audit: 2026-11-02 (earlier rows retain their evidence granularity), branch `feature/mvp-foundation`. Source: safe local copy of *CBC Database Architecture 2026.pdf*, 20 physical PDF pages. Page numbers below are **physical pages**, not the illustrated footer or database-page number. No source examples or personal records are reproduced.

This is a field-level inventory and proposed design, not an approved schema. [Register](register.csv) and [decisions](../project/decisions.md) remain authoritative for approval. The requested board demo represents every source page/field; modules marked LATER in the register need scope reconciliation before operational implementation.

M = manual; A = source AUTO (linked, system-populated or calculated, not necessarily a formula). All missing mappings and routes are proposals. Names beginning with `giving`, `outcomes`, `engagement`, or ending in `latest`, `count`, `next` describe proposed queries, not existing columns or approved calculations. Default UI location is the module detail page, editable fields also in create/edit forms; derived fields are read-only. Directory-specific fields and metrics follow below.

Status: **Code** = migration + read/write UI/action inspected, runtime unverified; **Partial** = migration exists but editor or display absent; **Missing** = required mapping/UI absent. Day 1 adds **Local DB + browser fixture** (isolated PostgreSQL assertions and browser coverage against a synthetic Supabase HTTP fixture), **Represented / pending** (read-only label exists, no calculation), and **Draft only** (locked entity proposal, no module UI). A later readiness pass adds **Local Supabase E2E (selected flow)** for rows exercised in real local Auth/PostgREST browser workflows. Neither local status means cloud-hosted deployment or CBC acceptance.

Validation legend (proposed unless explicitly marked existing): **T** trim text; requiredness/length need CBC review. **R** valid existing referenced record and authorized selection, relationship cardinality needs review. **D** valid date/time, chronology and timezone rules need approval. **N** decimal precision/currency/sign and aggregation rules need approval. **E** approved controlled values; do not infer exhaustive enums from examples. **C** source linkage, null/tie/period/eligibility rules and reconciliation example required; show “Definition pending” until approved. Existing names have nonblank DB/action checks; email has action regex + HTML validation; FK integrity exists for contact organization and organization owner. Existing status enum and High/Medium/Low checks are in the migration; their business approval is unverified. Day 1 parser validates HTTP(S) URLs without embedded credentials, finite estimated amounts, enums, identifiers and email. Incremental DB constraints cover finite amounts, email/URL syntax and same-organization primary contact; historical URL/email checks use NOT VALID to avoid forced data cleanup. See ADR-010 for ownership and active status.

Current totals and all 133 independently classified rows are in [field coverage](../delivery/field-coverage.csv); see [counting definitions and verification](../delivery/progress.md#current-field-audit). Source AUTO labels do not establish implemented calculations.

## Organizations — REQ-001

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| ORG-01 | Organization Name | 2 | text | M | organizations.name | /organizations detail/form | Existing nonblank DB + action | Local Supabase E2E (selected flow) |
| ORG-02 | Organization Type | 2 | text | M | organizations.organization_type | /organizations detail/form | T | Local DB + browser fixture |
| ORG-03 | Industry | 2 | text | M | organizations.industry | /organizations detail/form | T | Local DB + browser fixture |
| ORG-04 | Website | 2 | text / URL | M | organizations.website | /organizations detail/form | HTTP(S) parser; DB syntax check | Local DB + browser fixture |
| ORG-05 | Primary Contact | 2 | contact reference | A | organizations.primary_contact_id | /organizations edit: affiliated-contact selector; linked detail | Composite FK; explicit selection; delete clears pointer | Local Supabase E2E (selected flow) |
| ORG-06 | Relationship Owner | 2 | user reference | M | organizations.relationship_owner | /organizations create/admin edit + detail | ADR-010: RLS, active-Staff target check, immutable staff ownership | Local Supabase E2E (selected flow) |
| ORG-07 | Relationship Status | 2 | enum | M | organizations.relationship_status | /organizations detail/form | Existing enum/check; CBC approval pending | Local DB + browser fixture |
| ORG-08 | Relationship Strength | 2 | enum | M | organizations.relationship_strength | /organizations create/edit + detail | Existing H/M/L checks + shared parser | Local DB + browser fixture |
| ORG-09 | Priority Level | 2 | enum | M | organizations.priority_level | /organizations detail/form | Existing enum/check; CBC approval pending | Local DB + browser fixture |
| ORG-10 | Potential | 2 | enum | M | organizations.potential | /organizations create/edit + detail | Existing H/M/L checks + shared parser | Local DB + browser fixture |
| ORG-11 | Estimated Opportunity | 2 | decimal / currency | M | organizations.estimated_opportunity | /organizations detail/form | Finite numeric parser + DB check; currency rules pending | Local DB + browser fixture |
| ORG-12 | Current Contribution | 2 | money aggregate | A | contribution_details + giving_summary by organization | /organizations detail Giving History | ADR-012: active cash commitments / balances; no single-period assumption | Local DB + real Supabase API/browser |
| ORG-13 | Lifetime Giving | 2 | money aggregate | A | giving_summary(...).lifetime_cash | /organizations detail Giving History | Nonvoid cash through today; never pledge sum | Local DB + real Supabase API/browser |
| ORG-14 | Last Contact | 2 | timestamp | A | activity_last_contact(...) | /organizations detail: related history | Latest nonfuture linked timestamp | Local DB + browser fixture |
| ORG-15 | Next Action | 2 | task reference | A | tasks.description via linked activity | /organizations detail: related history | First incomplete action by due date (undated last), then UUID | Local DB + browser fixture |
| ORG-16 | Next Action Date | 2 | date | A | tasks.due_date | /organizations detail: related history | First incomplete action by due date (undated last), then UUID | Local DB + browser fixture |
| ORG-17 | Renewal Date | 2 | date | A linked; M scheduling | contributions.renewal_date | /organizations detail Giving History; per-contribution edit | No earliest/next automatic rule assumed; show each agreement date | Local DB + real Supabase API/browser |
| ORG-18 | Notes | 2 | text | M | organizations.notes | /organizations detail/form | T | Local Supabase E2E (selected flow) |

## Contacts — REQ-002

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| CON-01 | First Name | 4 | text | M | contacts.first_name | /contacts detail/form | Existing nonblank DB + action | Local Supabase E2E (selected flow) |
| CON-02 | Last Name | 4 | text | M | contacts.last_name | /contacts detail/form | Existing nonblank DB + action | Local Supabase E2E (selected flow) |
| CON-03 | Title | 4 | text | M | contacts.title | /contacts detail/form | T | Local Supabase E2E (selected flow) |
| CON-04 | Organization | 4 | organization reference | A | contacts.organization_id | /contacts form selector + linked detail; AUTO display, manual association | FK; explicit contacts_organization_id_fkey hint prevents ambiguous REST embed | Local Supabase E2E (selected flow) |
| CON-05 | Email | 4 | text / email | M | contacts.email | /contacts detail/form | Email parser + HTML + DB syntax check | Local DB + browser fixture |
| CON-06 | Phone | 4 | text | M | contacts.phone | /contacts detail/form | T | Local DB + browser fixture |
| CON-07 | Contact Type | 4 | lookup | M | contacts.contact_type | /contacts detail/form | Free text; controlled taxonomy pending | Local DB + browser fixture |
| CON-08 | Influence Level | 4 | enum | M | contacts.influence_level | /contacts detail/form | Nullable H/M/L parser + DB check | Local DB + browser fixture |
| CON-09 | Relationship Owner | 4 | user reference | A | organizations.relationship_owner | /contacts detail: inherited owner label | Linked organization; restricted directory visibility | Local DB + browser fixture |
| CON-10 | Last Contact | 4 | timestamp | A | activity_last_contact(...) | /contacts detail: related history | Latest nonfuture linked timestamp | Local Supabase E2E (selected flow) |
| CON-11 | Next Action | 4 | task reference | A | tasks.description via linked activity | /contacts detail: related history | First incomplete action by due date (undated last), then UUID | Local DB + browser fixture |
| CON-12 | Events Attended | 4 | count / history | A | contacts.attendance (proposed) | /contacts detail: Definition pending | C; no formula implemented | Represented / pending |
| CON-13 | Giving History | 4 | linked contributions | A | contributions.contact_id + giving_summary by contact | /contacts detail Giving History | Directly linked contact only; donor-scoped nonvoid cash | Local DB + real Supabase API/browser |
| CON-14 | Interests | 4 | text / links | M | contacts.interests | /contacts detail/form | T | Local DB + browser fixture |
| CON-15 | Notes | 4 | text | M | contacts.notes | /contacts detail/form | T | Local DB + browser fixture |

## Sponsorship & Giving — REQ-003/004

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| GIV-01 | Organization | 6 | organization reference | M | contributions.organization_id | /giving list/detail/form | Optional FK; active financial writer | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-02 | Contact | 6 | contact reference | M | contributions.contact_id | /giving list/detail/form | Optional FK; no donor double counting | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-03 | Contribution Date | 6 | date | M | contributions.contribution_date | /giving list/detail/form | Required finite calendar date | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-04 | Amount | 6 | decimal / currency | M | contributions.amount / currency | /giving list/detail/form | CAD; nonnegative exact decimal, max two decimals; pledge, never cash | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-05 | Contribution Type | 6 | lookup | M | contributions.contribution_type | /giving list/detail/form | Cash / In-Kind; cash history prevents type conversion | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-06 | Sponsorship Level | 6 | lookup | M | contributions.sponsorship_level | /giving list/detail/form | Manual text; controlled tier taxonomy pending | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-07 | Program / Event | 6 | initiative reference | M | contributions.program_id / event_id → funding_initiatives | /giving list/detail/form | Typed FK Program/Event; minimal funding lookup | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-08 | Funding Status | 6 | lookup | M | contributions.funding_status; contribution_details.payment_status | /giving list/detail/form | ADR-012 planning stages; payment calculated from receipts | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-09 | Agreement Start | 6 | date | M | contributions.agreement_start | /giving list/detail/form | Optional finite date | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-10 | Agreement End | 6 | date | M | contributions.agreement_end | /giving list/detail/form | Optional finite date; end >= start | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-11 | Renewal Date | 6 | date | A source; M MVP (ADR-012) | contributions.renewal_date | /giving list/detail/form | Manual finite date; automatic renewal scheduling deferred | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-12 | Current-Year Giving | 6 | money aggregate | A | giving_summary(...).annual_cash | /giving list/detail/form and dashboard/history (read-only totals) | ADR-012: nonvoid dated cash in calendar year / current YTD | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-13 | Lifetime Giving | 6 | money aggregate | A | giving_summary(...).lifetime_cash | /giving list/detail/form and dashboard/history (read-only totals) | Nonvoid dated cash through Calgary today; linked donor scope | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-14 | YoY Change | 6 | decimal / percent | A | giving_summary(...).yoy_delta / yoy_percent | /giving list/detail/form and dashboard/history (read-only totals) | Comparable YTD / full historical years; zero baseline → no percent | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-15 | Outstanding Commitment | 6 | money aggregate | A | contribution_details.outstanding; giving_summary(...).outstanding | /giving list/detail/form and dashboard/history (read-only totals) | Active cash commitment minus receipts, floor zero; all-time balance | Local DB + real Supabase API/browser; see Giving evidence |
| GIV-16 | Documents | 6 | document links | A linked display; M reference entry | giving_document_links → contributions | /giving list/detail/form | HTTP(S), nonblank label; reference only; no uploads | Local DB + real Supabase API/browser; see Giving evidence |

## Activities & Follow-Ups — REQ-005

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| ACT-01 | Date / Time | 8 | timestamp | M | activities.occurred_at | /activities create/edit/detail | Required finite timestamptz; UTC input; strict calendar/parser validation | Local Supabase E2E (selected flow) |
| ACT-02 | Activity Type | 8 | text | M | activities.activity_type | /activities create/edit/detail | Required nonblank; free text with source examples | Local Supabase E2E (selected flow) |
| ACT-03 | Organization | 8 | organization reference | M | activities.organization_id | /activities create/edit/detail | Optional organization FK; read/write access checked | Local Supabase E2E (selected flow) |
| ACT-04 | Contact(s) | 8 | contact references | M | activity_contacts.contact_id | /activities create/edit/detail | FK + composite PK; atomic participant replacement; multi-select | Local Supabase E2E (selected flow) |
| ACT-05 | Location | 8 | text | M | activities.location | /activities create/edit/detail | Trimmed optional text; persisted through invoker RPC | Local DB + browser fixture |
| ACT-06 | Purpose | 8 | text | M | activities.purpose | /activities create/edit/detail | Trimmed optional text; persisted through invoker RPC | Local Supabase E2E (selected flow) |
| ACT-07 | Key Discussion | 8 | text | M | activities.key_discussion | /activities create/edit/detail | Trimmed optional text; persisted through invoker RPC | Local DB + browser fixture |
| ACT-08 | Sponsor Needs | 8 | text | M | activities.sponsor_needs | /activities create/edit/detail | Trimmed optional text; persisted through invoker RPC | Local DB + browser fixture |
| ACT-09 | CBC Opportunity | 8 | text | M | activities.cbc_opportunity | /activities create/edit/detail | Trimmed optional text; persisted through invoker RPC | Local DB + browser fixture |
| ACT-10 | Outcome | 8 | text | M | activities.outcome | /activities create/edit/detail | Trimmed optional text; persisted through invoker RPC | Local Supabase E2E (selected flow) |
| ACT-11 | Next Action | 8 | text | M | tasks.description | /activities detail + follow-up create/edit | Nonblank description; multiple follow-ups per activity | Local Supabase E2E (selected flow) |
| ACT-12 | Action Owner | 8 | user reference | M | tasks.owner_id | /activities detail + follow-up create/edit | Restricted directory; DB validation; inactive/hidden target rejected | Local Supabase E2E (selected flow) |
| ACT-13 | Due Date | 8 | date | M | tasks.due_date | /activities detail + follow-up create/edit | Optional finite calendar date; Calgary timezone | Local Supabase E2E (selected flow) |
| ACT-14 | Status | 8 | enum | A | follow_ups.status / follow_up_status(...) | /activities detail/list; dashboard queue | Computed on SELECT: Complete precedes Overdue; before Calgary today only | Local Supabase E2E (selected flow) |
| ACT-15 | Last Contact | 8 | timestamp | A | activity_last_contact(...) | /activities detail; organization/contact histories | Invoker RPC; latest nonfuture linked timestamp | Local Supabase E2E (selected flow) |

## Sponsor Interests — REQ-014 (related pipeline scope: REQ-003)

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| INT-01 | Organization | 10 | organization reference | M | sponsor_interests.organization_id | /interests list/form/detail; organization history | Required FK; provisional ADR-013 | Local Supabase E2E (selected flow) |
| INT-02 | Primary Contact | 10 | contact reference | A | sponsor_interests.primary_contact_id | /interests form; linked detail | Optional explicit association; same-organization composite FK; provisional ADR-013 | Local Supabase E2E (selected flow) |
| INT-03 | Interest Category | 10 | text (source lookup) | M | sponsor_interests.category | /interests list/form/detail | Required nonblank manual label; provisional taxonomy; provisional ADR-013 | Local Supabase E2E (selected flow) |
| INT-04 | Interest Strength | 10 | text (source enum) | M | sponsor_interests.strength | /interests list/form/detail | Optional manual text; no scoring; provisional ADR-013 | Local Supabase E2E (selected flow) |
| INT-05 | Program Alignment | 10 | program references | M | interest_programs → funding_initiatives (Program) | /interests list/form/detail | Optional multi-links; typed FK rejects Events; provisional ADR-013 | Local Supabase E2E (selected flow) |
| INT-06 | Last Discussed | 10 | timestamp | A | interest_details.last_discussed | /interests detail (read-only) | Explicit past discussions; timestamp descending then UUID; provisional ADR-013 | Local Supabase E2E (selected flow) |
| INT-07 | Last Discussion | 10 | activity reference | A | interest_details.last_discussion_id | /interests detail (read-only) | Same selected activity as INT-06; provisional ADR-013 | Local Supabase E2E (selected flow) |
| INT-08 | Related Opportunity | 10 | opportunity reference | A | sponsor_interests.opportunity_id → opportunities | /interests form; linked detail | Optional same-organization composite FK; independent of Giving; provisional ADR-013 | Local Supabase E2E (selected flow) |
| INT-09 | Relationship Owner | 10 | user reference | A | organizations.relationship_owner → restricted staff_directory | /interests list/detail (read-only) | Live inheritance; ADR-010 directory restrictions; provisional ADR-013 | Local Supabase E2E (selected flow) |
| INT-10 | Next Action | 10 | task reference | A | interest_tasks → tasks; interest_details.next_task_id | /interests detail (read-only); explicit link form | Existing incomplete task; due date then UUID; undated last; provisional ADR-013 | Local Supabase E2E (selected flow) |
| INT-11 | Notes | 10 | text | M | sponsor_interests.notes | /interests detail/form | Optional trimmed text; provisional ADR-013 | Local Supabase E2E (selected flow) |

## Programs & Recipients — REQ-010

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| PRO-01 | Program | 12 | program reference | M | program_enrollments.program_id | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-02 | Recipient / Participant | 12 | person reference | M | program_enrollments.recipient_id | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-03 | Cohort / Year | 12 | cohort reference | M | program_enrollments.cohort_id | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-04 | Award / Support Amount | 12 | decimal / currency | M | program_enrollments.support_amount | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-05 | Education Level | 12 | lookup | M | program_enrollments.education_level | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-06 | Institution | 12 | text / reference | M | program_enrollments.institution | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-07 | Field of Study | 12 | lookup | M | program_enrollments.field_of_study | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-08 | Graduation Status | 12 | lookup | M | program_enrollments.graduation_status | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-09 | Graduation Date | 12 | date | M | program_enrollments.graduation_date | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-10 | Employment Status | 12 | lookup | M | program_enrollments.employment_status | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-11 | Employment Field | 12 | lookup | M | program_enrollments.employment_field | /programs/enrollments detail/form | ADR-014; exact/nullable support, manual outcomes, explicit identity/cohort integrity | Local DB + real Supabase API/browser |
| PRO-12 | Field Alignment | 12 | boolean / classification | A | No approved mapping; pending rubric | /programs/enrollments and recipient detail (read-only) | Definition pending; no inferred discipline matching | Represented / pending |
| PRO-13 | CBC Engagement | 12 | activity history | A | program_recipient_details.recorded_interactions | /programs/enrollments and recipient detail (read-only) | Linked-contact nonfuture interactions only; broader classification pending | Partial functional: recorded interactions; classification deferred |
| PRO-14 | Alumni Giving | 12 | money aggregate | A | program_recipient_details.alumni_cash | /programs/enrollments and recipient detail (read-only) | Explicit alumni date/contact; nonvoid cash; person-wide, not program attribution | Local DB + real Supabase API/browser |
| PRO-15 | Last Contact | 12 | timestamp | A | program_recipient_details.last_contact | /programs/enrollments and recipient detail (read-only) | Latest nonfuture contact-linked activity; unavailable without contact | Local DB + real Supabase API/browser |

## Mentorship — REQ-011

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| MEN-01 | Mentor | 14 | person reference | M | mentorship_pairs.mentor_id | /mentorship detail/form | Required contact FK within selected organization; mentor differs from mentee. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-02 | Mentee | 14 | person reference | M | mentorship_pairs.mentee_id | /mentorship detail/form | Required contact FK within selected organization; mentee differs from mentor. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-03 | Program / Cohort | 14 | cohort reference | M | mentorship_pairs.program_id + cohort_id | /mentorship detail/form | Required program/cohort composite FK; reject cross-program cohort and reparenting. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-04 | Start Date | 14 | date | M | mentorship_pairs.start_date | /mentorship detail/form | Required finite calendar date; form/DB checks. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-05 | Target End Date | 14 | date | M | mentorship_pairs.target_end_date | /mentorship detail/form | Optional finite date on/after start; form/DB checks. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-06 | Status | 14 | lookup | M | mentorship_pairs.status | /mentorship detail/form | Required trimmed nonblank manual label; DB check; no lifecycle inference. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-07 | Check-In Frequency | 14 | cadence | M | mentorship_pairs.checkin_frequency | /mentorship detail/form | Optional trimmed manual cadence text; no automatic schedule. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-08 | Last Check-In | 14 | timestamp | A | mentorship_details.last_checkin | /mentorship detail (read-only) | Read-only max completed recorded check-in date; future completed check-ins rejected. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-09 | Check-Ins Completed | 14 | integer | A | mentorship_details.checkins_completed | /mentorship detail (read-only) | Read-only count of recorded completed check-in rows under RLS. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-10 | Pair Health | 14 | classification | A | No approved health rule; explicit pending label | /mentorship detail (read-only) | Read-only pending label; no health formula. | Definition pending — label only; no calculation |
| MEN-11 | Mentor Satisfaction | 14 | survey score | A | mentorship_details.mentor_satisfaction | /mentorship detail (read-only) | Optional raw feedback text on check-in; latest by date descending/UUID ascending; null remains unknown. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-12 | Mentee Satisfaction | 14 | survey score | A | mentorship_details.mentee_satisfaction | /mentorship detail (read-only) | Optional raw feedback text on check-in; latest by date descending/UUID ascending; null remains unknown. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-13 | Issues / Flags | 14 | text | M | mentorship_pairs.issues + mentorship_checkins.issues | /mentorship detail/form | Optional trimmed manual pair/check-in issues text. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-14 | Next Action | 14 | text | M | mentorship_pairs.next_action | /mentorship detail/form | Optional trimmed manual next-action text. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEN-15 | Action Due Date | 14 | date | M | mentorship_pairs.action_due_date | /mentorship detail/form | Optional finite calendar due date; no inferred completion. | Complete within demo scope — local shared workflow evidence; CBC pending |

## Membership — REQ-009

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| MEM-01 | Member | 16 | person or organization reference | M | memberships.contact_id OR member_organization_id | /membership detail/form | Exactly one contact or organization member; valid FK; composite affiliation FK. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-02 | Membership Type | 16 | lookup | M | memberships.membership_type | /membership detail/form | Required trimmed nonblank text; DB nonblank check. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-03 | Organization | 16 | organization reference | M | memberships.organization_id + inherited contact affiliation | /membership detail/form | Optional organization FK; same contact affiliation or same corporate member; inheritance otherwise. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-04 | Industry | 16 | lookup | M | memberships.industry | /membership detail/form | Optional trimmed manual text; taxonomy pending. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-05 | Start Date | 16 | date | M | memberships.start_date | /membership detail/form | Required finite calendar date; form validDate and DB isfinite. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-06 | Renewal Date | 16 | date | M | memberships.renewal_date | /membership detail/form | Optional finite calendar date on/after start; DB and form chronology. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-07 | Membership Fee | 16 | decimal / currency | M | memberships.fee (exact CAD text in membership_details) | /membership detail/form | Nullable exact nonnegative CAD decimal; max two decimals; reject NaN/Infinity/negative; unknown preserved. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-08 | Payment Status | 16 | lookup | M | memberships.payment_status | /membership detail/form | Optional trimmed manual text; no inferred payment. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-09 | Status | 16 | classification | A | membership_details.status | /membership detail (read-only) | Read-only Calgary date derivation; start precedence; today not overdue; SQL boundary assertions. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-10 | Events Attended | 16 | integer | A | No attendance workflow; explicit pending label | /membership detail (read-only) | Read-only pending label; no attendance query/count. | Definition pending — label only; no calculation |
| MEM-11 | Program Participation | 16 | program history | A | program_enrollment_details explicit member links | /membership detail (read-only) | Read-only fully paginated explicit contact/organization recipient enrollment links under RLS. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-12 | Last Engagement | 16 | timestamp | A | membership_details.last_engagement | /membership detail (read-only) | Read-only latest eligible nonfuture linked interaction via activity_last_contact. | Complete within demo scope — local shared workflow evidence; CBC pending |
| MEM-13 | Engagement Score | 16 | decimal | A | No approved score; explicit pending label | /membership detail (read-only) | Read-only pending label; no score input or calculation. | Definition pending — label only; no calculation |
| MEM-14 | Renewal Risk | 16 | classification | A | No approved risk rule; explicit pending label | /membership detail (read-only) | Read-only pending label; no risk input or calculation. | Definition pending — label only; no calculation |
| MEM-15 | Relationship Owner | 16 | user reference | A | membership_details.relationship_owner + staff_directory | /membership detail (read-only) | Read-only inherited organization owner; restricted staff_directory labels. | Complete within demo scope — local shared workflow evidence; CBC pending |

## Documents — REQ-012

| ID | Field | Source p. | Type | M/A | Database mapping | UI location | Validation | Status |
|---|---|---|---|---|---|---|---|---|
| DOC-01 | Document Name | 18 | text | M | documents.name | /documents detail/form | Required trimmed nonblank text; DB check. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-02 | Document Type | 18 | lookup | M | documents.document_type | /documents detail/form | Optional trimmed manual text; no approved taxonomy inferred. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-03 | Organization | 18 | organization reference | M | documents.organization_id | /documents detail/form | Optional organization FK; composite contact affiliation when both linked. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-04 | Contact | 18 | contact reference | M | documents.contact_id | /documents detail/form | Optional contact FK; composite organization affiliation when both linked. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-05 | Program / Event | 18 | initiative reference | M | documents.initiative_id | /documents detail/form | Optional funding_initiatives FK; lookup labels distinguish Program/Event. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-06 | Upload Date | 18 | timestamp | A | documents.uploaded_at (metadata registration only) | /documents detail (read-only) | Server-set immutable metadata registration timestamp; no file-upload claim. | Partially functional — local shared workflow evidence; CBC pending |
| DOC-07 | Uploaded By | 18 | user reference | A | documents.uploaded_by (metadata creator only) | /documents detail (read-only) | Server sets authenticated creator; update preserves original; forged values overridden. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-08 | Version | 18 | text | M | documents.version | /documents detail/form | Optional trimmed manual version label; no binary version history. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-09 | Effective Date | 18 | date | M | documents.effective_date | /documents detail/form | Optional finite calendar date; form/DB checks. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-10 | Expiry Date | 18 | date | M | documents.expiry_date | /documents detail/form | Optional finite date on/after effective date when both known; form/DB checks. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-11 | Related Agreement | 18 | agreement reference | A | documents.agreement_id + agreement_classification | /documents detail (read-only) | Optional contributions FK and manual agreement classification; no derived document inference. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-12 | Access Level | 18 | permission classification | M | documents.access_level | /documents detail/form | Internal/Admin only enum; RLS enforces active-role read and Admin/Staff writes; restricted class Admin only. | Complete within demo scope — local shared workflow evidence; CBC pending |
| DOC-13 | Last Updated | 18 | timestamp | A | documents.updated_at | /documents detail (read-only) | Server-set modification timestamp; caller cannot forge it. | Complete within demo scope — local shared workflow evidence; CBC pending |

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
| 5 Giving | Revenue YTD; Committed; Outstanding | money / A | giving_summary annual_cash / pledged / outstanding | Giving summary and dashboard | ADR-012; period cash vs all-time commitment balances explicitly labeled | Local DB + real Supabase API/browser |
| 5 Giving | Date; Organization; Amount; Level; Program / Event; Status | aliases / M | GIV-03/01/04/06/07/08 | Giving directory | Per referenced rows | Local DB + real Supabase API/browser |
| 7 Activities | Date; Type; Organization; Purpose; Next Action; Owner | aliases / M | ACT-01/02/03/06/11/12 | Activities directory | Per referenced rows; restricted owner display | Local DB + browser fixture |
| 7 Activities | Due this week; Overdue; Upcoming meetings | integer / A | follow_ups; activities | Open actions panel | ADR-011: Calgary Mon–Sun; incomplete overdue; future exact Meeting type | Local DB + browser fixture; CBC convention review pending |
| 9 Interests | Organization; Interest; Strength; Program Alignment; Owner | aliases / M or A | INT-01/03/04/05/09 | Interests directory | Per referenced rows; provisional ADR-013 | List/search and organization history implemented locally |
| 9 Interests | Opportunity (amount) | money / A | opportunities.estimated_amount | Interests directory | Manual exact estimate; currency definition pending; distinct from link | Local reference display; excluded from Giving totals |
| 11 Programs | Participants; Scholarships | integer / A | program_summary participants; no award-count mapping | Programs KPIs | ADR-014 distinct recipient IDs; scholarship classification pending | Participants functional locally; Scholarships represented / pending |
| 11 Programs | Graduation Rate; Employed in Field | percent / A | approved outcome queries | Programs KPIs | C; denominators/cohorts | Represented / pending; no approved denominators/rubric |
| 11 Programs | Recipient; Program; Cohort; Level; Field | aliases / M | PRO-02/01/03/05/07 | Programs directory | Per referenced rows | Local DB + real Supabase API/browser |
| 11 Programs | Outcome | classification / A (proposal; source unspecified) | program_enrollment_details graduation_status / employment_status | Programs directory | Manual labels; unknown explicit; no synthesized outcome | Local DB + real Supabase API/browser |
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

All six source categories now have reachable pages under `/reports`; Financial Performance uses the existing ADR-012 Giving queries under ADR-015. No invented report formulas or new schema/policies. Read-only report output is separate from the 133 detailed database fields. See [current evidence](../delivery/progress.md#reports-foundation).

| Report | Specified output fields/topics | Database sources | Type | Status |
|---|---|---|---|---|
| Executive Performance | Funding; sponsorship; membership; program KPIs | proposed domain queries | aggregate measures | Reachable pending page; calculations deferred |
| Sponsor Relationship | Pipeline; renewals; interactions; opportunities | contribution_details; organization-linked activities; opportunity references | money/date/history | Manual agreements/renewals, interactions and reference links functional locally; pipeline/rates/risk pending |
| Scholarship Impact | Awards; graduation; employment; alumni engagement | proposed domain queries | money/count/percent/history | Reachable pending page; calculations deferred |
| Mentorship | Pairings; check-ins; satisfaction; at-risk relationships | locked draft, no operational query | count/score/classification | Reachable pending page; calculations deferred |
| Membership | Growth; retention; engagement; renewal risk | locked draft, no operational query | count/percent/score/classification | Reachable pending page; calculations deferred |
| Financial Performance (source Financial) | Received cash; commitments; giving history; event ROI | giving_summary; contribution_details; giving_receipts | money/history/ratio | Cash/balances/history locally implemented and reconciled; year cash/org filters; event ROI/export pending |

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
| Action priority; organization; action; due date (next 7 days) | enum; reference; text; date / A | follow_ups + activities + organizations | action queue | Overdue + Calgary today through day 6 implemented; undated separate; priority remains unspecified |
| Awarded; Funds; Graduation; Field | integer; money; percent; percent / A | awards + approved outcome queries | education impact | C; missing; clarify Field as employment or alignment |
| Awards; Engaged alumni | integer / A | awards; alumni engagement query | education impact | C; missing; Awards may alias Awarded |
| Graduation; employment; field alignment; alumni contribution tracking | percent/classification/money / A | outcomes + alumni giving | education impact detail | C; missing; no precise additional layout specified |
| Active pairs; pair health | integer; percent / A | mentorship_pairs + health query | mentorship panel | C; missing |
| Active members; retention | integer; percent / A | memberships + retention query | membership panel | C; missing; do not substitute renewal rate |
| Industry diversity (label); Diverse sectors (value) | text; integer / A | membership/organization industry distribution | diversity panel | C; missing; meaning/denominator TBD |
| People; Volunteer hrs; Alumni giving | integer; decimal hours; money / A | unique people; volunteer_logs; alumni receipts | community impact | C; missing; no volunteer hours source table exists |
| Executive view / narrative | text / A (proposal; source unspecified) | approved narrative rules or reviewed commentary | executive panel | C; missing; no generated factual claims without approval |

## Navigation and controls

Physical pages 1,3–20 show Dashboard, Organizations, Contacts, Giving, Activities, Interests, Programs, Mentorship, Membership, Documents, Reports and Settings. Dashboard, Organizations, Contacts, Activities & Follow-Ups, Sponsorship & Giving, Sponsor Interests, Programs & Recipients and Reports now have routes; Mentorship, Membership, Documents and Settings remain inert “Soon” labels. Settings has **no field specification**: user/role and lookup editors are proposals requiring REQ-008 and CBC definition, not inferred PDF requirements. Proposed `/settings` must show this limitation.

Directory illustrations include Search and Add New. Organizations/Contacts have code for local directory search and create; global header search is now disabled and labeled unavailable. Activities has purpose/type/organization search, status filtering and forms. Giving and Sponsor Interests have list/create/detail/edit; Interests adds search and an archive filter. Other module searches/forms remain missing. Reports' Add New meaning is undefined. Dashboard Export Report is absent and needs format/access approval. No invented Settings fields or KPI formulas are approved by this inventory.

## Day 1 verification boundary

REQ-001/002/008: Organizations and Contacts represent **33 of 133** detailed fields: 23 stored/linked fields and 10 explicitly pending displays. Location from p.1 is additional. The remaining 100 detailed fields have no module UI yet. Metadata inspection found hosted baseline columns/policies matching the initial migration but no hosted migration history. Hosted data was not queried and no hosted migration was applied.

New manual fields and ownership rules are in the two incremental migration files. Actual SQL verification uses disposable PostgreSQL with a minimal Supabase auth contract; browser verification uses the real app/actions against a test-only in-memory HTTP fixture. Neither alone establishes hosted Supabase E2E behavior. The 29-entity draft in `database/proposals/` prepares missing relationships under an inaccessible schema; it is not an implemented workflow or an approved finance model. See [progress](../delivery/progress.md) for final executed results.

## Activities implementation update — REQ-005/008

All 15 ACT fields from physical pp.7–8 are implemented locally. Activity listing/new/detail/edit routes support organizations, multiple contacts and complete discussion fields. Follow-ups are separate one-to-many records with their own add/edit forms, action owners, due dates, completion/reopening and database-derived status. Organization/contact details now calculate Last Contact and next open action.

Coverage is **48/133 detailed fields represented**: 43 stored/linked/calculated fields locally implemented and five explicit pending displays (organization current/lifetime giving and renewal; contact events/giving). The other 85 fields remain future-module work. Day 1 counts above are retained as historical evidence; this section supersedes them.

The additive Activities migration remains local-only. Actual RLS/RPC/constraint assertions run on isolated PostgreSQL 18.6; the real app/actions run against a test-only HTTP fixture in Chromium. No hosted migration, Auth/PostgREST integration or CBC acceptance is claimed. Operational date/count conventions are explicit in ADR-011 and remain subject to CBC review, not presented as approved KPIs. See progress for executed verification totals.

## Integration readiness — REQ-001/002/005/006/008

A fresh **real local Supabase PostgreSQL 17 + Auth + PostgREST** environment now applies all four canonical migrations without manual schema edits. Two migration/seed replays preserve applied history and the named synthetic baseline. Twenty real API checks and three real-browser scenarios exercise authentication, creation/editing, relationships, status/history/action queues and read-only roles. Selected row statuses above reflect those flows; other local DB/fixture evidence remains unchanged. **Cloud-hosted deployment has not been performed.**

The contact organization embed needed an explicit FK hint after the composite primary-contact FK introduced a second relationship; both affected queries are fixed and verified against actual PostgREST. All 97 SQL assertions also pass on a fresh PostgreSQL 17 database. Fresh official Supabase places pgcrypto in extensions and reports zero local security-advisor findings; the existing hosted project's placement remains unverified.

Coverage remains 48/133 represented (43 locally implemented, five pending), with no new financial/KPI definitions. Exact connection steps, private credential handling and required cloud approvals are in [hosted integration readiness](../delivery/hosted-integration-readiness.md). Next: Sponsorship & Giving, then Sponsor Interests.

## Sponsorship & Giving evidence — REQ-003/004/006/008

ADR-012 records the user's approved synthetic MVP finance rules. All 16 GIV fields now have database/UI mappings. Renewal is manually scheduled despite the source AUTO label; automatic scheduling remains deferred. Documents are manually entered links with automatic related display, not a document-management implementation. Full Program/Event workflows remain deferred; typed funding references are implemented.

Current coverage: **64/133 detailed fields represented**. Of these, 63 have local implementations, including 16 Giving fields and four previously pending organization/contact giving fields. CON-12 Events Attended remains explicitly pending. The other 69 fields and seven navigation destinations remain missing. This section supersedes historical coverage totals above; source page numbers/133 IDs are unchanged. Local tests and CBC approval are distinct; see progress for exact verified checks.

Cash receipt records are additional implementation support fields: received_on (finite nonfuture date), amount (positive exact CAD decimal), reference (manual optional text), is_void (manual disposition), void_reason (required if void). Admin/Finance write, Staff/Viewer read; anonymous/inactive denied. No delete grants. Read-only financial views use security_invoker and the aggregate RPC uses security invoker; no service key is supplied to UI/actions.


## Sponsor Interests implementation — REQ-014/003/005/008

ADR-013 records provisional owner-authorized rules, pending CBC approval. All eleven INT fields have local schema/UI representation with explicit contact/opportunity/program/discussion/task links, inherited restricted ownership, manual strength, atomic saves and Admin-only archiving/restoration. No interest hard deletion, automatic scoring or matching is implemented. Last-discussion and next-action selection conventions are provisional; query errors remain unavailable.

Current coverage is **75/133 detailed fields represented**: 74 locally implemented and CON-12 Events Attended explicitly pending. Six navigation destinations and 58 detailed fields remain missing. This supersedes historical totals above. The opportunity directory amount is a manual estimate with currency definition pending, not approved finance revenue. Manual CBC demonstration/sign-off and hosted rollout remain unperformed. See progress for actual verification evidence.


## Current Programs and review audit — 2026-11-01

Earlier checkpoint totals in this document are historical. The [current 133-row audit](../delivery/field-coverage.csv) supersedes them: 90 represented, 88 with working local demo behavior (87 complete within demo scope plus one partial), 19 calculated as an overlapping subset, and 46 with deferred whole-field behavior. See [definitions and executed evidence](../delivery/progress.md#current-field-audit). PRO-01–15 and the Programs directory/KPI rows above now reflect the operational schema/UI; no source PDF was reopened for this reconciliation. Page-only/report/dashboard completion is separate from the 133 denominator.

## Remaining MVP completion — 2026-11-02

REQ-009/011/012/013/006/008; provisional ADR-016/017/018. Membership, Mentorship and Documents now use exposed RLS-protected public schemas and working workflows, not locked draft tables. Settings shows actual account permissions. Six reports and the dashboard show queried records/defined counts, with explicit failures and pending formulas. Source physical-page references above are retained; no PDF or extracted content was republished.

Current detailed coverage: 133 represented, 125 complete within demo scope, two partial (PRO-13 engagement classification; DOC-06 metadata registration with binary upload deferred) and six definition-pending displays (CON-12, PRO-12, MEN-10, MEM-10, MEM-13, MEM-14). Functional includes the two partial fields: 127; placeholders are excluded. See CSV for per-field status, validation, calculation evidence and dependencies. This is local synthetic implementation/automated verification, not CBC approval or production readiness.
