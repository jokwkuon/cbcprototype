# Board-demo checklist and acceptance tests

Status: Day 1 and Activities local automated verification; see executed evidence below, 2026-10-26. Planned scenarios below are the full-demo target; executed subsets are recorded in the Day 1 evidence section. Extends [acceptance](acceptance.md) without claiming its gates passed. Field-level coverage is in the [matrix](../requirements/field-matrix.md); implementation order and evidence are in [progress](progress.md). Use synthetic people, organizations, transactions and files only.

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
| AT-07 | REQ-003 extension; interests | Link interest to organization, program, two discussions and an opportunity; add follow-up | Latest discussion and owner/linkage display correctly; no unrelated activity leaks; opportunity amount distinct from record link. Approved latest/tie rules required |
| AT-08 | REQ-010; programs | Enroll synthetic participant in two cohorts with separate awards/outcomes | No duplicated person counts without approved counting basis; cohort filters isolate outcomes; null graduation/employment stays unknown. Reconcile signed denominator/field-alignment examples |
| AT-09 | REQ-011; mentorship | Create pair, log ordered and tied check-ins plus survey feedback and issue | Latest check-in/count/score reflect approved ordering; health remains pending until rubric approval; then threshold and missing-feedback tests pass |
| AT-10 | REQ-009; membership | Create individual and corporate memberships; renew one, record synthetic payment and attendance | Holder integrity preserved; no duplicate engagement; renewal/retention/status/risk match signed examples. Test dates, payment reversal and missing engagement |
| AT-11 | REQ-012/008; documents | Use generated empty demo file/link with version, owner, uploader, access and related records | One metadata identity links to multiple records; versions are retained; unauthorized direct file/link access denied independently of UI. Definition/storage decision required |
| AT-12 | REQ-006; dashboard | Seed approved synthetic dataset across domains; change period; force a query failure | Every p.20 display represented; approved values reconcile to same source queries; pending definitions labeled; error not presented as zero; action window tested with frozen time |
| AT-13 | REQ-013; reports | Open all six p.19 categories with synthetic filters; request export if approved | Each named topic represented; same-period values agree with dashboard/source; pending definitions labeled; export respects role/filters and has approved format |
| AT-14 | REQ-008; permissions | Anonymous, viewer, staff, finance, admin attempt reads/writes, direct API actions and forged role/owner changes | Compare against signed role matrix; baseline SQL permits read for named roles and writes only admin/staff; denied mutations leave records unchanged; test profile escalation and cross-record access. No approval inferred from current policy |
| AT-15 | REQ-001–006/009–013; page/field coverage | Compare routes, controls and visible field labels to every matrix row, including p.1 and page-only metrics | All 12 destinations reachable; no inert Soon entries count as pages; derived fields read-only; all unresolved values labeled; Settings explicitly unspecified. Route smoke + UI coverage audit |
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
