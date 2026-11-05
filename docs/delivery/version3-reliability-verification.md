# Version 3 reliability verification

REQ-001/002/004/005/006/007/008/013. Branch: `feature/version3-reliability-operations`, baseline `fbce326`. Historical documents retain their original results. This file records this increment only.

## Executed baseline and incremental checks

- Fetch succeeded; local/remote starting branch both `fbce326`; tree initially clean.
- Baseline: 32 unit tests, typecheck and lint passed.
- SQL: `CBC_DEMO_INSTANCE=test node scripts/demo/verify-database.mjs`: **285 assertions passed**, PostgreSQL 17, fresh disposable database, checksums/history, RLS and extension schema. Sandbox connection refusal was resolved by authorized execution outside sandbox; no assertion was skipped.
- Cookie regression: two tests passed, including 25 separate concurrent request closures. This is not a real expired JWT test.
- Structural rehearsal: **792 public catalog objects match**, 12 historical checksums verified; unexpected column and changed grant detected. Two new disposable databases; hosted untouched.
- Synthetic browser baseline after Proxy fix: **37 passed**, production build included, 58.8 seconds.
- Runtime readiness: **3 passed**; ignored/private files and guarded endpoints checked.
- Incremental history cursor and report-size tests added. Final execution results below will supersede intermediate runs.

## Final verification ledger

| Check | Executed result | Evidence / limits |
|---|---|---|
| Frontend units | **36 passed** | `npm --prefix apps/frontend test`; includes cookie, cursor, oversized-read, exact-cent and contrast assertions |
| Import prototype | **3 passed** | `node scripts/import/preview.test.mjs`; quoted/newline CSV, error location, duplicate candidates, limits; zero DB writes |
| Schema comparator unit | **1 passed** | `node scripts/schema/compare.test.mjs`; normalization and drift classification |
| Runtime readiness | **3 passed** | `node scripts/demo/readiness.test.mjs`; canonical count now derived rather than hardcoded |
| SQL/RLS | **285 assertions passed** | Fresh PostgreSQL 17 with all 15 canonical migrations; role, ownership, financial and FK tests |
| Auth/PostgREST | **335 passed** | Core 20; Giving 39; Interests 59; Programs 68; Membership 32; Mentorship 25; Documents 22; Reports 70 |
| Full real browser | **55/55 passed** | `CBC_DEMO_INSTANCE=test npm --prefix apps/frontend run test:integration`; saved privately as `reliability-full-browser-verification.json` |
| Final targeted real browser | **3/3 passed** | Session/pagination/visual recheck after the last refreshed-props guard; latest `browser-verification.json` |
| Final synthetic browser | **37/37 passed**, 51.1 seconds | `npm --prefix apps/frontend run test:e2e`; final CSS/form/search/history build, query failure/empty/access/mobile scenarios |
| Lint / typecheck | **Passed** | `npm --prefix apps/frontend run lint` and `run typecheck` |
| Production build | **Passed** | Both Playwright suites build production Next.js; no middleware deprecation remains |
| Fresh/reconciled schemas | **805 normalized objects match**, 12 historical checksums verified | Includes public objects, private helper functions/schema privileges and pgcrypto placement/version. Actual added-column/grant negative controls pass |
| Synthetic restore | **25 tables, 23 complete rows, 805 catalog objects match**; partial/void exact-cent balances and inactive-profile denial pass | New source/target databases, complete rows/catalogs compared; no production backup claim |
| Local security advisor | **No issues found** | `CBC_DEMO_INSTANCE=test node scripts/demo/stack.mjs audit`, private `audit.log` |
| Hosted read-only check | **24 tables, 10 views, 14 migration entries; 1 organization, 1 contact** | Exact target `cbcprototype` / `sywfyjaqzziyqhgulvjp`; no row contents retrieved or hosted writes |
| Hosted structural comparison | **775 objects on native local and hosted; 48 reported differences** | 47 ACL/default-ACL differences, one expected locally optimized policy difference. No missing/unexpected objects, function-body/column/constraint/index/trigger/view differences. Details below |
| Hosted security advisor | One warning: leaked-password protection disabled | No setting/identity modification |
| Screenshots | **34**, desktop 1440×1000 + mobile 390×844; **0 runtime/console errors, 0 body overflow** | Private `reliability-screenshots/manifest.json`; dashboard, relationships/full contact, activities, giving, programs, membership, mentorship, documents, settings, form and six reports. Dashboard desktop and organization mobile visually inspected |
| Remote CI | Not yet observed | Workflow extended with real isolated Auth/API/browser checks, schema drift and synthetic restore; local success is not a GitHub Actions result |

Walkthrough passed: sign-in → dashboard → Organization → Contact → interaction → assigned follow-up → team queue → completion → history. Finance contribution/edit/receipt/void/report/filter/export and denied-role scenarios passed in the same full suite. Sign-out/anonymous redirect and real refresh rotation passed in the new regression. Expiry is forced through cookie session metadata with a genuine refresh token; this does not prove server-expired JWT or simultaneous expired-tab renewal behavior.

Failures were investigated, not bypassed: client feed imported server-only formatting (split presentation import fixed); fixture SQL initially omitted active Admin claim (preserved existing trigger requirement); restore selection omitted extension/private objects (full disposable dump now used); CSV final unterminated-line boundary missed 10,001st row (parser fixed); existing browser tests selected duplicate names (new-record UUID targeting fixed). No old record deletion, test assertion removal or RLS weakening was used.

## Performance before and after

`CBC_DEMO_INSTANCE=test node scripts/demo/benchmark-reliability.mjs`; outputs `reliability-performance.json` (prior reader predicate) and `reliability-performance-optimized.json` (local optimization). Seven warm authenticated samples per measurement, nearest-rank p95 = maximum of seven. Node 24.22.1, native local Supabase/PostgREST + PostgreSQL 17.11; generated organization/contact/activity/task IDs cleaned in `finally` and absence verified.

