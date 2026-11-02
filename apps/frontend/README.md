# CBC CRM frontend

**Current verification: 2026-11-01.** The historical setup/checkpoint sections below retain earlier counts and limitations; use the guarded real local Supabase setup and [current delivery evidence](../../docs/delivery/progress.md#current-field-audit) for current commands/results. Seven canonical migrations and Programs & Recipients are verified locally. Do not treat the original baseline-only setup as a migration plan for an existing hosted project.

## Local setup

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and anon key.
2. Apply `../../database/migrations/202610130001_initial_crm.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Create approved synthetic users in Supabase Auth. The signup trigger creates a viewer profile; an administrator must assign `admin` or `staff` in the database using a trusted SQL session.
4. Run `npm install`, then `npm run dev`.

The browser only receives the Supabase anon key. Never add a service-role key to `.env.local`, client code, or this repository.

## Verification

`npm run typecheck` and `npm run lint` are the local static checks. `npm run build` requires a compatible TypeScript/Next dependency install; use the lockfile and a network-enabled environment when dependency resolution is available.

## Next.js security maintenance

Next.js is pinned to 16.4.3 (upgraded from 16.4.0), with the npm lockfile updated
and `experimental.agentUpgrade` set to `"security"`. Existing Server Actions
origin configuration is preserved. This maintenance supports REQ-008 (Access);
it does not establish approval of the proposed access rules.

Verified with npm install, `npm exec -- next --version`, `npm run lint`,
`npm run typecheck`, `NODE_ENV=production npm run build`, and `npm audit`
(zero vulnerabilities). Use a standard `NODE_ENV`: the inherited nonstandard
value caused a prerender failure that disappeared with `production`.
The existing middleware deprecation warning remains.

Demo verification: start the production build on localhost with synthetic
configuration, open `/login` and confirm the sign-in form renders; unauthenticated
requests to `/`, `/dashboard`, `/contacts`, and `/organizations` redirect to
`/login`. These checks passed without live records or credentials. Authenticated
workflows and relevant CBC approval remain pending.

## Day 1 CRM foundation (REQ-001/002/008)

Apply the two incremental Day 1 migrations **after** the baseline in an isolated synthetic Supabase environment. See [database setup and test limitations](../../database/README.md). The connected hosted project has the baseline tables but no migration history; it was inspected read-only and has not been upgraded by this task. Reconcile history with the operator before deployment; never replay/reset the initial migration against existing tables.

Admins assign active Staff; Staff may self-assign at creation and cannot reassign later. The database enforces this through RLS/private validation, including direct API requests. Owner options contain only staff ID/display name. Readers who cannot see a directory entry get “Assigned staff member (directory restricted or inactive)” rather than unrelated profile details. A trusted operator sets roles/active state; no profile administration or service-role key is added to the frontend.

Shared `CrmForm`, `FormField`, detail/pending components and server parsers support the organization/contact screens. Manual fields save to columns; linked primary contact is selected explicitly after adding a contact. Derived financial/activity/history fields remain labeled “Definition pending”. A blank estimated opportunity remains unknown, not zero; no currency or KPI interpretation is implied. Organization Type/Contact Type remain free text until categories are approved.

### Repeatable verification

From `apps/frontend`:

```sh
npm run test
npm run typecheck
npm run lint
NODE_ENV=production NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329 NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-public-key npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite rebuilds the production app with a loopback synthetic API, starts both services itself, and uses generated in-memory records. It checks form validation, create/read/update, organization/contact links, owner controls, read-only roles, anonymous redirects and mobile navigation. It does **not** verify hosted Supabase authentication, deployment, or real PostgREST. Actual trigger/RLS tests run separately in PostgreSQL through `bash database/tests/run.sh` from the repo root. No real CBC identity or credentials are used.

Chromium needs system runtime libraries. This workstation lacked `libnspr4`, `libnss3` and `libasound2`; system installation required an unavailable sudo password. Packages were downloaded/extracted to `/tmp/cbc-browser-libs` and the browser to `/tmp/cbc-playwright`. On this workstation run:

```sh
LD_LIBRARY_PATH=/tmp/cbc-browser-libs/usr/lib/x86_64-linux-gnu PLAYWRIGHT_BROWSERS_PATH=/tmp/cbc-playwright npm run test:e2e
```

Those `/tmp` paths are environment-specific and are not repository dependencies. Test screenshots/traces are disabled; synthetic failure artifacts and build metadata are ignored. The existing Next.js middleware deprecation warning remains; migrating authentication conventions is outside this slice.

## Activities & Follow-Ups (REQ-005/008)

The synthetic demo now supports `/activities`, `/activities/new`, `/activities/[id]`, `/activities/[id]/edit` and follow-up editing under each activity. Log UTC date/time, free-text type, organization, multiple participants, location, purpose, discussion, sponsor needs, CBC opportunity and outcome. Then add any number of follow-ups with an owner, optional Calgary due date, and Open/Complete selection. Overdue is calculated automatically; completion can be reopened.

Organization/contact details show linked activity history, Last Contact and the next open action. The dashboard shows overdue and seven-day follow-ups, with a separate undated count and explicit query-error state. All date conventions are documented in ADR-011. Activity timestamps accept UTC; edit values normalize database offsets to UTC. No organization ownership policy or profile-directory grants have changed.

Browser tests now run independently on app port **3130** and fixture API port **54339**, preserving a manually running demo on 3100/54329. The test command still builds with synthetic-only public configuration before starting the app. It covers all Activities fields, multiple participants/actions, editing, completion/reopening, linked histories, role controls, errors and existing CRM regressions. The SQL suite independently checks database enforcement.

Hosted Supabase has not received this migration. Real hosted Auth/PostgREST end-to-end behavior and CBC acceptance remain pending. The browser fixture remains test-only and in-memory; use the existing two-terminal synthetic demo commands for local exploration, restarting the synthetic API after code updates if it was already running.

## Real local Supabase demo

A separate official native Supabase stack now provides actual PostgreSQL 17, Auth and PostgREST at localhost:54421/54422. This is distinct from the HTTP fixture. See [integration readiness and connection steps](../../docs/delivery/hosted-integration-readiness.md).

From the repository root:

```sh
node scripts/demo/prepare.mjs
node scripts/demo/stack.mjs start
node scripts/demo/stack.mjs migrate
node scripts/demo/seed.mjs
node scripts/demo/run.mjs
```

Open http://localhost:3140/login. Generated account details are private in `.local/cbc-demo/accounts.json`; no password/key is committed or printed. The run helper supplies only the local API URL and public key and never overwrites your existing `.env.local`. `npm run test:integration` runs three real-Supabase browser scenarios using private reporting; `npm run test:e2e` remains the nine-scenario fixture regression suite. Run builds/suites sequentially from this checkout.

### Sponsorship & Giving (REQ-004/006/008)

Real local demo: run the root `scripts/demo/prepare.mjs`, `stack.mjs migrate`, then `seed.mjs` before `run.mjs`. Open `/giving`; Admin/Finance create contributions and dated cash receipts; Staff/Viewer read. Program/Event selectors use minimal typed funding references; create them from Add contribution. Actual receipts, voids and partial payments determine cash and outstanding balances. Pledges never count as received revenue. ADR-012 records CAD/calendar-year/in-kind conventions. Renewal scheduling is manual and document references do not upload files.

Additional checks: `node scripts/demo/verify-giving.mjs` from the repository root and `npm run test:integration` from this directory. The fixture browser API intentionally lacks Giving endpoints; regression tests verify explicit unavailable history rather than fabricated zero balances. Giving behavior is verified against real local Supabase, not that fixture.

## Sponsor Interests — REQ-014

Provisional ADR-013 supplies list/create/detail/edit, organization history, optional affiliated contact/opportunity, Program alignment, explicit discussion/follow-up selections and Admin archive/restore. Category/strength are manual; owner inherits the organization's restricted label. Opportunity estimates are reference data with currency definition pending, excluded from Giving totals. No interest hard deletion or automatic scoring/matching.

Apply the sixth canonical migration only to the local demo using the guarded helpers, then rerun `node scripts/demo/seed.mjs` from the repository root. `node scripts/demo/verify-interests.mjs` checks actual local Auth/PostgREST. `npm run test:integration` includes five interest scenarios in addition to six existing CRM/Giving scenarios and builds the production app against real local Supabase. `npm test` includes three additional interest/reference validation tests (16 total). No screenshots/traces/videos are captured; credential-sensitive failures remain private. CBC approval/manual board demonstration and hosted rollout remain pending.


## Programs & Recipients and review regressions — REQ-010/002/006/008

The existing Programs slice provides programs, cohorts, recipients and enrollments, with shared forms, role restrictions, manual outcomes, exact support and linked-contact evidence under provisional ADR-014. Run `node scripts/demo/verify-programs.mjs` from the root for 68 real local API checks. The complete integration browser suite now has 17 scenarios, including program-switch/cohort-reset and direct-URL normalization. Fixture regressions have 15 scenarios, including independent CRM query failures, successful empty data, recovery and zero cash versus failed financial summary. `npm test` has 19 validation tests.

Apply/seed only the guarded isolated local environment before running these suites. The source-only fixtures lack Programs endpoints; Programs workflows use real local Auth/PostgREST. Runtime tools under `/tmp` may need restoration after a session reset; run browser suites sequentially. Manual CBC demonstration, provisional-rule approval, full audit history, absent modules and hosted rollout remain pending.


## Reports foundation — REQ-013/004/006/008

Reports navigation reaches all six categories. `/reports/financial` reuses Giving summaries, exact complete record reads and source links; cash-year/organization filters do not turn all-time balances into historical snapshots. Sponsor Relationship provides manual agreement/renewal dates, linked interactions and opportunity references; pipeline/risk/renewal-rate metrics remain pending. Four other categories and event ROI/export remain explicitly pending. No migrations or permission changes are required.

From the root, `node scripts/demo/verify-reports.mjs` runs 70 actual local report API checks after the existing named seed. Frontend report unit tests cover filters, exact cents and complete/paged failure handling; real-browser tests use isolated synthetic report records, while the fixture suite forces errors and slow loading. See [latest executed counts and limitations](../../docs/delivery/progress.md#reports-foundation). CBC report approval and manual demonstration remain pending.
