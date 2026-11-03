# Decision / architecture log
| ID | Question | Status | Decision owner |
|---|---|---|---|
| ADR-001 | Data-first or operational app MVP? | OPEN | CBC + instructor |
| ADR-002 | PostgreSQL vs SQL Server? | PROPOSED PostgreSQL | Technical team |
| ADR-003 | Backend/frontend framework? | OPEN | Student team + instructor |
| ADR-004 | Power BI vs embedded dashboard? | OPEN | CBC + team |
| ADR-005 | Google sign-in vs other authentication? | OPEN | CBC admin |
| ADR-006 | Drive document links vs separate storage? | OPEN | CBC admin |
| ADR-007 | Distinguish opportunities, commitments and payments? | OPEN | CBC Finance |
| ADR-008 | Prototype vs production and environment? | OPEN | CBC sponsor |
| ADR-009 | Code ownership, public repo and post-term support? | OPEN | CBC + Bow Valley |

## ADR-010 — MVP organization ownership (accepted 2026-10-26)

Authority: explicit repository-owner instruction in this session; REQ-001/002/008.

- Admins assign/reassign organizations only to active profiles whose role is `staff`.
- Staff may select themselves on creation, or leave ownership unset; afterward staff cannot change or clear ownership. Finance/Viewer cannot change ownership.
- Enforce actor role through RLS and compare old/new ownership in a database trigger; reject invalid, inactive and non-staff owner IDs. UI filtering is supplementary.
- Restricted owner directory exposes only staff ID and display name: admins see active staff; staff see themselves; Finance/Viewer/anonymous receive no directory rows. Profiles retain existing self/admin read restrictions.
- Implementation defines active as `profiles.is_active`; existing profiles default true, preserving current accounts. Only trusted operators may change role/active state; browser profile writes remain denied. Deactivation removes selectable ownership but does not rewrite existing organization ownership. Non-ownership edits preserve historical assignments.
- Existing nullable ownership remains supported. Staff deletion is disabled to prevent delete/reinsert ownership reassignment; admin deletion remains available through the database. No delete UI is added.
- This authorizes the ownership slice, not unresolved finance/KPI formulas or production use. Existing stack is retained for the explicitly requested three-day synthetic demo; instructor/CBC broader stack and acceptance approvals remain open.

## ADR-011 — Activities demo conventions (implemented; CBC review pending)

REQ-005/008. The user explicitly requested the complete activity/follow-up workflow and overdue calculation. These are visible MVP implementation conventions, not approved KPI formulas:

- Store interaction timestamps as timestamptz; forms explicitly accept UTC. Future timestamps represent planned activities and do not advance Last Contact.
- Evaluate date-only deadlines in `America/Edmonton` (Calgary). Complete takes precedence; otherwise due before today = Overdue; today/future/no due date = Open. A follow-up may be completed and reopened explicitly.
- An activity may have zero/many participants and zero/many follow-ups. Organization is optional for person-only interactions. Participants may belong to other organizations; log links are historical, not automatic changes to affiliations.
- Reuse existing CRM access: active Admin/Staff create/edit, Finance/Viewer read only; anonymous/inactive denied. No delete workflow is introduced. Actions may select only owners visible through the existing restricted directory (Admin: active Staff; Staff: self), or be unassigned. Preserving an existing owner is allowed without exposing their profile. This does not modify organization ownership (ADR-010).
- Last Contact is the latest nonfuture explicitly linked interaction. For an activity detail it covers the activity's organization and participant relationships; organization/contact pages use their specific links. Open next action sorts by due date (undated last), then task UUID. No scores/health metrics are implied.
- Dashboard queue includes all overdue and today through six days ahead (seven Calgary calendar dates); show undated actions separately. The page's Due this week metric uses Monday–Sunday; Upcoming meetings counts future activities whose type is exactly Meeting (case-insensitive). Types remain free text with suggestions, not a new approved taxonomy.
- Save activity plus participant replacement atomically. Follow-ups are separate records/forms so a validation error never leaves a partially created action. No financial/reporting KPI definitions are changed. Hosted rollout requires explicit review.

