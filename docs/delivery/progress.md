# Board-demo progress and prioritized plan

Updated 2026-11-02 on `feature/mvp-foundation`. The remaining local board-demo implementation is present: Membership, Mentorship, metadata-only Documents, Settings, six queried record reports/CSV and the executive dashboard. **133/133 fields represented; 125 complete within demo scope; two partial; six pending definitions.** CBC/manual acceptance and hosted deployment remain separate gates. All earlier checkpoints below are historical. Fictional demonstration names use reserved example domains and explicit synthetic-only notices; no real CBC data is included.

<a id="current-field-audit"></a>
## Remaining MVP completion — current audit

REQ-009/011/012/013/006/008. Provisional ADR-016/017/018 follow the repository owner's explicit implementation authorization; they are not CBC-approved production rules. The original seven migrations are unchanged; three additive migrations implement the new domains. No hosted change, binary storage, source-PDF republication or public push occurred.

- Membership: list/search/create/detail/edit, contact/corporate identity and affiliation constraints, type/industry, start/renewal dates, exact nullable CAD planning fee/manual payment, provisional Calgary status, recorded-term history, program/interaction source evidence, restricted inherited owner and upcoming-renewal view.
- Mentorship: pair list/create/detail/edit, distinct same-organization contacts, valid program/cohort, dates/manual status/cadence, completed check-in create/edit/history, count/latest date/raw feedback, issues/action dates and related pairing history. Pair Health is pending.
- Documents: list/search/create/detail/edit metadata, type/source links, protected metadata creator/registration/update dates, manual version/agreement classification/effective/expiry dates and enforced Internal/Admin-only classification. Binary upload/download is deferred. Settings displays verified identity/permissions and sign-out; administration is unavailable.
- Reports: six categories query authorized records, expose meaningful filters and source links, distinguish empty/error states and export supported filtered CSV. Existing Financial and Sponsor subsets remain intact; exact support/count rules are reused without invented rates. CSV quotes cells, neutralizes spreadsheet formulas and shares permissions/filter logic. Executive global panels are labeled separately from relationship filters.
- Dashboard: CRM status/count queries and enrollment histories fully paginate; financial/action summaries are retained. Membership/renewals, Mentorship, Interests, Programs/recipients and recent interactions link to source modules. Independent query failures withhold affected counts.

### Coverage and counting

The [CSV](field-coverage.csv) has 133 unique detailed IDs with database/UI mapping, field validation, functional/calculation status, test evidence and business dependencies. Represented includes pending labels; functional includes partial behavior; complete excludes partials and placeholders. Calculated is an overlapping subset of actual aggregate/date/latest behavior; inherited links and server metadata are not counted as calculations.

| Module | Fields | Represented | Functional (including partial) | Complete demo scope |
|---|---:|---:|---:|---:|
| ORG | 18 | 18 | 18 | 18 |
| CON | 15 | 15 | 14 | 14 |
| GIV | 16 | 16 | 16 | 16 |
| ACT | 15 | 15 | 15 | 15 |
| INT | 11 | 11 | 11 | 11 |
| PRO | 15 | 15 | 14 | 13 |
| MEN | 15 | 15 | 14 | 14 |
| MEM | 15 | 15 | 12 | 12 |
| DOC | 13 | 13 | 13 | 12 |
| **Total** | **133** | **133** | **127** | **125** |

Exclusive partition: **125 complete + two partial + six pending-definition displays + zero absent = 133**. Partial: PRO-13 broader engagement classification and DOC-06 metadata registration without binary upload. Pending: CON-12 Events Attended, PRO-12 Field Alignment, MEN-10 Pair Health, MEM-10 Events Attended, MEM-13 Engagement Score, MEM-14 Renewal Risk. The calculated subset is 25; none of the six placeholders is functional. Status vocabulary distinguishes Complete within demo scope, Partially functional, Represented placeholder, Not implemented and Definition pending; current remaining placeholders all have unresolved definitions. Directory/report/dashboard/Settings-only displays are outside the 133 denominator.

### Runtime verification

All executed against the isolated local stack or its disposable fresh test database; no hosted endpoint was targeted. Private reports live under ignored `.local/cbc-demo`; no generated credentials, screenshots or traces are committed.

| Check / exact command | Result |
|---|---|
| `npm test --prefix apps/frontend` | PASS: 28 validation/unit tests |
| `npm run typecheck --prefix apps/frontend` | PASS |
| `npm run lint --prefix apps/frontend` | PASS |
| `node scripts/demo/verify-database.mjs` | PASS: 279 SQL assertions on fresh PostgreSQL 17; ten canonical versions/checksums; RLS/extension audit |
| `node scripts/demo/verify-api.mjs` | PASS: 20 real Auth/PostgREST checks |
| `node scripts/demo/verify-giving.mjs` | PASS: 39 real checks |
| `node scripts/demo/verify-interests.mjs` | PASS: 59 real checks |
| `node scripts/demo/verify-programs.mjs` | PASS: 68 real checks |
| `node scripts/demo/verify-reports.mjs` | PASS: 70 real checks |
| `node scripts/demo/verify-membership.mjs` | PASS: 32 real checks |
| `node scripts/demo/verify-mentorship.mjs` | PASS: 25 real checks |
| `node scripts/demo/verify-documents.mjs` | PASS: 22 real checks; **335 API checks total** |
| `npm run test:integration --prefix apps/frontend` | PASS: 38 real-Supabase Chromium scenarios, including twelve-step workflows, all active roles, anonymous, filters/source links/CSV and read-only controls |
| `npm run test:e2e --prefix apps/frontend` | PASS: 33 Chromium fixture scenarios, including empty/failure/recovery and existing regressions |
| Production build | PASS through both browser-suite `npm run build && npm run start` commands with explicit test API/public settings |
| `node scripts/demo/check-repeatability.mjs` | PASS: two migration/seed replays; stable canonical history and named new/existing fixture counts |
| `node scripts/demo/stack.mjs audit` then `node scripts/demo/audit.mjs` | PASS: zero local security advisor findings |
| `node scripts/demo/readiness.test.mjs` | PASS: three target/manifest/credential privacy guards |
| `node scripts/demo/refresh-fictional-labels.mjs` twice | PASS: local legacy generic names replaced, no records deleted; IDs/links/counts/cash preserved; idempotent |
| Outgoing-source/credential check and `git diff --check` | PASS: no known private local credentials/key markers/generated local files/PDF changes in outgoing source; publication gate remains |

