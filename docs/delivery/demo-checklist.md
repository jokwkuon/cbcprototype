# Board-demo checklist and acceptance tests

Status: local automated verification now includes Reports foundation, Financial Performance and Sponsor Relationship (2026-11-01–02); see each executed evidence section below. Planned scenarios are the full-demo target; manual CBC demonstration/acceptance remains pending. Extends [acceptance](acceptance.md) without claiming its gates passed. Field-level coverage is in the [matrix](../requirements/field-matrix.md); implementation order and evidence are in [progress](progress.md). Use synthetic people, organizations, transactions and files only.

## Demo readiness

- [ ] Repository owner resolves tracked architecture PDF/publication exposure before publishing a branch, PR or artifact; do not attach private source material to the demo.
- [ ] CBC/instructor reconcile complete page representation with register priorities, confirm stack/student deliverables and name acceptance authority.
- [ ] Reproducible local setup, isolated test database and synthetic login identities for proposed roles; no production account required.
- [ ] Every field-matrix entry appears at its documented location; pending calculations display “Definition pending”; synthetic previews are labeled.
- [ ] Navigation reaches all 12 pages: Dashboard, Organizations, Contacts, Sponsorship & Giving, Activities & Follow-Ups, Sponsor Interests, Programs & Recipients, Mentorship, Membership, Documents, Reports, Settings.
- [ ] Directory search/add, detail/edit, loading/empty/error, narrow-screen navigation and keyboard access are demonstrated where appropriate; undefined report/settings actions are labeled.
- [ ] Six reports can be opened; dashboard sections, period selector and export behavior are represented with honest readiness states.
- [ ] Automated evidence, manual demo results, known limitations and relevant CBC sign-offs are recorded separately. No overall done claim until implementation + verification + demo + documentation + approval.

## Acceptance scenarios

These are full-demo tests, not a blanket statement that they passed. ADR-010 supplies the approved ownership rules; other domain rules remain pending. Resolve explicit definition gates before asserting calculated results. Automate unit/database/E2E checks where indicated; record manual review separately.

