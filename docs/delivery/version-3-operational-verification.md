# Version 3 operational foundation — local engineering evidence

2026-11-04. Branch `feature/version3-operational-upgrade`, based on `version3`. REQ-001/002/005/008; other modules verified for regression only. [Audit/workflow scope](../design/version-3-operational-upgrade.md), [gated migration specifications](../design/version-3-operational-migrations.md), ADR-019. This phase is a foundation increment, not completion of every proposed operational workflow.

## Files and behavior

- `lib/crm-context.ts`, `components/shell.tsx`: one memoized authenticated client/user/active-profile context per React render. No persistent user cache; middleware stays a separate boundary. No RLS or profile writer expansion.
- `lib/relationship-directory.ts`, relationship page/directory components: search/filter/group/sort/count and ten-row pagination executed in SQL; direct selection finds its results page via bounded selected-row read and rank count. Explicit page wins. Canonical detail/edit paths, contextual creation and quick edits preserved. Invalid/out-of-range pages clamp safely.
- `app/api/search/route.ts`, `lib/search-query.ts`: four ordered scoped requests, at most six matches per accessible module; literal query normalization, multi-word contact search, no service key, fail-all error state and private/no-store responses.
- `components/action-queue.tsx`, dashboard: assigned work first, Team/Unassigned views, deadline/undated open filters in SQL, exact count, page navigation and existing edit forms. No ownership changes or inferred alert/eligibility rules. Completed actions stay excluded.
- Dependency manifests pin the lockfile's already resolved versions; no package upgrades. Shared CSS left intact after review; broader style cleanup remains open.
- `.github/workflows/verification.yml`: frontend unit/static/production mock-browser job and disposable PostgreSQL SQL/RLS job; read-only repository token and no hosted secrets. Workflow execution in GitHub remains unobserved until pushed; this task does not push/merge/deploy.
- SQL/browser/readiness verifiers and synthetic HTTP contract fixture updated; reproducible local benchmark and screenshot capture helpers added. No real contact/student/financial fixtures.

## Local database

Applied locally only: `20261104214044_operational_directory.sql`, creating `organization_directory` and `contact_directory` with `security_invoker=true`. SELECT only to authenticated; anonymous and write grants revoked. Underlying active-role RLS governs every row and organization join. No base schema lifecycle, permissions, affiliation, eligibility or finance formula changed. Eleven canonical migrations; prior ten checksums preserved. Rollback requires matching prior frontend plus removal of the two views.

## Executed checks

| Layer | Result | Meaning / limits |
|---|---|---|
| Unit/validation | 30 passed | Existing parsers, exact money/date/report completeness checks |
| SQL/RLS | 285 passed | Fresh PostgreSQL 17 database, existing integrity/roles plus six new invoker/read-only/access assertions; canonical checksum/history and local RLS posture |
| Real Auth/API | 20 passed | Existing ownership, profile, inactive/anonymous and CRM access controls |
| Real financial API | 39 passed | Exact pledge/cash reconciliation, partial/void/correction, typed links, denied writers and unchanged ownership |
| Readiness | 3 passed | Local endpoint guard, eleven migration copies, ignored/private runtime secrets |
| Local security advisors | Zero findings | Isolated local target only; hosted findings remain |
| Real browser regression | 51 passed + 1 targeted edge/capture test passed | Full regression run followed by an added full-name-search/out-of-range-pagination/screenshot scenario; private full-run evidence preserved separately |
| Fixture browser | 37 cases verified | Complete 37-case run passed before adding auth counters; final regression run passed 36 and exposed an overstrict auth-count expectation; corrected new test then passed in isolation. One profile read verified per document render; middleware/SDK auth checks remain separate |
| Typecheck/lint/build | Passed | Final typecheck/lint rerun passed; both final targeted browser checks completed fresh production builds |
| Visual evidence | 6 screenshots, zero runtime/console errors or overflow | Desktop 1440×1000 and mobile 390×844; Dashboard, Organizations and Contacts. Dashboard desktop and Contacts mobile also visually inspected; no manual CBC acceptance implied |

Initial runs caught a changed team-queue test expectation and a direct-selection paging regression; both were corrected before the successful real-browser regression. Sandbox-denied local socket/process checks were rerun outside the sandbox, without changing environment guards. No failed run is counted as success.