## ADR-012 — MVP giving rules (accepted for synthetic MVP, 2026-10-26)

Authority: explicit user approval in this session; REQ-003/004/006/008. CAD only; calendar-year reporting uses dated cash receipts, never unpaid pledges. Pledges and partial receipts are separate records. Active Admin/Finance are financial writers; Staff/Viewer are read-only. In-kind support is recorded separately without automatic valuation or FX conversion. ADR-007 is resolved for this limited MVP, not production finance/accounting policy.

Implementation conventions supporting those rules:
- Contribution Amount is the manual planned/pledged amount. Funding Status is a planning stage (Prospect, Committed, Invoiced, Cancelled); payment status is separately derived from actual receipts. Setting a stage cannot create cash revenue. Unpaid prospects and cancelled commitments do not create outstanding debt; actual receipts remain cash received even after a planning cancellation.
- Cash pledged/outstanding cover Cash records in Committed/Invoiced stages; outstanding is max(pledge minus non-void receipts, 0). Overpayments remain visible as received cash; never negative outstanding. In-kind amounts are manually declared values, displayed separately and never cash revenue.
- Positive CAD receipts have a nonfuture received date. Void corrections retain the receipt with a reason and exclude it from aggregates. Refunds, accounting reconciliation, immutable financial audit trails and production approval remain deferred.
- Reporting uses Calgary's current date. Current-year comparisons use YTD against the same prior-year cutoff (Feb 29 maps to Feb 28); completed years compare full calendar years. A zero prior baseline returns no percentage, not infinity or a fabricated growth rate. Lifetime cash includes all eligible receipts through today, independent of pledge date.
- Agreement/renewal dates are stored planning metadata. Renewal is entered explicitly; no automatic scheduling rule is assumed from the guide's AUTO label. Program/Event support is a small typed funding-reference lookup, not implementation of recipient/event modules. Documents are reference links only; no file uploads or external access controls are claimed.

## ADR-013 — Sponsor Interests provisional MVP rules (2026-10-27)

**PROVISIONAL — implementation authorized by the repository owner; CBC approval pending.** REQ-014/003/005/008. These rules authorize this synthetic local implementation, not production use or hosted rollout.

- Active Admin/Staff create and edit interests; all four active authenticated roles read. Only Admin archives; no interest hard deletion. Admin may restore an archived record. Archived records remain readable/editable and are excluded from the default directory until Include archived is selected. Inactive/anonymous access remains denied, consistent with existing account controls.
- Every interest has an organization. Primary Contact and Related Opportunity are optional explicit associations, displayed as references. Composite foreign keys require both to belong to that organization, including subsequent reparenting attempts. This interest-specific contact need not be the organization's global primary contact. On organization changes, clear or replace incompatible links explicitly.
- Relationship Owner is inherited live from the organization; there is no interest owner column/editor. Preserve ADR-010 and restricted directory labels, including generic labels for roles without directory access.
- Category is required manual text as the record's label. Strength is optional manual text; no enum, score, automatic matching or inferred strength is introduced. Notes are optional trimmed text.
- Program Alignment is optional, explicit many-to-many linking to existing typed Program funding references. Event references are rejected. Full Programs workflows and new program editing permissions are outside this slice; existing Giving reference permissions remain unchanged.
- A small organization-bound opportunity reference stores a name and optional exact nonnegative decimal estimate. It does not implement pipeline stages, contributions or finance recognition. Admin/Staff manage these references under the same provisional access convention; estimates are excluded from Giving totals. Currency definition remains pending and is labeled so in the directory/reference page; ADR-012's CAD finance rule is not silently expanded.
- Discussions and follow-ups are explicitly selected links. Last Discussed and Last Discussion select the same latest linked nonfuture activity, breaking timestamp ties by ascending UUID. Unlinked organization activities do not become discussions. These are provisional selection conventions, not approved KPIs.
- Next Action reuses existing tasks: selected incomplete follow-ups ordered by due date, undated last, then UUID. Completed tasks stay linked as history and disappear from Next Action; reopening restores eligibility. Manage task content/status through existing Activities forms. No independent interest task lifecycle is introduced.
- Save scalar fields and link replacement atomically with an invoker RPC and a parent-row lock. Failed links roll back the whole save. UUIDs are immutable; server timestamps preserve original creation and update on edits. Archive time is server-generated. Full audit history is deferred.