| Test | Requirement / coverage | Synthetic setup and action | Expected result / verification |
|---|---|---|---|
| AT-01 | REQ-001/002; existing CRUD | Create Demo Organization A, create Demo Contact A linked to it, edit each, search and reload details | Persisted values and association match; lists/details update; unrelated fixture unchanged. E2E + DB assertions |
| AT-02 | REQ-001/002; validation | Submit whitespace-only names, malformed email, invalid FK, invalid enum, invalid ID and invalid URL | Existing nonblank/email/FK/enum guards reject covered cases; implement missing URL/ID validation and clear UI errors before passing. Direct-action + DB negative tests |
| AT-03 | REQ-001/002/008; first slice | Assign a synthetic owner, choose strength/potential, save/reload; clear owner; attempt unknown owner | Values persist; Admin assigns active Staff, Staff may self-assign only at creation, Finance/Viewer cannot mutate ownership. Invalid/inactive/non-staff IDs rejected; staff reassign/clear/upsert/delete-reinsert attempts denied; directory reveals only authorized ID/display-name rows (ADR-010) |
| AT-04 | REQ-001/002; primary contact | Choose contact within organization, then try unrelated contact and delete/reassign chosen contact | Approved selection and delete policy enforced; never choose an arbitrary first contact. Composite-FK behavior is locally tested; hosted integration and CBC workflow approval remain pending |
| AT-05 | REQ-004; financial model | Approved example: synthetic commitment 1000, receipts 250 and 150; unrelated receipt in another period; separate in-kind entry | Finance-signed expected revenue/outstanding/current/lifetime values reconcile without double counting; test reversal, nulls, period boundaries and zero prior year. Blocked until ADR-007 and formulas approved |
| AT-06 | REQ-005; activity/task | Log activity with two contacts and owner; create open follow-up with fixed due date; complete action | Correct person/organization history, next action and status; completion removes action from open queue; tie/overdue/timezone boundaries use approved rules. DB/unit/E2E |
| AT-07 | REQ-014/003/008; interests | Link interest to organization, program, two discussions and an opportunity; add follow-up | Latest discussion and owner/linkage display correctly; no unrelated activity leaks; opportunity amount distinct from record link. Provisional ADR-013 latest/tie rules; CBC review required |
| AT-08 | REQ-010; programs | Enroll synthetic participant in two cohorts with separate awards/outcomes | No duplicated person counts without approved counting basis; cohort filters isolate outcomes; null graduation/employment stays unknown. Reconcile signed denominator/field-alignment examples |
| AT-09 | REQ-011; mentorship | Create pair, log ordered and tied check-ins plus survey feedback and issue | Latest check-in/count/score reflect approved ordering; health remains pending until rubric approval; then threshold and missing-feedback tests pass |
| AT-10 | REQ-009; membership | Create individual and corporate memberships; renew one, record synthetic payment and attendance | Holder integrity preserved; no duplicate engagement; renewal/retention/status/risk match signed examples. Test dates, payment reversal and missing engagement |
| AT-11 | REQ-012/008; documents | Use generated empty demo file/link with version, owner, uploader, access and related records | One metadata identity links to multiple records; versions are retained; unauthorized direct file/link access denied independently of UI. Definition/storage decision required |
| AT-12 | REQ-006; dashboard | Seed approved synthetic dataset across domains; change period; force a query failure | Every p.20 display represented; approved values reconcile to same source queries; pending definitions labeled; error not presented as zero; action window tested with frozen time |
| AT-13 | REQ-013; reports | Open all six p.19 categories with synthetic filters; request export if approved | Each named topic represented; same-period values agree with dashboard/source; pending definitions labeled; export respects role/filters and has approved format |
| AT-14 | REQ-008; permissions | Anonymous, viewer, staff, finance, admin attempt reads/writes, direct API actions and forged role/owner changes | Compare against signed role matrix; baseline SQL permits read for named roles and writes only admin/staff; denied mutations leave records unchanged; test profile escalation and cross-record access. No approval inferred from current policy |
| AT-15 | REQ-001–006/009–014; page/field coverage | Compare routes, controls and visible field labels to every matrix row, including p.1 and page-only metrics | All 12 destinations reachable; no inert Soon entries count as pages; derived fields read-only; all unresolved values labeled; Settings explicitly unspecified. Route smoke + UI coverage audit |
| AT-16 | Cross-cutting delivery | Recreate isolated DB from migrations, load repeatable synthetic fixtures; run lint/typecheck/build and workflow suite | Clean reproducible setup; versioned evidence and no private artifacts; missing credentials/dependencies reported as blocked, never passing |
| AT-17 | REQ-007 (outside board demo unless approved) | Import only a synthetic legacy-format file, repeat import and supply broken reference/duplicate | Approved import behavior and provenance demonstrated; no live HubSpot access or data; no import implementation exists today |

## Suggested board walkthrough

1. State prototype scope, synthetic-data policy and pending definitions.
2. Navigate all pages, then create/edit organization and linked contact and show ownership/assessment fields.
3. Walk a synthetic contribution and follow-up through approved workflows; show explicit pending fields where rules are unresolved.
4. Show interests, program outcomes, mentorship, membership and document relationships.
5. Open each report and the dashboard; reconcile one approved metric to source fixtures and demonstrate error/pending states.
6. Show denied operation, test evidence and outstanding approvals.

Record demo date, commit, environment, test IDs, actual results, limitations, reviewer and sign-off reference in progress. No CBC board demo or overall acceptance has been performed. ADR-010 ownership is explicitly approved; local automated evidence follows.

## Day 1 evidence — REQ-001/002/008

