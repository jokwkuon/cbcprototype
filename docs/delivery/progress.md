# Board-demo progress and prioritized plan

Updated 2026-10-26 on `feature/mvp-foundation`. Day 1 implementation covers Organizations, Contacts, reusable forms and database ownership enforcement. **The complete board demo is not ready:** 33/133 detailed fields are represented; nine remaining destinations and 100 detailed fields still need UI representation. Source examples and live CBC records are not used.

## Implemented scope and evidence boundaries

[Register](../requirements/register.csv), [scope](../project/scope.md), [decisions](../project/decisions.md), [field matrix](../requirements/field-matrix.md), [data model](../architecture/data-model.md) and [acceptance scenarios](demo-checklist.md) remain the traceability sources. The user's three-day demo request authorizes continuing the existing stack and representing all pages/fields; it does not approve undefined formulas or settle instructor requirements. LATER operational modules still need CBC workflow approval. ADR-010 records the explicit ownership decision.

| Area | Current implementation | Remaining gap |
|---|---|---|
| Organizations — REQ-001 | Owner, strength, potential, primary-contact selection, estimate, location and existing manual fields in shared forms/actions/detail; source section links and pending history panels | Six calculated fields are labeled Definition pending; no giving/activity/action/renewal calculation; single free-text type rather than approved multi-tag taxonomy |
| Contacts — REQ-002 | Names/title/email/phone/organization plus type, influence, interests, notes and inherited restricted owner display; directory type/influence/contact count | Four derived fields and directory Decision Makers/Recently Contacted/Last Contact remain explicitly pending |
| Ownership — REQ-008, ADR-010 | RLS gates actors; private trigger compares OLD/NEW and rejects inactive/non-staff owners and staff reassignment; ID immutable; delete/reinsert bypass denied to staff | Hosted deployment and full hosted Auth/PostgREST verification pending; no browser role/active administration |
| Restricted directory | ID/display-name projection only, synchronized from active Staff; Admin sees active Staff, Staff sees self, Finance/Viewer see none | Historical owner labels remain generic for users without directory access; no broader profile access granted |
| Shared UI/actions | Reusable validated forms, fields, detail/pending displays, inline errors preserving values, role-aware create/edit controls, mobile navigation and disabled unavailable global search | Remaining modules are not wired to these components yet; no global search implementation |
| Incremental schema | Two migrations add owner enforcement/directory/active status and organization/contact manual fields with FK/validation constraints | Prepared/tested locally; not applied to hosted project |
| Remaining CRM entities | 29-table relational proposal in `database/proposals/`, under unexposed schema, RLS enabled, no client grants/policies | Review-only; not app migrations or working CRUD; future domain policies and definitions required |
| Giving / Opportunities — REQ-003/004 | Locked relational draft only | All screens/workflows/calculations missing; Finance model, currency, in-kind and period rules remain open |
| Activities / Interests — REQ-005 and REQ-003 extension | Locked activity/contact/task/interest link drafts | Missing pages and task workflows; interest requirement ID and action date/selection rules need definition |
| Programs / Mentorship / Membership — REQ-010/011/009 | Locked program/cohort/enrollment/pair/check-in/feedback/member drafts | Missing pages and workflows; pending outcome, health, retention/renewal/risk rules |
| Documents / Settings — REQ-012/008 | Locked document/link/version proposals; existing profile permissions retained | Missing pages; no Settings field guide, file storage decision or approved module access policy |
| Reports / Dashboard — REQ-013/006 | Existing basic organization/contact/status/recent-record dashboard remains | Six report pages/topics and p.20 domain panels/period/export missing; no invented KPI formulas |
| Import — REQ-007 | Existing synthetic sample/mapping templates | No importer; outside board demo unless separately approved |

## Database inspection and verification

Before changes, hosted metadata was inspected read-only: public profiles/organizations/contacts columns and RLS policies matched the baseline migration; migration history was empty. No hosted business records were queried and no remote changes were made. The empty history must be reconciled by the operator before deployment; do not replay initial DDL or reset existing data.

The SQL suite creates a fresh disposable PostgreSQL 17 database per run, installs a minimal `auth.users`/`auth.uid()` contract and applies baseline, both increments and locked proposals. Synthetic users cover Admin, two Staff, Finance, Viewer and inactive Staff. Tests run with database roles and JWT-subject context, rather than merely checking SQL text. This verifies PostgreSQL constraints/triggers/RLS; it does not verify hosted Supabase Auth/PostgREST or production grants outside these migration files.