Acceptance requires automated local SQL/API/browser evidence plus a separate manual demonstration and relevant CBC sign-off. No hosted Supabase change or architecture-PDF publication is authorized.

## ADR-014 — Programs & Recipients provisional MVP conventions (2026-10-29)

**PROVISIONAL — repository owner authorized implementation; CBC approval pending.** REQ-010/002/006/008. Pages 11–12 were inspected only from a mode-600 copy/extraction in a mode-700 directory outside Git. Source examples are not fixture identities.

- Reuse the existing stack for this requested synthetic slice. Active Admin/Staff create/edit operational programs, cohorts, recipients and enrollments; active Admin/Staff/Finance/Viewer read; inactive/anonymous denied. No hard-delete grant or workflow. Existing financial writers and profile/ownership restrictions remain unchanged.
- An operational program has a manual name/description and an optional unique link to an existing typed Giving Program reference. This explicit Program Alignment connects existing Giving/Interests identity without letting Staff write financial reference tables. No automatic name matching, reference creation or name synchronization.
- A cohort belongs to one program, with a required manual label unique within that program and optional calendar year (1–9999). Each enrollment requires one program/cohort and recipient; a composite FK enforces cohort membership, including later cohort reparenting. One enrollment per recipient/cohort; the same recipient may join multiple cohorts/programs. The single optional support amount is a declared total for that enrollment, not an award ledger.
- A recipient is a stable identity. It may be standalone with a name, or link one existing contact (unique per recipient). Linked contact names are read live; no name-based deduplication or new contact is automatic. An optional explicit organization must match the linked contact; otherwise inherit that contact's affiliation. Explicit affiliation FKs prevent incompatible target reparenting. Unlinked recipient identities are counted as distinct records, not presumed deduplicated real people.
- Support is optional exact finite nonnegative CAD decimal text with at most two decimals, a provisional synthetic-demo currency convention. Unknown stays null; zero is explicit. Support totals sum known enrollment amounts and show known/missing counts; these values are not received cash or accounting disbursements. No FX, multiple awards/refunds or financial permission expansion.
- Education Level, Institution, Field of Study, Graduation Status/Date, Employment Status/Field are manual optional values. Do not infer graduation from dates or employment from discipline text. Null outcomes stay unknown. Field Alignment, Graduation Rate, Employed in Field and Scholarships remain Definition pending: there is no approved alignment rubric, denominator, award classification or award-count identity. Outcome directory displays raw graduation/employment labels, not a score or synthesized outcome.
- Participants = distinct recipient IDs among enrollments in the selected program/cohort scope; Enrollments = matching records. Repeated cohorts do not duplicate recipient counts. Support total = exact sum of nonnull support; if none are known, display No support amounts recorded. Text search narrows the directory; program/cohort filters scope both directory and summaries. Only defined raw counts/sums are implemented.
- CBC Engagement supports linked-contact past interaction history from existing activity participants. Last Contact reuses the existing latest nonfuture explicitly contact-linked activity. An unlinked identity has unavailable history, not a factual zero. Full Member/Volunteer/Mentor/Donor classification remains Definition pending; no engagement score is invented.
- Alumni status is an explicit optional nonfuture `alumni_since` date on the recipient, never inferred from graduation. Supported Alumni Giving sums that linked contact's nonvoid Cash receipts from the effective date inclusive through Calgary today, preserving exact CAD and ADR-012. No contact or alumni marker means eligibility pending, not zero. This is person-wide history across enrollments, never allocated to a program or added across program totals. Formal alumni eligibility and program-attribution policy still need CBC review.
- Server-generated metadata preserves original creation, updates modification time and rejects identity changes. Full audit history, sensitive-field policy refinement, imports, student/production approval and hosted rollout remain separate gates. All fixtures are synthetic; no source PDF or private extraction enters Git.