The browser environment requires Chromium and its runtime libraries. This workstation used ignored `.local/playwright` plus `.local/browser-libs/runtime/usr/lib/x86_64-linux-gnu`; see readiness guide for exact exports. Initial sandbox process/port restrictions and missing browser libraries were resolved. Validation-form state preservation, a new metadata-trigger update bug, stale placeholder assertions, duplicate navigation selectors and a delayed fixture-reset race were fixed and rerun. Final results above supersede intermediate failed attempts; no failure was treated as a pass.

Fictional names replaced generic labels in seed scripts, browser-created records, SQL/unit fixtures and the import example; explicit synthetic notices and reserved domains remain. Earlier test runs left generic names in the local database; a guarded local-only label refresh renamed those without changing financial data or record identity. Role checks cover Admin/Staff/Finance/Viewer; SQL/API separately verify anonymous and inactive denial. Automated tests are evidence for selected flows/shared validators, not a separate end-to-end test for each field or CBC approval.

Implementation commits: `fda6d09` Membership; `712381a` Mentorship; `9833b31` Documents/Settings; `78628b1` Reports/Dashboard; `d26f243` full verification tooling; `c57c7e2` fictional fixtures; `4a61672` local legacy-label refresh. Handoff documentation is committed separately.

### Demo and acceptance evidence

[Walkthrough](board-demo-walkthrough.md) covers all twelve requested steps; automated real-browser workflows provide runtime demonstration evidence. Generated credential location is `.local/cbc-demo/accounts.json` (mode 600 within mode-700 local directory), never published passwords. [Separate hosted plan](hosted-demo-deployment-plan.md) covers a new synthetic-only Supabase project, hosting/configuration/migrations/Auth/seed/RLS/advisors/smoke/rollback/cost review. Existing hosted project remains untouched.

**CBC/manual approval is not complete.** Named CBC/instructor review is required for provisional lifecycle, permissions, pending formulas, stack/deliverables and board acceptance. Binary files, event attendance, unsupported risk/health/retention/alignment/ROI calculations, immutable audit history, imports, payment collection and production accounting remain deferred. Repository-owner resolution of the already-tracked architecture PDF/public-history exposure is required before publication; no history rewrite or push is performed.

## Historical checkpoints

<a id="reports-foundation"></a>
## Reports foundation, Financial Performance and Sponsor Relationship — 2026-11-01–02

REQ-013/004/006/008; ADR-012 financial rules retained, ADR-015 documents presentation/verification conventions. Explicit owner request authorizes this slice on `feature/mvp-foundation`; no source PDF was reopened. No hosted/production resource, canonical migration, RLS policy or financial grant was changed. Existing users retain the same financial read/write rules.

### Implemented behavior and limits

`/reports` and desktop/mobile navigation link all six required categories. `/reports/financial` implements Financial Performance (source Financial); `/reports/sponsor` implements the next record-based subset after Financial verification. `/reports/executive`, `/reports/scholarship`, `/reports/mentorship` and `/reports/membership` show their specified topics with Definition pending and no preview values. This is **two functional report subsets and four pending-only categories**, not six completed reports.

Financial Performance reuses the existing `giving_summary` RPC, invoker `contribution_details`/`giving_receipts` views and shared summary/table components. A selected calendar year scopes actual receipt-date cash and prior comparable cash; current year is comparable Calgary YTD and completed years are full years. Optional organization selection scopes both summary and details. Pledged/outstanding/lifetime cash/in-kind remain clearly labeled all-time current values, not historical year-end balances. Invalid/duplicate/unknown query filters produce explicit errors, not unfiltered fallback totals. Years 0002 through current year are supported; future cash periods are not offered.

Period receipts exclude voids, retain source Giving links and reconcile exactly to cash received. All-time contribution details distinguish active Cash pledged amounts, planning stage, cash received, outstanding and separately declared in-kind. Prospects/cancelled stages do not create debt, while cancelled-record receipts remain cash. Giving links retain their existing role-aware edit restrictions; the report has no write controls. Year filtering does not filter all-time balances. Event ROI, accounting reconciliation/refunds, financial targets and export remain pending, without invented formulas.

Complete ordered reads follow exact API counts rather than accepting the default row cap. Exact integer cents verify period/prior/lifetime cash, pledged/outstanding/in-kind and each contribution's received balance against record detail. Failed/incomplete/changing/duplicate reads or mismatched totals withhold the report with a retry/reset action. This is **not a persisted transactional snapshot**: concurrent edits can require retry. No new reporting framework or privileged endpoint is introduced.

Next loading/Suspense UI contains no sample totals. Successful empty contribution scopes, empty receipt periods and zero amounts have explicit states. Failed date, organization, summary, contribution or receipt queries show Financial report unavailable, never fabricated zeroes. Auth/profile failures use existing access/error handling. The whole-board definition of done still requires a manual synthetic walkthrough and relevant CBC approval.

After Financial Performance passed its complete local suite, work continued to Sponsor Relationship as requested. The report requires an explicitly selected organization; selection does not classify it as a sponsor. It shows all recorded contribution agreement/renewal dates (including future manual planning dates), explicit organization-linked activities and opportunity name/reference links. No currency estimate sum, pipeline stage/total, sponsor eligibility, renewal rate, risk score or automatic schedule is inferred. Empty/no-selection/error states and existing read restrictions are preserved. Activity, opportunity and Giving saves invalidate report displays. No new business rule or data policy is introduced.

### Exact verification

Financial implementation commit: `fda650b`. The initial Financial-only pass had 234 SQL assertions, 244 API checks, 23 real-browser and 22 fixture scenarios. The final combined results below include the subsequent Sponsor subset.

Sponsor continuation commit: `ee5b1bc`. Documentation is committed separately.