| Linked activities | Original complete-read median / p95 ms | Bounded read before RLS optimization median / p95 ms | Final bounded median / p95 ms | Requests / payload original → final |
|---|---|---|---|---|
| 100 | 30.36 / 57.55 | 20.01 / 29.96 | 5.46 / 17.17 | 1 / 40,801 B → 1 / 10,557 B |
| 1,000 | 288.38 / 300.25 | 133.53 / 142.32 | 4.37 / 6.31 | 2 / 408,001 B → 1 / 10,609 B |
| 10,000 | 19,613.68 / 25,352.12 | 638.97 / 646.57 | 3.88 / 7.10 | 20 / 4,080,001 B → 1 / 10,609 B |

Final 10k contact-page median/p95: **72.90/78.31 ms** (previous bounded **2691.05/2768.94**). Task-page median/p95: **62.55/64.58 ms** (previous **2643.77/2665.84**). Twenty-six rows transferred includes one sentinel; UI displays 25. The 100-row optimized fixture had slightly shorter timestamp serialization/payload, so byte deltas there are descriptive, not an exact same-byte experiment. After RLS optimization, even the complete 10k read improved to **224.06/234.56 ms**, but still transfers all 10k rows in 20 requests. Report/search/export/full navigation timing matrix was not completed. These data-request measurements exclude authentication/profile/render/network/production concurrency and are not SLAs.

Authenticated `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` confirms a statement-scoped role InitPlan; private `reliability-reader-plan.json`. No measured basis for new search indexes was established, so search indexing and policy semantics remain unchanged.

## Hosted structural differences

Existing browser-role object ACLs match native local; **44 current object ACL differences** are service-role privileges. **Three default ACL differences** grant future public tables/sequences/functions more access on hosted than native local. The remaining policy difference is the local-only activity-reader optimization. Function bodies and structural definitions match. Default grants should be hardened in a separately reviewed operator change with recovery, keeping explicit migration grants/RLS mandatory. No current unauthorized data access is inferred from a default-ACL difference. Raw private catalogs are mode 600 under `/tmp` and `.local`; no automatic drift remediation is performed. Fresh disposable bootstrap has pgcrypto in public (805 objects), whereas native/hosted install it in extensions (775); extension placement is reported, not silently normalized away.

## Evidence locations and isolation

Private `.local/cbc-test/database-verification.json`, `database-assertions.json`, `browser-verification.json`; generated runtime files never staged. Presentation instance port 55421 is not used for tests/benchmarks. API 56421 is test-only. SQL fixtures are fictional; scale fixture owns generated IDs and cleans them in `finally`.

## Remaining verification

Server-expired JWT, concurrent refresh at expiration across browser tabs, true failure recovery during rotation, full 100/1,000/10,000 UI/report/search/export benchmark matrix, all-module screenshots and manual assistive-technology acceptance remain separate checks unless explicitly recorded below. No local timing is a production SLA.

## Release status and remaining work

This is a substantial reliability increment, **not completion of every requested sprint or production readiness**. Safe engineering still unfinished: remote searchable selectors and bounded form option loaders (high impact/medium cost); SQL-side report/dashboard aggregation and paged report detail tables (high/large); full test fixture teardown for legacy browser tests (medium/medium); finer mutation invalidation and broader query diagnostics (medium/medium); full CSS architecture/remaining `!important` cleanup (medium/medium); full search/report/export/navigation benchmarks and true expired/concurrent-refresh tests (medium/medium). Existing demo remains isolated; legacy tests retain their records only in test, with exact-record selectors allowing reruns. No presentation reset/reseed was performed.

CBC decisions: Leadership—production scope, staging acceptance and data retention; Finance—production accounting/refunds/reconciliation and audited export policy; Programs—student/reviewer/safeguarding access, consent, cross-organization mentorship and award/eligibility rules; Administrators—Auth password protection, default grants, audit readers/retention, document storage/scanning and named operational owners. Instructor stack/student deliverables and restricted-PDF publication/history decisions remain open. Governance acceptance specifications are documented; unapproved policy migration tests are not falsely reported as executed security tests.

No hosted mutation, Auth identity change, real import, release, merge or deployment. Only local test migration `20261105024046_relationship_reader_initplan.sql` was applied. Durable hosted recovery and CBC acceptance remain release blockers. Historical hosted evidence is retained separately.

## Implemented changes by commit

| Commit | Change / primary files | Verification |
|---|---|---|
| `444e2b8` | `proxy.ts`, `session-response.ts`, `crm-context.ts`, user-facing save error | Cookie reproducer/regressions, real refresh/logout, unit/type/lint/build/browser |
| `b4e132b` | Relationship DB joins, keyset/load-more feed/API/full pages, activity-reader migration, benchmark | 110 tied/null-boundary records, 100/1k/10k measurements, 285 SQL + 335 API checks |
| `7265175` | Schema comparator/rehearsal, isolated CI, streaming/export limit, diagnostics/health, no-write CSV preview | 805 catalog objects, structural/ACL negative tests, 36 frontend + 4 tool units, real export/health/browser |
| `4512a74` | CSS consolidation, field error associations, cancelled search guard, server-refreshed history state, exact-record browser assertions and screenshot test | 55 full real scenarios; final 3 targeted, 37 synthetic, type/lint/contrast |
| `73db54b` | Strengthened full synthetic restore and linked/financial fixture | 25 tables/23 rows/805 objects; exact partial+void balances and inactive denial |

Documentation commit follows these implementation commits; no release tag or CBC approval is created.