## ADR-015 — Reports foundation presentation (2026-11-01)

REQ-013/004/006/008. Explicit owner request authorizes a Reports foundation and Financial Performance report on the existing stack. This adds no database object, grant, RLS policy, financial writer or approved KPI formula. CBC report acceptance and production policy remain pending.

- All six source categories have reachable routes. Financial Performance is the source Financial category; other categories initially show their specified topics and Definition pending, with no preview totals. Report-only displays do not increase the 133 detailed-field denominator.
- Financial Performance calls the existing `giving_summary` RPC and reads the existing invoker contribution/receipt views under the current authenticated user's access. All four active named roles retain existing read access; writes remain Admin/Finance through existing Giving screens. Anonymous redirects and inactive-profile checks remain unchanged. No service key or privileged report endpoint is added.
- Calendar-year selection changes cash and prior comparable cash only: completed years use full years, current year uses comparable YTD through Calgary today. Allow years 0002 through the current year. All-time pledged/outstanding/lifetime/in-kind values remain clearly labeled current balances, not historical year-end snapshots. Organization selection scopes summaries and record details consistently; invalid/ambiguous query values show errors without totals.
- Details read complete ordered pages with exact counts, reject failed/incomplete/changing/duplicate results and use exact integer cents to reconcile against the existing RPC. A mismatch withholds the report and offers retry rather than displaying unverified totals. This detects inconsistencies but does not create an immutable transactional report snapshot.
- Period receipt details exclude voids and use receipt dates, not pledge dates. All-time contribution details retain prospect/cancelled/in-kind labels; only active Cash commitments count as pledged/outstanding. Link to existing Giving records; no new editing control or automatic accounting policy.
- Event ROI, export format/access, accounting reconciliation/refunds, targets and unsupported category formulas remain pending. Runtime verification, manual demo and named CBC approval are separate gates.


ADR-015 continuation (2026-11-02): after Financial passed its full verification, the owner-requested next category is implemented as a **Sponsor Relationship record subset**. Require explicit organization selection; do not infer sponsor eligibility. Reuse existing manually recorded agreement/renewal dates, organization-linked activities and organization-bound opportunity name/reference links. Show all recorded dates, including future planning dates; no period KPI is implied. Pipeline stages/totals, estimate currency, renewal rate, risk and automatic scheduling remain pending. Same complete-read/error and role restrictions; no schema/policy/grant changes. Four other categories remain pending-only. This records implementation conventions, not CBC report approval.

## ADR-016 — Membership synthetic MVP conventions (2026-11-02)

REQ-009/008. Repository owner explicitly authorized the remaining board-demo implementation on the existing stack. These reversible local-demo conventions remain **provisional; CBC/instructor acceptance pending**.

- Each membership is one recorded term, with exactly one member: contact or organization. Optional explicit affiliation must match the contact; otherwise inherit affiliation. Corporate members cannot name another organization. Composite FKs protect subsequent contact reparenting. Repeated terms remain separate history, with no inferred unique-member, renewal or retention denominator.
- Start is required; renewal is optional and cannot precede start. Calgary today determines Scheduled (start in future), Renewal overdue (renewal before today), otherwise Current term. Renewal today stays Current term. Null renewal means no scheduled renewal is known; Current term does not establish paid/approved entitlement. Upcoming view includes today through 30 days ahead, inclusive.
- Type, industry and payment status are manual text. Nullable exact nonnegative CAD fee is planning metadata, never a receipt, revenue or inferred payment. Unknown differs from zero. Admin/Staff write; all four active roles read. No client hard deletion. Original creation and IDs are immutable; modification time is server-set.
- Program participation reuses explicitly linked contact enrollments; organization members show affiliated recipient enrollments. Last Engagement reuses latest nonfuture contact/organization interaction; relationship owner is inherited through the existing restricted directory. Events Attended, Engagement Score and Renewal Risk remain Definition pending. No event attendance workflow or probability/score is fabricated.
- History is recorded terms plus linked source histories, not an immutable change-audit ledger. Cancellation, member entitlements, fee receipts, approved type/payment taxonomy and automatic renewal are deferred.