| Check | Current result |
|---|---|
| `npm test` | PASS: 23 tests (19 regressions + 4 report period/exact-money/pagination/failure tests) |
| Typecheck and lint | PASS |
| Production build | PASS within both browser suites, using explicit synthetic/local public settings |
| `node scripts/demo/verify-database.mjs` | PASS: 237 SQL assertions (217 prior + 20 report query-contract assertions) in a fresh disposable PostgreSQL 17 database; seven canonical migrations unchanged |
| Existing real API scripts | PASS: CRM/Activities 20; Giving 39; Interests 59; Programs 68 (186 regressions) |
| `node scripts/demo/verify-reports.mjs` | PASS: 70 actual local Auth/PostgREST report checks; all four roles, real pagination, period/lifetime/commitment reconciliation, empty scope, invalid period, anonymous/inactive denial unchanged Staff/Viewer write boundaries, explicit organization interactions/opportunities and manual future renewals |
| Total API checks | **256 passed** |
| `npm run test:integration` | PASS: 27 actual local Supabase Chromium scenarios (17 regressions + 6 Financial/foundation + 4 Sponsor reader/scope/source-link scenarios) |
| `npm run test:e2e` | PASS: 25 fixture Chromium scenarios (15 regressions + 7 Financial loading/empty/query-failure/recovery/mismatch + 3 Sponsor failure/recovery scenarios) |
| Readiness guards | PASS: 3 private-artifact/manifest/endpoint checks |
| Repeatability | PASS: 2 no-op migration replays and 2 seed replays; history and named fixtures remain stable |
| Local security advisor | PASS: zero findings |
| Manual board demo / CBC approval / hosted deployment | NOT performed; remain separate gates |

Browser results use private credential-safe reporting for actual Auth/PostgREST; screenshots/traces/videos remain disabled. All records are synthetic; setup creates isolated report organizations/pledges/receipts without overwriting prior module records. Initial new browser tests needed corrections: their alert locator also matched Next's route announcer, the Sponsor setup selector needed to allow the existing required-field marker, and the real-browser bulk receipt fixture needed explicit non-void flags on every row. Final results above are from the corrected suites, not those failed attempts. Existing middleware deprecation and Node module-type warnings remain. Browser runtime uses the previously documented `/tmp` libraries/browser; run suites sequentially because they rebuild `.next`.

### Coverage and remaining work

The detailed-field audit remains **90/133 represented; 88 with working demo behavior (87 complete + one partial); 19 calculated as an overlapping subset; 46 deferred whole-field behaviors**. Exclusive partition remains 87 complete + one partial + two placeholders + 43 absent = 133. The [CSV](field-coverage.csv) now records which Giving fields are reused in Financial Performance and adds report evidence; it does not count reused fields again or imply that agreement/document/renewal fields are directly displayed in the Financial report.

Reports is now a reachable navigation destination, leaving Mentorship, Membership, Documents and Settings absent. All six report topics have pages; four are pending-only. Sponsor pipeline/renewal performance and unsupported Financial outputs remain pending. Event ROI, export, broader dashboard displays and existing outcome/engagement gaps remain. CBC/instructor scope/stack/student decisions, provisional rules, production finance policy and historical PDF-publication decisions remain open. No hosted changes or Git history rewrite occurred.

The requested next-category continuation is delivered as the Sponsor Relationship subset, after Financial passed its full suite. The next smallest report slice would be Scholarship Impact using existing Programs counts, support completeness and raw outcomes, while award identity, graduation/employment rates and program-attributed alumni giving remain pending. This is a recommendation only; no additional category is promoted in this task.

<a id="historical-field-audit"></a>
## Historical review fixes and field audit — 2026-11-01

REQ-010/002/006/008. The checkout already contained an uncommitted Programs foundation (operational migration, UI, shared revalidation, SQL/API/browser tests and provisional ADR-014). This pass inspected and verified it alongside the review fixes; it does not claim it was absent before this review. No new business module or formula was added. All earlier checkpoints below retain historical evidence, not current totals.

### Review fixes and dashboard loading audit

- Programs: program changes clear incompatible cohorts immediately. The server first loads authorized program/cohort options, validates membership and compatibility, then redirects unknown/malformed/incompatible selections to a normalized URL **before** querying enrollments or summaries. The normalized URL, visible selectors and database filters agree. A valid cohort-only URL remains supported. Text search narrows rows, not summaries, as explicitly labeled.
- Dashboard: organization count, contact count, relationship-status rows and recent organizations previously ignored their query errors and fell back to zero/empty. Their results are now checked as one CRM snapshot; a failure replaces that snapshot with an explicit unavailable panel. Other dashboard sections remain independent. Successful zero counts and empty lists are unchanged.
- Action Queue audit: `followUps` checks its query error; `businessToday` checks RPC error/missing date; the component already catches failures into “Action Queue unavailable.” No change required.
- Giving summary audit: date and `givingSummary` RPC failures already produce “Financial summary unavailable”; no unverified totals render. Successful zero cash is still CAD 0.00. Authentication/profile errors use the existing error boundary rather than financial zeroes. No change to financial calculations, RLS or ownership policies.
- Regression evidence: real browser program A/cohort A → program B checks cohort reset and nonzero B summaries; direct incompatible, malformed, unknown and cohort-only URLs check normalized selectors and results. Fixture browser tests independently fail each of the four CRM queries, distinguish successful empty data, check recovery, and distinguish successful zero cash from a failed financial RPC. Existing action-queue failure coverage remains.

### Detailed field coverage

All 133 unique detailed IDs were reclassified against their matrix mappings, implementation, migrations and automated evidence. [field-coverage.csv](field-coverage.csv) contains every ID, separate flags, mapping, implementation/evidence paths and limitations. Evidence paths identify suites/selected flows, **not** a claim that every field has its own isolated end-to-end assertion. Manual fields are also exercised through shared form/validation flows. Locked proposal tables do not count as functional fields.

Definitions: **represented** means an actual module UI displays the field, including explicit pending labels; **functional** means a demonstrated local demo behavior exists; **fully functional in demo** excludes the partial CBC Engagement classification; **calculated** means a working aggregate, date/status calculation or deterministic latest/next selection (not merely a source AUTO label, explicit link or inherited owner). Calculated is an overlapping subset of functional. **Deferred field** counts absent fields, placeholder fields and the one partial field; it does not count every deferred enhancement on otherwise working fields. Nothing here establishes production policy or CBC acceptance.