## Measured performance

Reproduce: `node scripts/demo/benchmark-operational.mjs`. Isolated real local Auth/PostgREST, 2,500 additional fictional organizations; seven runs per path; generated fixture IDs cleaned up in `finally`. At measurement time the database also contained 164 prior fictional organizations. Values cover organization data requests only, excluding authentication, profile, history, render and browser navigation. Baseline reproduces the prior complete-read query shape in the same running environment. Payload bytes measure serialized selected record JSON, not compressed wire bytes. P95 is nearest lower sampled percentile; seven samples are directional evidence, not a load test.

| Path | Queries before → after | Rows transferred | JSON bytes | Median ms | Sample p95 ms |
|---|---|---|---|---|---|
| Organization directory | 6 → 1 | 2664 → 10 | 623823 → 2475 | 294.83 → 66.94 | 299.50 → 67.02 |
| Global search organization portion | 6 → 1 | 2664 → 6 | 344188 → 775 | 289.95 → 32.90 | 290.09 → 33.55 |

Raw private result: `.local/cbc-demo/operational-performance.json`. Direct selected links add a selected-row lookup and rank count; contact affiliation picker still fetches minimal organization ID/name options. No claim that total page queries equal one. Substring search and exact counts still scan data at larger scales; trigram/full-text/index plans and contact/history scale benchmarks remain future work.

## Private visual artifacts and reproduction

Artifacts stay ignored under `.local/cbc-demo/operational-upgrade/`, directory mode 700, files mode 600. [Desktop dashboard](../../.local/cbc-demo/operational-upgrade/dashboard-desktop.png), [mobile dashboard](../../.local/cbc-demo/operational-upgrade/dashboard-mobile.png), [desktop organizations](../../.local/cbc-demo/operational-upgrade/organizations-desktop.png), [mobile organizations](../../.local/cbc-demo/operational-upgrade/organizations-mobile.png), [desktop contacts](../../.local/cbc-demo/operational-upgrade/contacts-desktop.png), [mobile contacts](../../.local/cbc-demo/operational-upgrade/contacts-mobile.png). Private `manifest.json` records viewport/path/overflow/errors. The 51-case full real regression report is `.local/cbc-demo/operational-regression-51.json`; `browser-verification.json` records the final targeted capture run. Historical Version 3 before/after artifacts predate this operational increment and are not presented as new captures.

Reproduce from the repository root, using the documented local-only stack and browser runtime setup:

```sh
npm --prefix apps/frontend ci
node scripts/demo/prepare.mjs
node scripts/demo/stack.mjs start
node scripts/demo/stack.mjs migrate
node scripts/demo/seed.mjs
node scripts/demo/verify-database.mjs
node scripts/demo/verify-api.mjs
node scripts/demo/verify-giving.mjs
node scripts/demo/readiness.test.mjs
node scripts/demo/stack.mjs audit
npm --prefix apps/frontend test
npm --prefix apps/frontend run lint
npm --prefix apps/frontend run typecheck
npm --prefix apps/frontend run test:e2e
npm --prefix apps/frontend run test:integration
node scripts/demo/benchmark-operational.mjs
```

Run browser suites sequentially because they share build output. The integration operational scenario writes the six screenshots; alternatively start `node scripts/demo/run.mjs` and run `node scripts/demo/capture-operational.mjs`. Neither helper accepts a hosted target. Generated data/API accounts stay private; do not paste credentials into commands, chat or Git.

## Hosted/security/approval status

Read-only hosted inspection confirmed public contacts/organizations/profiles only, no recorded migration history, and unresolved advisors documented in the audit. Hosted Supabase was neither modified nor reconciled. No production permission changes, merge, push or deployment occurred. No real records were fetched for fixtures or screenshots.

Remaining engineering work: bounded history and async selectors; saved-view management; module-specific review/ledger/roster layouts; CSS/accessibility audit beyond covered routes; multi-cookie auth refresh regression; dependency vulnerability scan and reviewed upgrades. Remaining CBC decisions: cross-org mentorship, student/eligibility access, review and awards, membership responsibility/entitlement, internal event rules, imports/duplicates/audit, financial extensions, retention and hosted rollout. Instructor and human CBC acceptance remain pending. Local success does not mean production-ready.