## ADR-017 — Mentorship synthetic MVP conventions (2026-11-02)

REQ-011/008; provisional under the same explicit local implementation authorization; CBC approval pending.

- Pairing requires distinct existing contact mentor/mentee, one shared explicit organization, one operational program and a cohort belonging to that program. Composite FKs protect both contacts' affiliation and cohort reparenting. This deliberately limited demo disallows cross-organization pairs; CBC may approve broader matching later. Cohort link is explicit participation context, not proof of a recipient enrollment.
- Start is required; optional target end cannot precede start. Status and check-in frequency are manual labels, with no automatic lifecycle, missed-check-in probability or health score. Pair Health remains Definition pending.
- Completed check-ins are dated, nonfuture records with raw optional mentor/mentee satisfaction text, feedback and issues. Count includes recorded completed check-ins; last date is max recorded date; latest feedback uses that date descending then UUID ascending (null feedback stays unknown). Planned check-ins are not counted. Dates are not inferred from cadence. Check-in parent cannot change; correction uses edit, no hard delete. A check-in date does not establish that both participants attended an event.
- Pair issues and next action/due date are manual planning fields; check-in issues retain conversation history. These do not create Activities tasks automatically. Related pair history shows shared contact identities. No full immutable audit trail, matching algorithm or validated survey scale is claimed.
- Active Admin/Staff write; active Admin/Staff/Finance/Viewer read; inactive/anonymous denied. IDs/creation/update metadata are server protected. No financial or profile permissions change.

## ADR-018 — Document metadata, reports and settings demo conventions (2026-11-02)

REQ-012/013/006/008; provisional, CBC acceptance pending.

- Documents are metadata only: no binary upload/download, bucket, file access or external URL storage is introduced. Upload Date/Uploaded By explicitly describe metadata registration and creator; original registration is immutable and the server sets creator to the actor. This does not claim a file was uploaded. Version is manual; full versioned file history is deferred.
- Optional organization/contact affiliation uses a composite FK; Program/Event links existing typed funding references and agreement links an existing commitment. Classification is manual. Internal metadata is readable by all active roles and writable by Admin/Staff. Admin only metadata is readable/writable only by Admin. Staff cannot create/elevate to that class. No public class, hard delete or user administration is exposed. Actual confidential documents remain prohibited in this public/synthetic demo.
- Settings shows verified current-user/profile role, implemented permission boundaries and sign-out. Role changes, activation, password/email recovery and administration are explicitly unavailable. Environment text identifies the prototype without exposing URLs, keys or configuration secrets.
- Operational reports paginate complete authorized datasets with stable UUID ordering and exact counts. Organization/program/cohort/status/search filters apply to displayed records and their defined raw counts/sums. Membership counts terms, Mentorship counts pair/check-in records, and Program Impact counts distinct recipient IDs and exact known declared support, separately reporting unknowns. Undefined rates, health/risk/retention/event ROI and award classifications remain pending. Executive relationship search only narrows its organization rows; independently labeled global panels retain global scope.
- CSV exports reuse identical query/filter/access code; Financial exports period receipts, Sponsor exports manual commitment dates, operational reports export displayed rows. Every field is quoted and spreadsheet formula prefixes neutralized. Responses are private/no-store; any query/filter/auth failure withholds the file. No privileged report endpoint or service key is added. CSV exports contain synthetic records only under this authorization.
- Dashboard sections reuse existing finance/follow-up semantics and operational queries. Query failures show unavailable, never zero. Null/unknown financial or derived values remain explicit. Full audit history, snapshot isolation during concurrent edits, production confidentiality policy and hosted deployment remain separate gates.