| Module | Detailed IDs | Represented | Functional, including partial | Fully functional in demo | Calculated subset | Deferred fields |
|---|---:|---:|---:|---:|---:|---:|
| Organizations | 18 | 18 | 18 | 18 | 5 | 0 |
| Contacts | 15 | 15 | 14 | 14 | 2 | 1 |
| Giving | 16 | 16 | 16 | 16 | 4 | 0 |
| Activities | 15 | 15 | 15 | 15 | 2 | 0 |
| Sponsor Interests | 11 | 11 | 11 | 11 | 3 | 0 |
| Programs & Recipients | 15 | 15 | 14 | 13 | 3 | 2 |
| Mentorship | 15 | 0 | 0 | 0 | 0 | 15 |
| Membership | 15 | 0 | 0 | 0 | 0 | 15 |
| Documents | 13 | 0 | 0 | 0 | 0 | 13 |
| **Total** | **133** | **90** | **88** | **87** | **19** | **46** |

Exclusive partition: **87 fully functional + 1 partial + 2 represented placeholders + 43 absent = 133**. The 19 calculated fields include PRO-13's working interaction count; 18 are in fully functional fields. CON-12 Events Attended and PRO-12 Field Alignment are placeholders. PRO-13 CBC Engagement shows recorded contact interactions but defers broader membership/volunteer/mentor/donor classification. PRO-14's alumni cash requires an explicit contact/alumni date and is person-wide, never allocated or summed across programs. GIV-11 remains manual renewal scheduling; GIV-16 supports links, not file storage/access management. Manual taxonomies, estimate currency and provisional conventions retain their documented approval limits.

The 133 denominator excludes directory-only metrics, six report categories, p.20 dashboard panels and unspecified Settings fields. Program Participants, Enrollments and known/missing support sums work; Scholarships, Graduation Rate and Employed in Field remain pending. Five missing navigation destinations are Mentorship, Membership, Documents, Reports and Settings. A partial dashboard and disabled global search remain; **90/133 does not mean 68% of the complete board demo is operational**.

Reviewed code commit: `1d859ab` (includes the pre-existing Programs foundation and the review corrections). Documentation is committed separately.

### Executed verification

All records are synthetic. Local Supabase runs on loopback 54421/54422; no hosted command or mutation was performed. The SQL runner creates a fresh disposable database, preserving existing demo records. Canonical migration checksums/history cover seven migrations. Browser screenshots/traces/videos remain disabled.

| Check | Exact current result |
|---|---|
| Frontend `npm test` | PASS: 19 tests (5 CRM, 4 Activities, 4 Giving, 3 Interests, 3 Programs); 0 failures |
| `npm run typecheck`; `npm run lint` | PASS |
| Production build | PASS in both browser suites with explicit synthetic/local public configuration |
| `node scripts/demo/verify-database.mjs` | PASS: 217 SQL assertions (172 existing + 45 Programs), fresh PostgreSQL 17 database; canonical checksums/history, RLS and extension audit |
| `node scripts/demo/verify-api.mjs` | PASS: 20 actual local Auth/PostgREST CRM/Activities checks |
| `node scripts/demo/verify-giving.mjs` | PASS: 39 actual local Giving checks |
| `node scripts/demo/verify-interests.mjs` | PASS: 59 actual local Interests checks |
| `node scripts/demo/verify-programs.mjs` | PASS: 68 actual local Programs checks; total API checks **186** |
| `npm run test:integration` | PASS: 17 real-Supabase Chromium scenarios (11 existing + 5 Programs workflows/roles + 1 filter/direct-URL regression) |
| `npm run test:e2e` | PASS: 15 fixture Chromium scenarios (9 existing + 6 dashboard empty/error/recovery/financial-zero regressions) |
| `node --test scripts/demo/readiness.test.mjs` | PASS: 3 endpoint/manifest/private-artifact guards |
| `node scripts/demo/check-repeatability.mjs` | PASS: 2 no-op migration replays and 2 seed replays; stable history and named synthetic counts |
| `node scripts/demo/stack.mjs audit` | PASS: zero local security-advisor findings |
| Manual board demo / CBC approval / hosted rollout | NOT performed; pending separately |

Environment recovery: initial sandbox localhost/process restrictions required authorized local verification outside the sandbox. The first API attempt encountered stale “Due today” fixture dates from an earlier session; the documented named synthetic seed refresh restored date-relative fixtures, then all API checks passed. Initial Chromium attempts could not launch due to missing runtime libraries; pinned browser files and extracted Ubuntu runtime libraries were restored under `/tmp`, without sudo/system package installation, then browser suites passed. Existing Next middleware deprecation and Node module-type warnings remain. No failed attempt is counted as passing evidence.

To reproduce browser checks here, use `LD_LIBRARY_PATH=/tmp/cbc-browser-libs/usr/lib/x86_64-linux-gnu PLAYWRIGHT_BROWSERS_PATH=/tmp/cbc-playwright` before each frontend browser command. Those paths are environment-specific. Run suites sequentially because both rebuild `.next`. Private generated diagnostics live only in ignored `.local/cbc-demo`; refresh named synthetic fixtures when dates change.

### Remaining gates and smallest next slice

Full board completion still needs the 43 absent detailed fields, two placeholders, one partial classification, remaining page-only/dashboard/report displays, runtime verification and a synthetic manual board walkthrough. CBC approval of ADR-011/013/014 and production finance/outcome/access conventions remains separate from code. Scope/stack/student requirements, deployment decisions, audit history, imports/integrations and repository-owner resolution of historical PDF exposure remain open. No hosted changes, confidential publication or Git history rewrite occurred.

**Recommended next slice: a read-only Reports landing page plus the Financial report, reusing the already verified Giving summary.** Represent the six report categories as reachable destinations with honest readiness states; implement only received cash, commitments, outstanding and giving history from existing queries for a selected calendar year. Label event ROI and unsupported topics Definition pending; defer export until format/access is approved. This closes a missing destination with no schema/RLS expansion or invented KPI rules. It is a recommendation, not implemented or approved scope. Mentorship and Membership operations should wait for workflow/permission decisions rather than promoting locked drafts automatically.

## Implemented scope and evidence boundaries

[Register](../requirements/register.csv), [scope](../project/scope.md), [decisions](../project/decisions.md), [field matrix](../requirements/field-matrix.md), [data model](../architecture/data-model.md) and [acceptance scenarios](demo-checklist.md) remain the traceability sources. The user's three-day demo request authorizes continuing the existing stack and representing all pages/fields; it does not approve undefined formulas or settle instructor requirements. LATER operational modules still need CBC workflow approval. ADR-010 records the explicit ownership decision.

