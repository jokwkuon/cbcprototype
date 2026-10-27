# Board-demo progress and prioritized plan

Updated 2026-10-26 on `feature/mvp-foundation`. Organizations, Contacts, Activities & Follow-Ups and Sponsorship & Giving have local implementations. **The complete board demo is not ready:** 64/133 detailed fields are represented; seven remaining destinations and 69 detailed fields still need UI representation. Giving verification evidence is recorded at the end of this document. Source examples and live CBC records are not used.

## Implemented scope and evidence boundaries

[Register](../requirements/register.csv), [scope](../project/scope.md), [decisions](../project/decisions.md), [field matrix](../requirements/field-matrix.md), [data model](../architecture/data-model.md) and [acceptance scenarios](demo-checklist.md) remain the traceability sources. The user's three-day demo request authorizes continuing the existing stack and representing all pages/fields; it does not approve undefined formulas or settle instructor requirements. LATER operational modules still need CBC workflow approval. ADR-010 records the explicit ownership decision.

| Area | Current implementation | Remaining gap |
|---|---|---|
| Organizations — REQ-001 | Owner, strength, potential, primary-contact selection, estimate, location and existing manual fields in shared forms/actions/detail; source section links and pending history panels | Last Contact and next open action/date are calculated from linked activities/tasks; three giving/renewal fields remain Definition pending; single free-text type rather than approved multi-tag taxonomy |
| Contacts — REQ-002 | Names/title/email/phone/organization plus type, influence, interests, notes and inherited restricted owner display; directory type/influence/contact count | Last Contact/next open action work on detail; Events Attended/Giving History and directory Decision Makers/Recently Contacted/Last Contact remain explicitly pending |
| Ownership — REQ-008, ADR-010 | RLS gates actors; private trigger compares OLD/NEW and rejects inactive/non-staff owners and staff reassignment; ID immutable; delete/reinsert bypass denied to staff | Real local Auth/PostgREST verified; cloud-hosted deployment still pending; no browser role/active administration |
| Restricted directory | ID/display-name projection only, synchronized from active Staff; Admin sees active Staff, Staff sees self, Finance/Viewer see none | Historical owner labels remain generic for users without directory access; no broader profile access granted |
| Shared UI/actions | Reusable validated forms, fields, detail/pending displays, inline errors preserving values, role-aware create/edit controls, mobile navigation and disabled unavailable global search | Activities reuses these components, including dates and multi-select participants; remaining modules and global search are not implemented |
| Incremental schema | Three incremental migrations cover ownership/manual CRM fields and the new activities/participants/tasks, invoker RPCs/status view and timestamp-helper hardening | All four canonical migrations applied on a fresh real local Supabase PostgreSQL 17 stack; no hosted project changed |
| Remaining CRM entities | 29-table relational proposal in `database/proposals/`, under unexposed schema, RLS enabled, no client grants/policies | Review-only; not app migrations or working CRUD; future domain policies and definitions required |
| Giving / Opportunities — REQ-003/004 | Giving list/create/detail/edit, typed references, dated receipts, voids, donor histories and SQL financial summaries; approved synthetic rules ADR-012 | Full opportunities pipeline, automatic renewal, refunds/reconciliation/audit history and production finance approval deferred |
| Activities — REQ-005/008 | Listing/new/detail/edit; atomic participant links; multiple add/edit follow-ups; completion/reopen; computed overdue/Last Contact; related histories and dashboard queue | Real local integration passed; cloud deployment and CBC review of ADR-011 still pending; no email/calendar sync or recurrence |
| Interests — REQ-003 extension | Locked interest/link drafts | Page/workflow and dedicated requirement ID still missing |
| Programs / Mentorship / Membership — REQ-010/011/009 | Locked program/cohort/enrollment/pair/check-in/feedback/member drafts | Missing pages and workflows; pending outcome, health, retention/renewal/risk rules |
| Documents / Settings — REQ-012/008 | Locked document/link/version proposals; existing profile permissions retained | Missing pages; no Settings field guide, file storage decision or approved module access policy |
| Reports / Dashboard — REQ-013/006 | Existing basic organization/contact/status/recent-record dashboard remains | Six report pages/topics and p.20 domain panels/period/export missing; no invented KPI formulas |
| Import — REQ-007 | Existing synthetic sample/mapping templates | No importer; outside board demo unless separately approved |

## Database inspection and verification

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

ADR-007 is resolved for the synthetic MVP by ADR-012; production finance rules, outcome denominators, health/risk rubrics, report/export definitions and unspecified Settings fields remain open. Activities conventions are now explicit in ADR-011, implemented for the demo and pending CBC review. Keep those fields represented as Definition pending; do not manufacture approved rules to meet the deadline. Sponsor Interests/shared evidence still need dedicated requirement IDs. No microservices or production integrations are introduced.

## Git and publication status

The existing staged PDF removal is preserved. The local PDF is ignored; it is not added to any implementation commit. No source extraction, confidential records, credentials or service-role keys are committed. Existing Git history exposure is not remediated by staging removal; history cleanup remains a repository-owner decision before publication. No history rewrite or push is performed.

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

Implement the Sponsor Interests listing and record forms from physical pages 9–10, starting with the explicit field mappings and a dedicated requirement reference. Preserve financial and ownership permissions. No hosted rollout is authorized.

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