- [x] ADR-010 records the ownership policy and restricted directory.
- [x] 46 actual PostgreSQL assertions cover direct ownership/role/directory denial paths, manual-field CRUD, validation and primary-contact affiliation in disposable synthetic databases.
- [x] Baseline and incremental DDL apply in isolation; 29 draft tables have RLS and no client grants. Hosted project remains unchanged.
- [x] Five parser/validation tests pass.
- [x] Production build passed with synthetic public configuration; existing middleware warning remains.
- [x] Five browser CRUD/navigation/role/validation scenarios pass after required-label accessibility and test-selector corrections.
- [x] Final typecheck/lint/documentation consistency results recorded in progress.
- [ ] Real Supabase Auth/PostgREST deployment flow and manual CBC demonstration/sign-off.

Organizations/Contacts represent 33 detailed fields: 23 stored/linked displays and 10 explicitly pending calculated displays. Other 100 detailed fields and nine destinations remain Day 2 work. Browser tests use the real app/actions with a synthetic HTTP fixture; database tests independently execute real PostgreSQL RLS/triggers. This is not hosted end-to-end verification. See [progress](progress.md) and [frontend verification instructions](../../apps/frontend/README.md).

## Activities & Follow-Ups evidence — REQ-005/008

- [x] All 15 ACT fields represented in list/new/detail/edit and follow-up forms, with organization and multiple contact links.
- [x] Atomic activity/participant saves and multiple follow-up records implemented; no partial write on invalid participant input.
- [x] Completion/reopening, Calgary overdue boundaries, future exclusion from Last Contact, relationship histories and next-action ordering tested in PostgreSQL.
- [x] 97 database assertions pass (46 ownership/CRM + 51 Activities); ADR-010 organization ownership remains enforced unchanged.
- [x] Nine validation tests pass; typecheck/lint and production build passed.
- [x] All nine browser scenarios passed, including explicit directory count assertions, lifecycle and existing CRM regressions.
- [x] Local security advisor has no errors; timestamp search path fixed; inherited pgcrypto schema warning documented for rollout review.
- [ ] Hosted Auth/PostgREST rollout/E2E, CBC operational-convention review and manual board acceptance.

AT-06 now has local SQL and browser evidence for log/participants, multiple follow-ups, ownership/due dates, completion/reopening, overdue/Last Contact/next actions and dashboard queue. SQL fixtures include fixed-date, Calgary DST/midnight, atomic rollback, direct role denial and hidden/inactive owner scenarios. Browser tests use the real app against a synthetic HTTP fixture; SQL tests run on actual local PostgreSQL 18.6. Hosted Supabase remains untouched.

Current total: **48/133 detailed fields represented**, 43 locally implemented and five explicit pending displays. Eight remaining navigation destinations/85 detailed fields are deferred. Activities search, status filter, due-week/overdue/upcoming panels, related histories and error states are included. Automated demonstration is not CBC sign-off.

## Real local Supabase integration readiness

- [x] Four canonical migrations apply on a fresh real Supabase PostgreSQL 17 environment; order, dependencies, RLS, grants and migration versions audited.
- [x] Two migration/seed replays preserve history and named fixture counts; no manual schema edits/reset required.
- [x] Synthetic real Auth accounts plus organization/contact/activity/six follow-up scenarios prepared.
- [x] Twenty real Auth/PostgREST checks pass, including role/ownership/directory/escalation/anonymous/signup denial paths.
- [x] Three real-browser scenarios pass: admin authentication and full create/edit/relationship/action/calculated-field workflow; Finance/Viewer read-only controls.
- [x] 97 SQL assertions pass on fresh PostgreSQL 17; nine validation tests and three readiness guard tests pass.
- [x] Typecheck/lint/production build and existing nine fixture browser regressions pass.
- [x] Fresh Supabase pgcrypto namespace is extensions; local security advisors report zero findings. Existing hosted placement remains unverified.
- [x] Credential/generated artifacts ignored and private; no private key in frontend, console report or commit.
- [ ] Approval for a separate **cloud** demo project, migration target, secure configuration and deployment. No existing hosted modification authorized or performed.
- [ ] Cloud-specific API/browser verification and CBC acceptance.