| Area | Current implementation | Remaining gap |
|---|---|---|
| Organizations — REQ-001 | Owner, strength, potential, primary-contact selection, estimate, location and existing manual fields in shared forms/actions/detail; source section links and pending history panels | Last Contact and next open action/date are calculated from linked activities/tasks; Giving/renewal displays now implemented through the Giving slice; single free-text type rather than approved multi-tag taxonomy |
| Contacts — REQ-002 | Names/title/email/phone/organization plus type, influence, interests, notes and inherited restricted owner display; directory type/influence/contact count | Last Contact/next open action work on detail; Giving History now implemented; Events Attended and directory Decision Makers/Recently Contacted/Last Contact remain explicitly pending |
| Ownership — REQ-008, ADR-010 | RLS gates actors; private trigger compares OLD/NEW and rejects inactive/non-staff owners and staff reassignment; ID immutable; delete/reinsert bypass denied to staff | Real local Auth/PostgREST verified; cloud-hosted deployment still pending; no browser role/active administration |
| Restricted directory | ID/display-name projection only, synchronized from active Staff; Admin sees active Staff, Staff sees self, Finance/Viewer see none | Historical owner labels remain generic for users without directory access; no broader profile access granted |
| Shared UI/actions | Reusable validated forms, fields, detail/pending displays, inline errors preserving values, role-aware create/edit controls, mobile navigation and disabled unavailable global search | Activities reuses these components, including dates and multi-select participants; remaining modules and global search are not implemented |
| Incremental schema | Five increments cover ownership/manual CRM fields, Activities/tasks, Giving and Sponsor Interests, invoker calculations and metadata enforcement | All six canonical migrations applied on real local Supabase PostgreSQL 17; no hosted project changed |
| Remaining CRM entities | 29-table relational proposal in `database/proposals/`, under unexposed schema, RLS enabled, no client grants/policies | Review-only; not app migrations or working CRUD; future domain policies and definitions required |
| Giving / Opportunities — REQ-003/004 | Giving list/create/detail/edit, typed references, dated receipts, voids, donor histories and SQL financial summaries; approved synthetic rules ADR-012 | Full opportunities pipeline, automatic renewal, refunds/reconciliation/audit history and production finance approval deferred |
| Activities — REQ-005/008 | Listing/new/detail/edit; atomic participant links; multiple add/edit follow-ups; completion/reopen; computed overdue/Last Contact; related histories and dashboard queue | Real local integration passed; cloud deployment and CBC review of ADR-011 still pending; no email/calendar sync or recurrence |
| Sponsor Interests — REQ-014/003/005/008 | List/create/detail/edit, organization history, explicit Program/discussion/opportunity/task links, inherited restricted owner, manual strength, Admin archive/restore | ADR-013 provisional pending CBC approval; currency definition for manual opportunity estimates, full pipeline/Programs workflows and audit history deferred |
| Programs / Mentorship / Membership — REQ-010/011/009 | Locked program/cohort/enrollment/pair/check-in/feedback/member drafts | Missing pages and workflows; pending outcome, health, retention/renewal/risk rules |
| Documents / Settings — REQ-012/008 | Locked document/link/version proposals; existing profile permissions retained | Missing pages; no Settings field guide, file storage decision or approved module access policy |
| Reports / Dashboard — REQ-013/006 | Existing basic organization/contact/status/recent-record dashboard remains | Six report pages/topics and p.20 domain panels/period/export missing; no invented KPI formulas |
| Import — REQ-007 | Existing synthetic sample/mapping templates | No importer; outside board demo unless separately approved |

## Database inspection and verification — historical Activities checkpoint

The table below records the Activities checkpoint. Giving and Sponsor Interests evidence at the end supersedes its suite counts and field totals.

During Day 1, hosted metadata was inspected read-only: public profiles/organizations/contacts columns and RLS policies matched the baseline migration; migration history was empty. No hosted business records were queried and no remote changes were made. The empty history must be reconciled by the operator before deployment; do not replay initial DDL or reset existing data.

The latest SQL suite passed all 97 assertions in a fresh database on the real local Supabase PostgreSQL 17.11 server. The prior Activities pass used isolated PostgreSQL 18.6; that historical limitation is superseded for local engine compatibility. It creates a fresh disposable database per run and installs a minimal `auth.users`/`auth.uid()` contract and applies baseline, three increments and locked proposals. Synthetic users cover Admin, two Staff, Finance, Viewer and inactive Staff. Tests run with database roles and JWT-subject context, rather than merely checking SQL text. This verifies PostgreSQL constraints/triggers/RLS. Separately, fresh official Supabase initialization and actual Auth/PostgREST integration now verify service integration and explicit grants with automatic exposure disabled. No cloud project is changed.

The regression browser suite builds the real Next app with loopback-only synthetic configuration, starts a test-only in-memory Supabase HTTP fixture and drives Chromium. A separate integration suite now drives the app against real local Supabase Auth/PostgREST with generated-password accounts and private diagnostics. It checks actual forms, server actions, redirects and rendering; PostgreSQL assertions independently verify database enforcement. No browser fixture is imported by application code. No screenshots or traces are captured.

| Check | Actual result / scope |
|---|---|
| `npm run test` | PASS: 9 parser/validation tests (five CRM regressions plus UTC/date/calendar/participant/follow-up validation and offset normalization) |
| `npm run typecheck` | PASS after final UI/test edits |
| `npm run lint` | PASS after final UI/test edits |
| Production `npm run build` with synthetic public URL/key | PASS. Initial sandbox attempt failed on Turbopack worker port; authorized rerun succeeded. Existing middleware deprecation warning remains |
| `bash database/tests/run.sh` | PASS: 97 SQL assertions (46 existing + 51 Activities) in a fresh database on real local PostgreSQL 17.11; actual Supabase default database receives only canonical migrations, never proposals/test auth bootstrap |
| `npm run test:e2e` | PASS: all nine Chromium scenarios, including explicit due-week/overdue/upcoming count checks, full activity/participant/follow-up lifecycle, role/error states and existing CRM regressions. The final run rebuilt the latest production app successfully |
| Documentation/field coverage and `git diff --check` | PASS: 133 unique IDs, 43 locally implemented/5 pending detailed fields, matrix structure, links, formatting and preserved staged PDF removal checked |
| Real local Supabase API/browser | PASS: 20 actual Auth/PostgREST checks and three Chromium scenarios covering admin login/CRUD/edit/relationships/calculations/queues and Finance/Viewer read-only behavior |
| Repeatability/readiness guards | PASS: two migration/seed replays; unchanged history and stable seed counts; three endpoint/manifest/ignore/permission tests |
| Local security advisor | PASS: zero findings on fresh real Supabase. pgcrypto is in extensions; the earlier public-schema warning belonged to the bare PostgreSQL bootstrap, not a proven hosted issue |
| Cloud-hosted deployment | NOT performed. Separate hosted project creation/migrations need explicit approval; existing project remains untouched. Real local Auth/PostgREST is now verified |
| CBC demo/acceptance | NOT performed; relevant approval remains pending except explicitly accepted ADR-010 |

