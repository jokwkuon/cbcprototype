# CBC CRM frontend

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