Local integration is now verified rather than inferred from a mock API. Earlier hosted/local-auth deferrals are superseded only for this separate local stack; cloud deployment and CBC review remain pending. See [readiness and connection guide](hosted-integration-readiness.md). Next implementation: Sponsorship & Giving, followed by Sponsor Interests.

## Sponsorship & Giving acceptance — REQ-003/004/006/008

ADR-012 approves CAD, calendar-year cash reporting, separate partial receipts, separate in-kind and Admin/Finance writes with Staff/Viewer reads for the synthetic MVP.

- [x] AT-05a: fresh migration adds contributions, typed program/event references, cash receipts and document links with RLS; existing ownership tests remain unchanged.
- [x] AT-05b: real Auth/PostgREST verifies Admin/Finance writes, Staff/Viewer denial, anonymous denial, exact 0.10+0.20, receipt void correction, invalid amounts/dates/type/links and unchanged Finance ownership restrictions.
- [x] AT-05c: 37 new SQL assertions verify receipt-vs-pledge balances, zero baseline, YoY, donor filtering, overpayments/cancellation, in-kind isolation, no deletes, inactive denial and database validation. Total 134 assertions pass on fresh PostgreSQL 17.
- [x] AT-05d: six real-browser scenarios pass, including create/edit/contribution/partial receipt/void/document/history/dashboard flow and Staff/Viewer reader controls.
- [x] AT-16: final typecheck/lint, production builds, 13 validation tests, six real integration and nine fixture browser scenarios passed.
- [x] Two local migration and named seed replays preserve history and fixture counts. Five contributions, four receipt records (one void), two initiative references and one document link use synthetic data only.
- [ ] Manual CBC board walkthrough, financial policy acceptance for production and hosted rollout.

Current coverage is 64/133 detailed fields represented, 63 locally implemented and CON-12 Events Attended pending. All 16 GIV fields are represented; GIV-11 automatic scheduling is deferred in favor of explicit manual renewal dates, and GIV-16 is reference links only. Seven remaining destinations/69 fields remain outside completed scope. Sponsor Interests is next. Historical totals above describe earlier checkpoints.

## Sponsor Interests acceptance — REQ-014/003/005/008

2026-10-28: ADR-013 rules are provisional, implementation authorized by repository owner; CBC approval remains pending.

- [x] AT-07: all eleven INT fields, six directory columns, list/create/detail/edit, organization history, affiliated optional contact/opportunity, optional Program alignment, inherited restricted owner and explicit discussion/task links implemented.
- [x] AT-07: latest eligible discussion excludes future/unrelated records and uses a deterministic tie; next linked action skips completion and orders due/undated/tied tasks. SQL assertions and actual API/browser evidence recorded in progress.
- [x] AT-14: Admin/Staff saves, active-role reads, Admin archive/restore, Staff archive denial including direct insert/update paths, no hard deletion, inactive/anonymous denial and Finance/Viewer read-only behavior verified. Existing ownership/finance regressions pass.
- [x] AT-15 subset: all INT labels and six source directory columns; inline affiliation feedback preserves selections, optional-link/empty/search states, archive filter and mobile navigation verified in real Chromium. Whole-board AT-15 remains incomplete.
- [x] AT-16: 172 SQL assertions, 59 Interests + 20 CRM + 39 Giving real API checks, 16 validation tests, 11 real integration + nine fixture browser scenarios, typecheck/lint/production builds, two replays, three readiness guards and zero local advisor findings.
- [ ] Manual CBC walkthrough of provisional workflow and conventions, followed by named approval/sign-off.
- [ ] Production audit/currency/pipeline/Programs decisions and any separately approved hosted rollout.