Chromium runtime was unavailable initially. A pinned current Playwright version, downloaded browser and user-local libraries under `/tmp` enabled testing without system sudo access. `/tmp` was cleared on session interruption and restored; these tools are not repository artifacts. Environment-specific commands and all test limitations are documented in [frontend setup](../../apps/frontend/README.md) and [database setup](../../database/README.md).

## Three-day delivery order

| Priority / day | Reviewable slice | Acceptance |
|---|---|---|
| Day 1 | Database ownership decision/enforcement, additive CRM fields, shared forms and synthetic verification | AT-01/02/03/04/14 locally; final results above. Full done still needs hosted integration, demo and relevant approval |
| Day 2 first | Represent all eight remaining navigation destinations, all remaining 85 detailed fields, six report categories and p.20 dashboard panels using shared fields and clearly labeled pending calculations | AT-15 coverage against all 133 IDs and page-only displays; do not count inert Soon labels as pages |
| Day 2 next | Activity/task slice implemented locally; next enable reviewed giving workflows in small slices and promote only reviewed drafts | AT-05/06/07; Finance and task rules gate calculations, not honest field representation |
| Day 3 | Reconcile migration baseline in an approved synthetic deployment, run real Auth/PostgREST allow/deny flows, rehearse every page/report and reconcile approved metrics | AT-08–16 where implemented; mark pending behavior plainly; no live CBC data |
| Final gate | Documentation, reproducible setup, test evidence, board walkthrough and named CBC sign-offs | Definition of done = implementation + automated verification + demo + documentation + relevant CBC approval |

ADR-007 is resolved for the synthetic MVP by ADR-012; production finance rules, outcome denominators, health/risk rubrics, report/export definitions and unspecified Settings fields remain open. Activities conventions are now explicit in ADR-011, implemented for the demo and pending CBC review. Keep those fields represented as Definition pending; do not manufacture approved rules to meet the deadline. Sponsor Interests now has REQ-014; shared evidence still needs dedicated requirement references. No microservices or production integrations are introduced.

## Git and publication status

Commit `b26f884` removed the PDF from the current tree; its ignore rule remains. No PDF is added to this implementation. No source extraction, confidential records, credentials or service-role keys are committed. Existing Git history exposure is not remediated by current-tree removal; history cleanup remains a repository-owner decision before publication. No history rewrite or push is performed.

Reviewable commits:

- `b3a9360` — database ownership, manual fields, locked drafts, synthetic SQL suite and ADR-010 (REQ-001/002/008).
- `2071fa9` — shared Organization/Contact forms, owner UI, manual/linked/pending fields, synthetic browser/unit tests and setup instructions (REQ-001/002/008).
- `e234031` — Activities/participants/follow-ups migration, RLS, invoker calculations, 51 new SQL assertions, local test-runner support and ADR-011 (REQ-005/008).
- `1b1a255` — Activities pages/forms, related histories, dashboard queue and synthetic browser/validation coverage (REQ-005/006/008).
- `025f6ed` — explicit contact-affiliation FK selection fixes real PostgREST ambiguity (REQ-002).
- `7bb0d59` — isolated real Supabase config, private seed/verification tooling and integration browser suite (REQ-001/002/005/008).
- Delivery documentation is committed separately after verification. Initial planning documents are retained and updated; AGENTS.md instructions are preserved.

## Activities delivery evidence — REQ-005/008

All 15 source fields from physical PDF pp.7–8 are represented and locally implemented. New routes are `/activities`, `/activities/new`, `/activities/[id]`, `/activities/[id]/edit` and `/activities/[id]/follow-ups/[taskId]/edit`. New activity save and participant replacement are atomic; follow-ups are separate one-to-many records/forms. UTC timestamps, Calgary date boundaries, completion precedence, nonfuture Last Contact, next-action ordering, undated actions and exact Meeting-type count conventions are documented in ADR-011.

The dashboard queue and organization/contact histories use actual linked records. Query failures display errors, never false zeroes. Organization ownership/profile-directory policies were not changed; SQL regressions explicitly verify ADR-010. Finance/Viewer have read-only activity access. Task owner selection reuses the existing restricted staff directory; owner labels never reveal hidden profile information.

Before committing: typecheck/lint, production build, 97 SQL assertions, validation tests, browser tests, local security advisor and documentation consistency are recorded above. Native PostgreSQL uses a private mode-700 socket and no TCP listener; no hosted project is queried or changed for this task. Advisor's generic “remote database” message refers to the explicitly supplied local socket DSN. No linked-project command was used.

Deferred: hosted migration application/history reconciliation, real Supabase Auth/PostgREST E2E, manual CBC demo/sign-off, confirmation of operational date/count conventions, recurring tasks, notifications/calendar sync, broad module-specific production permissions and remaining domains. Baseline pgcrypto schema relocation requires operator review; no existing extension is moved in this module task. The existing middleware warning remains.

## Hosted integration readiness — current result

See [exact setup, audit and approval steps](hosted-integration-readiness.md). Separate workspace `environments/demo` runs the official native Supabase runtime (CLI 2.120.0 pinned), PostgreSQL 17.11, Auth and PostgREST on loopback API/database ports 54421/54422. Real app uses 3140, separately from mock 3100/54329 and fixture tests 3130/54339. No cloud resources were created or hosted commands run.