The browser suite builds the real Next app with loopback-only synthetic configuration, starts a test-only in-memory Supabase HTTP fixture and drives Chromium. It checks actual forms, server actions, redirects and rendering; PostgreSQL assertions independently verify database enforcement. No browser fixture is imported by application code. No screenshots or traces are captured.

| Check | Actual result / scope |
|---|---|
| `npm run test` | PASS: 5 parser/validation tests (trim, URLs, email, IDs, enum errors, finite amount, omitted vs explicit owner) |
| `npm run typecheck` | PASS after final UI/test edits |
| `npm run lint` | PASS after final UI/test edits |
| Production `npm run build` with synthetic public URL/key | PASS. Initial sandbox attempt failed on Turbopack worker port; authorized rerun succeeded. Existing middleware deprecation warning remains |
| `bash database/tests/run.sh` | PASS: 46 SQL assertions; baseline + two increments + 29-table draft applied to disposable PostgreSQL only |
| `npm run test:e2e` | PASS: 5/5 Chromium scenarios against the real production app and synthetic HTTP fixture, including full linked CRUD, inline validation, ownership controls, read-only roles, anonymous redirect and mobile navigation. The run rebuilt the latest app successfully |
| Documentation/field coverage and `git diff --check` | PASS: 133 unique detailed field IDs, matrix column structure, local documentation links and formatting checked |
| Hosted deployment / end-to-end Auth/PostgREST | NOT performed; existing baseline/history needs operator reconciliation |
| CBC demo/acceptance | NOT performed; relevant approval remains pending except explicitly accepted ADR-010 |

Chromium runtime was unavailable initially. A pinned current Playwright version, downloaded browser and user-local libraries under `/tmp` enabled testing without system sudo access. `/tmp` was cleared on session interruption and restored; these tools are not repository artifacts. Environment-specific commands and all test limitations are documented in [frontend setup](../../apps/frontend/README.md) and [database setup](../../database/README.md).

## Three-day delivery order

| Priority / day | Reviewable slice | Acceptance |
|---|---|---|
| Day 1 | Database ownership decision/enforcement, additive CRM fields, shared forms and synthetic verification | AT-01/02/03/04/14 locally; final results above. Full done still needs hosted integration, demo and relevant approval |
| Day 2 first | Represent all nine remaining navigation destinations, all remaining 100 detailed fields, six report categories and p.20 dashboard panels using shared fields and clearly labeled pending calculations | AT-15 coverage against all 133 IDs and page-only displays; do not count inert Soon labels as pages |
| Day 2 next | Enable approved synthetic activity/task and giving workflows in small slices; promote only reviewed entity drafts to migrations | AT-05/06/07; Finance and task rules gate calculations, not honest field representation |
| Day 3 | Reconcile migration baseline in an approved synthetic deployment, run real Auth/PostgREST allow/deny flows, rehearse every page/report and reconcile approved metrics | AT-08–16 where implemented; mark pending behavior plainly; no live CBC data |
| Final gate | Documentation, reproducible setup, test evidence, board walkthrough and named CBC sign-offs | Definition of done = implementation + automated verification + demo + documentation + relevant CBC approval |

ADR-007 finance model, outcome denominators, health/risk rubrics, report/export definitions and unspecified Settings fields remain open. Keep those fields represented as Definition pending; do not manufacture approved rules to meet the deadline. Sponsor Interests/shared evidence still need dedicated requirement IDs. No microservices or production integrations are introduced.

## Git and publication status

The existing staged PDF removal is preserved. The local PDF is ignored; it is not added to any implementation commit. No source extraction, confidential records, credentials or service-role keys are committed. Existing Git history exposure is not remediated by staging removal; history cleanup remains a repository-owner decision before publication. No history rewrite or push is performed.

Reviewable commits:

- `b3a9360` — database ownership, manual fields, locked drafts, synthetic SQL suite and ADR-010 (REQ-001/002/008).
- `2071fa9` — shared Organization/Contact forms, owner UI, manual/linked/pending fields, synthetic browser/unit tests and setup instructions (REQ-001/002/008).
- Delivery documentation is committed separately after verification. Initial planning documents are retained and updated; AGENTS.md instructions are preserved.

## Next smallest task

After finishing Day 1 evidence, add the Activities & Follow-Ups destination using shared field definitions: represent all 15 ACT fields, read-only pending status/Last Contact, and the directory/open-action labels. Add route/field coverage tests before promoting its locked tables or implementing deadline calculations. This starts Day 2's complete page/field representation without inventing workflow rules.