Suggested manual walkthrough: use synthetic Staff to add/edit an interest with two linked discussions, a Program, an affiliated contact/opportunity and an existing follow-up; show inherited owner and organization history. Try an incompatible organization/contact association and confirm preserved selections/error. Use Admin to archive and restore, then Finance/Viewer to demonstrate read-only controls and restricted owner labels. Show the separate manual estimate, timestamp metadata, pending currency definition and deferred audit history. Record reviewer, date, commit/environment, actual results and approval reference; automated results alone do not check this manual gate.

Current field coverage: **75/133**, including all eleven INT fields. Six missing destinations/58 fields and overall CBC acceptance remain outstanding. No hosted changes or source PDF publication occurred.


## Programs and review acceptance evidence — 2026-11-01

REQ-010/002/006/008; provisional ADR-014, CBC approval pending. [Current evidence and coverage definitions](progress.md#current-field-audit) supersede earlier totals.

- [x] AT-08/14: repeated recipient identities across cohorts/programs, manual education/support/outcomes, exact sums/unknowns, alumni/contact evidence, negative affiliations, metadata and role denial verified by 45 new SQL assertions and 68 real local API checks.
- [x] AT-08/15: all fifteen PRO labels represented; thirteen complete demo fields, one partial engagement classification and one Field Alignment placeholder. Directory raw outcomes and pending scholarship/outcome rates verified in real Chromium.
- [x] AT-08: program switch clears incompatible cohort before submission; direct incompatible/unknown/malformed URL filters normalize; visible values, summaries and enrollments agree; valid cohort-only URL works.
- [x] AT-12 subset: all four basic CRM dashboard queries independently fail into unavailable UI; successful empty counts remain zero; recovery works; successful zero cash differs from failed financial RPC. Existing action-queue error coverage retained.
- [x] AT-16: 217 SQL assertions; 186 API checks; 19 validation tests; 17 real integration and 15 fixture browser scenarios; typecheck/lint/production builds; three readiness guards; two migration/seed replays; zero local advisor findings.
- [ ] AT-15 whole-board coverage: five destinations, 43 detailed fields and additional page-only/report/dashboard displays still absent; two field placeholders and one partial classification remain.
- [ ] Manual synthetic CBC walkthrough and named approval of provisional rules. Automated browser execution is not this manual gate.
- [ ] Any separately authorized hosted deployment and instructor/production approvals.

Suggested Programs walkthrough: use synthetic Staff to create/edit a program/cohort/recipient/enrollment; show repeated cohorts, unknown support and manual outcomes; switch program after selecting a cohort and show the cleared filter and matching summary; open an incompatible direct URL; show linked contact interactions and explicit person-wide alumni cash; demonstrate Finance/Viewer read-only behavior and the pending alignment/rate labels. Record reviewer/date/commit/environment/results/approval reference. Nothing here authorizes hosted changes or source-document publication.


## Reports foundation / Financial Performance — REQ-013/004/006/008

Current evidence is recorded in [progress](progress.md#reports-foundation). Detailed-field totals remain 90/133 represented; Reports output/navigation is outside that denominator.

- [x] AT-13 representation subset: all six named categories reachable from Reports and shared desktop/mobile navigation. Financial Performance and Sponsor Relationship have supported subsets; four categories show topics and Definition pending without invented values.
- [x] AT-05/12/13 subset: exact received cash versus active Cash pledged/outstanding, lifetime/prior/comparable-year summaries, in-kind separation, period ledger, source Giving links and organization scopes verified locally. Changing cash year preserves all-time current balances; void receipts are excluded.
- [x] AT-14: existing Admin/Finance/Staff/Viewer read access and financial write boundaries preserved; anonymous/inactive denial verified. No policy/grant/schema change or report editing control.
- [x] AT-16: SQL/API/validation/browser checks cover reconciliation, filters, real pagination, successful empty data, loading, invalid queries and forced failures/recovery. Exact final counts in progress; screenshots/traces remain disabled.
- [ ] AT-13 complete: four report categories still pending outputs; Sponsor pipeline/renewal metrics and Financial event ROI/export and broader executive dashboard remain deferred.
- [ ] Synthetic manual CBC walkthrough and named sign-off; automated browser evidence is not this manual gate.

Suggested walkthrough: select a synthetic organization with a prior-year pledge and receipts in two years; compare each selected-period receipt ledger to cash received and open a Giving detail. Change year and show that all-time pledged/outstanding values do not change; demonstrate void exclusion, in-kind separation and zero-baseline behavior. Select an empty organization and an empty receipt period; show explicit unavailable/loading states in the synthetic failure fixture. Open all five pending report categories and explain missing definitions. Demonstrate Staff/Viewer read access with existing Giving edit controls absent; record reviewer/date/commit/environment/results/approval reference.


Sponsor Relationship continuation checklist:

- [x] Select an organization explicitly; show manual agreement/renewal dates, linked interactions and opportunity reference links. Future renewal dates remain planning metadata, never cash or automatic scheduling.
- [x] All four active reader roles, source navigation links, empty groups, invalid organization and failed contribution/activity/opportunity queries with recovery are covered by local automated checks.
- [ ] Approve sponsor eligibility, pipeline/risk/renewal-rate rules and estimate currency before implementing those calculations. Manually demonstrate and obtain named CBC acceptance of the supported record subset.

## Remaining MVP completion — 2026-11-02

Earlier missing-module/coverage totals above are historical. Current audit: **133 represented / 125 complete demo fields / two partially functional / six pending definitions**. 127 fields have some functionality; six pending displays are excluded. DOC-06 records metadata registration only; binary upload is deferred. PRO-13 remains partial engagement classification. See the per-field CSV and provisional ADR-016/017/018.

- [x] Membership list/search/create/detail/edit, member identity/affiliation, term history, exact unknown-aware fee/manual payment, date status and upcoming renewals, inherited owner and source histories.
- [x] Mentorship list/create/detail/edit, shared-organization contacts, program/cohort integrity, check-in create/edit/history, count/latest/raw feedback, issues and action dates; health pending.
- [x] Documents list/search/create/detail/edit, explicit source references, server provenance, version/dates/classification; Internal/Admin-only RLS. Binary upload/download clearly deferred.
- [x] Settings current account/role/access information and sign-out; administrative features clearly unavailable.
- [x] All six report categories have queried source records, defined summaries/filters/empty/error states and CSV subsets under the signed-in user's permissions.
- [x] Dashboard operational summaries link to Membership, Mentorship, Interests, Programs and recent interactions alongside existing CRM/follow-up/finance sections. Failure states do not imply zero.
- [x] [Reproducible synthetic walkthrough](board-demo-walkthrough.md) and [separate hosted deployment plan](hosted-demo-deployment-plan.md) prepared. Exact executed checks/results are recorded separately in progress.
- [ ] Named human CBC board walkthrough and approval of provisional membership/mentorship/document access conventions, definitions and visible pending metrics.
- [ ] Instructor stack/deliverable acceptance, production privacy/security rules and any real-record authorization.
- [ ] Repository owner resolves tracked architecture PDF publication/history remediation before any publication; no history rewrite authorized.
- [ ] Explicit approval for separate hosted resources, deployment target/budget and subsequent hosted smoke/advisor checks. Existing project remains untouched.

Record reviewer, date, commit, environment, actual observed outcomes and approval reference for the unchecked gates. Automated browser execution is runtime/demo evidence, not human CBC acceptance.

Final local verification: 28 unit/validation tests; 279 SQL assertions; 335 real API checks; 38 real-Supabase browser scenarios; 33 fixture browser scenarios; three readiness guards; two migration/seed replays; typecheck/lint/production builds; zero local security advisor findings. All pass. Exact commands and scope are in progress. Fictional names and explicit synthetic notices are retained; no binary files, hosted changes or public push.