Canonical migration order/dependencies/RLS/grants were audited. Generated copies are byte-identical and ignored. Actual migration history contains exactly the four source versions, including the original 12-digit version. Repeatability is history-aware application of pending migrations, not raw SQL replay. No manual schema edits, reset/history repair or extension relocation is required on the fresh stack. The named synthetic baseline is five Auth users, one organization, two contacts, one activity and six follow-ups, including overdue/today/upcoming/complete/undated/outside-window cases.

True integration found a PGRST201 relationship ambiguity masked by the HTTP fixture. Both contact queries now select organizations through `contacts_organization_id_fkey`; actual API/browser and nine fixture regressions pass. Organization ownership policies and architecture coverage are unchanged. New keys/passwords stay only in ignored mode-600 files under a mode-700 directory; the frontend receives only its public API key. Private browser reporting avoids credential disclosure in failure output.

No local integration blocker remains. Cloud project creation, applying reviewed migrations to a new hosted reference, secure configuration, production-specific verification and CBC sign-off still need explicit approval. The existing hosted project's schema/history/extension placement was not re-audited or modified. Earlier Activities paragraphs about unverified local Auth/PostgREST are historical and superseded here.

After readiness: **Sponsorship & Giving**, then **Sponsor Interests**. Keep financial and risk/KPI formulas pending until reviewed.

## Next smallest task

Sponsor Interests is implemented and verified locally under provisional ADR-013 (see latest evidence below). Next delivery gate is a synthetic manual walkthrough and CBC review of those conventions. The wider Day 2 plan still requires six missing destinations/58 fields, with Programs next in navigation order; define its operational slice before promoting draft tables. No hosted rollout is authorized.

## Sponsorship & Giving implementation — REQ-003/004/006/008

ADR-012 records explicit user approval of CAD, calendar-year dated cash reporting, partial receipts separate from pledges, separate in-kind and Admin/Finance writes with Staff/Viewer reads. All 16 GIV fields now have UI/database representation. Contribution list/new/detail/edit, receipt add/edit/void, funding reference creation, document reference entry, organization/contact histories and dashboard financial summaries reuse shared forms/fields. Renewal is manually entered despite the source AUTO label; no automatic formula is claimed. The program/event lookup does not implement full domain modules. Financial totals are queried from PostgreSQL; API monetary values remain exact decimal text. Query failures show unavailable, never false zero revenue.

`20261027060754_sponsorship_giving.sql` adds four RLS tables, invoker views/RPC, numeric/date/FK checks and receipt/type validation. It is applied **only to the existing isolated local Supabase demo**. Fresh-database assertions apply all five canonical migrations in order. Organization ownership/profile/directory policies are unchanged.

| Check | Giving increment evidence |
|---|---|
| Database assertions | PASS: 134 assertions on fresh local PostgreSQL 17 (97 regressions + 37 Giving); role denial, exact decimals, partial/void/overpaid/cancelled cash, in-kind isolation, annual/lifetime/YoY/zero baseline, typed links and chronology |
| Actual Auth/PostgREST | PASS: 39 Giving checks + 20 existing CRM checks; Admin/Finance allowed, Staff/Viewer direct writes denied, anonymous denied, Finance ownership unchanged |
| Repeatability / guards | PASS: two migration/seed replays and three readiness guards; five canonical versions, stable named five-contribution/four-receipt fixtures; no manual schema edits |
| Security advisor | PASS: zero findings locally; pgcrypto stays in extensions; no hosted changes |
| Validation / static | PASS: 13 validation tests; final typecheck/lint passed; production build passed within the real-browser suite (existing middleware warning remains) |
| Real browser | PASS: all six actual Auth/PostgREST Chromium scenarios, including Finance contribution create/edit, partial receipt/void validation, document reference, organization/contact history, dashboard summary and Staff/Viewer read-only controls |
| Fixture regressions | PASS: all nine Chromium scenarios and production rebuild; explicit unavailable Giving history asserted because this fixture does not implement Giving |
| CBC / cloud | Not performed; manual board walkthrough and production finance approval pending; no cloud resources or hosted migrations |

Coverage is 64/133 represented: 63 locally implemented and CON-12 Events Attended explicitly pending. Previous coverage totals are historical. GIV-11 automatic scheduling remains deferred; GIV-16 represents links only. Remaining domains include Sponsor Interests, Programs/Recipients, Mentorship, Membership, Documents, Reports and Settings; seven missing destinations and 69 fields. Open scope/student deliverable/CBC acceptance questions are unchanged.

Deferred Giving functionality: refunds/negative receipts, accounting reconciliation, immutable audit history, automatic renewals, approved sponsorship tier taxonomy, uploads/external document permissions, full program/event workflows, FX/in-kind valuation and production approval. No PDF/data/key is included; the staged architecture PDF removal remains preserved and excluded from these commits. The untracked generated frontend AGENTS.md is left untouched.

Final checks: all six real integration and nine fixture browser scenarios passed. Initial Giving browser runs exposed test locator/navigation-wait issues; these were corrected before the passing run. No application change was needed for those failures. A sandbox child-process restriction initially blocked the readiness guard; its authorized rerun passed all three tests.

Reviewable Giving commits: `15a7428` adds database enforcement/37 SQL assertions and ADR-012; `a91966e` adds the Giving UI and browser/validation coverage. Local fixture/verifier and delivery updates follow separately. The demo production server was restored at http://localhost:3140/login after verification.

## Session resumed — planning checkpoint, 2026-10-27, REQ-014

The clean repository checkpoint includes completed local Giving verification and commit `b26f884`, which removes the architecture PDF from the current tree. Historical exposure remains an owner decision; no history rewrite or publication occurred.

Started the recorded next task with planning only: assigned Sponsor Interests REQ-014, expanded its module worksheet with all eleven INT mappings and six directory columns, and aligned field-matrix/data-model/AT-07 references. No application code, migrations or hosted resources changed; coverage remains 64/133. The PDF was not reopened.

Before mutation implementation, settle interest role permissions, category/strength values, program/opportunity identities, contact inheritance and explicit discussion/task selection. Existing activity and financial permissions do not establish interest permissions. Undefined calculations remain Definition pending. Next implementation follows the proposed slice in the Sponsor Interests worksheet; automated runtime verification, demo and CBC approval remain separate requirements.

## Sponsor Interests implementation and verification — 2026-10-28

REQ-014/003/005/008; **ADR-013 is provisional pending CBC approval**. The user authorized Admin/Staff edits, authenticated reads, Admin-only archive, mandatory organization, affiliated optional contact/opportunity, optional programs, inherited ownership, manual strength, existing follow-ups and preserved timestamps. The worksheet/decision log records the additional provisional link-selection conventions. Full audit history is deferred. No new scoring, matching, automatic finance recognition or approved KPI formula is claimed.

All eleven INT fields are represented in list/create/detail/edit and organization history. The directory has all six source columns, search and Include archived. Small opportunity create/detail reference screens keep estimates distinct from contributions; currency definition remains explicitly pending. Program alignment reuses existing typed Program references without changing Giving permissions. Explicit discussion links select one latest nonfuture activity (timestamp then UUID); explicit existing-task links select one incomplete action (due date, undated last, UUID). Completed tasks remain linked history. Organization owner labels retain restricted directory behavior. Shared CRM/Activities/Giving saves refresh interest displays.

`20261028015014_sponsor_interests.sql` is the sixth canonical migration, applied only to the isolated local Supabase stack. Composite FKs enforce contact/opportunity organization membership and prevent target reparenting. RLS and private metadata validation enforce active-role access, Admin-only archive/restoration, immutable identity, preserved creation and server-generated update/archive times. There are no interest/opportunity hard-delete grants. Atomic invoker saves lock the parent and replace all selected links; invalid links roll back scalar changes and prior link removal. The detail view uses security_invoker. Locked proposals remain unexposed and unchanged.

| Check | Executed result / evidence boundary |
|---|---|
| Database assertions | PASS: 172 assertions on a fresh disposable database using real local Supabase PostgreSQL 17.11 (134 prior + 38 Interests). Includes affiliation/reparenting, required fields, typed Program links, future/unrelated/tied discussion selection, completed/undated/tied actions, timestamps, archive bypass prevention, atomic rollback and role denial |
| Actual Auth/PostgREST | PASS: 59 Interests checks plus 20 CRM and 39 Giving regressions. Real Auth users and public API under actual RLS; anonymous/inactive/Finance/Viewer mutation denial, restricted owner labels, Admin archive/restore and Staff saves verified |
| Migration/seed repeatability | PASS: two no-op migration/seed replays preserve six-version history and named baseline counts. Interests fixture: one interest, two organization-bound opportunity references, two linked discussions, one Program link and three existing-task links, plus affiliation-negative organization/contact targets |
| Security/readiness | PASS: zero local security-advisor findings; all public base tables have RLS; pgcrypto remains in extensions; three endpoint/checksum/ignore/permission guards pass |
| Validation/static | PASS: 16 parser/validation tests; final typecheck and lint pass |
| Production build | PASS: browser suites build the production app with explicit synthetic/local public settings. Existing middleware deprecation and Node module-type warnings remain |
| Real browser | PASS: 11 real-Supabase Chromium scenarios (six prior + five Interests): full Staff form workflow/affiliation feedback/multi-link preservation/all INT displays/edit/history/search, Admin opportunity reference and archive/restore, optional links/mobile navigation, Finance/Viewer read-only and anonymous redirect |
| Fixture browser regressions | PASS: all nine existing Chromium scenarios with production rebuild. Fixture does not implement Interests; organization history displays unavailable there instead of a false empty history |
| Documentation | Field matrix retains 133 unique detailed IDs; all eleven INT mappings and six directory labels updated. Decision/specification, requirement register, data model, module matrix, setup and acceptance evidence align with provisional scope |
| Manual CBC demo / approval | NOT performed. Automated browser walkthrough is not CBC sign-off. Instructor/stack and wider board-demo approval gates remain open |
| Hosted / confidential source | No hosted project queried or changed, no publication/push/history rewrite, no PDF reopened or added, no live CBC records or private credentials in source changes |

Coverage is now **75/133 detailed fields represented**: 74 locally implemented, CON-12 Events Attended explicitly pending; six destinations and 58 detailed fields remain missing. Overall board-demo completion is not claimed.

The first SQL attempt exposed a synthetic test-actor setup error, corrected before the passing run. Initial writer-browser failures were required-label selector mismatches, corrected to accessible role selectors. No screenshots, video or traces were captured. Browser binaries/runtime libraries were restored under `/tmp`; generated keys, passwords and diagnostic reports stay ignored/private under `.local/cbc-demo`. No system library installation or real data was used.

Review/reproduce with `node scripts/demo/verify-database.mjs`, `node scripts/demo/verify-interests.mjs`, existing API verifiers, `node scripts/demo/check-repeatability.mjs`, local advisors/readiness guards and frontend test/typecheck/lint/browser commands in the setup guides. Next gate is the manual synthetic walkthrough and CBC review; remaining module implementations follow the wider prioritized plan separately.

Final review: production demo rebuilt and started successfully at http://localhost:3140/login against the real local API. Fourteen built browser JavaScript assets contain no generated service-role key or synthetic-account password. Final field/register/link checks and `git diff --check` pass. Source changes remain uncommitted for review; no push/publication occurred.

## Sponsor Interests pre-commit review — 2026-10-28

Reviewed implementation/migration/test/documentation paths and shared cache refreshes; no unrelated edits or confidential/token artifacts found. `git diff --check`, 172 SQL assertions, 59 real local Interests API checks, 16 validation tests, typecheck/lint and three readiness guards passed again. The real-local 11-scenario browser suite/production build was rerun before committing; the first launch was blocked by the existing demo listener, which was stopped for the isolated suite. The PDF removal is already recorded in `b26f884`; no PDF deletion is currently staged. The ignored local PDF and Git history remain untouched by the implementation commit.


## Version 2 experience redesign (2026-11-03)

The complete local frontend redesign is implemented on `version-2`, based on Version 1 commit `e0e864e`. It preserves all 133 field classifications and business-rule boundaries. Evidence: [screen inventory/design decisions](../design/version-2.md), [Version 2 verification](version-2-verification.md), and private before/after screenshot gallery at `.local/cbc-demo/version-2/comparison.html` (100 screenshots; not tracked). Local production browser capture covered 25 destinations at desktop/mobile and observed zero runtime errors, console errors or document overflow. Unit tests (30), real-Supabase browser scenarios (43) and fixture browser scenarios (33) passed. This is engineering evidence only; manual board walkthrough and CBC/instructor acceptance remain pending.
