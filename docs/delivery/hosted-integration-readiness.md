# Hosted integration readiness — local evidence and approval gates

REQ-001/002/005/006/008. Updated 2026-10-26 on `feature/mvp-foundation`. A **separate real local Supabase environment** is prepared and verified. No cloud resource was created, no hosted migration was applied, and the existing hosted project was not queried or modified during this task. Hosted deployment still requires explicit approval.

## Environment and evidence

- Supabase CLI is pinned to **2.120.0** (lockfile included). Native runtime is experimental; its version/configuration are part of the reproduction instructions.
- Workspace: `environments/demo`; project ID `cbc-integration-demo`, on the current feature branch. Runtime: official Supabase native PostgreSQL **17.11**, Auth and PostgREST, not the in-memory HTTP fixture or minimal test auth schema.
- API `http://127.0.0.1:54421`, PostgreSQL port `54422`, frontend `http://localhost:3140`. API and database listeners were checked: both bind only to `127.0.0.1`.
- Studio, storage, realtime, functions, mail and analytics are disabled. No external email is sent. Public registration is disabled globally; the email provider stays enabled for password login.
- Runtime state and generated keys/passwords/diagnostics live under ignored `.local/cbc-demo/`, directory mode 700, secret files mode 600. Secret keys, passwords and session tokens are never printed in task reports, committed, passed as command-line arguments or placed in frontend configuration. Frontend receives only the API URL and public anon key.
- `scripts/demo` rejects remote/wrong-port endpoints and refuses a demo workspace linked through `.temp/project-ref`. No hosted create/link/push command exists in its command whitelist.

Verified layers are distinct:

| Layer | Result | What it establishes |
|---|---|---|
| Fresh official native Supabase PostgreSQL 17 startup | PASS | Four canonical migrations apply against real Supabase Auth/system schemas and create actual migration history |
| Fresh auxiliary database on the same PostgreSQL 17 engine | PASS: 97 SQL assertions | Existing ownership + activity RLS, constraints, RPC atomicity, dates/DST, status and directory denial regressions |
| Migration/seed replay | PASS: two repeats | Applied-version history unchanged; seeded baseline remains five Auth users, one organization, two contacts, one activity and six follow-ups |
| Actual Auth/PostgREST checks | PASS: 20 checks | Admin login, CRUD/edit/relationships, real invoker view/calculations, staff restrictions, Finance/Viewer boundaries, anonymous denial, profile escalation denial and disabled signup |
| Real-Supabase Chromium suite | PASS: three scenarios | Actual browser sign-in and organization/contact/activity create/edit/primary contact/history/overdue/completion/action queue, plus Finance/Viewer read-only controls |
| Existing HTTP-fixture browser suite | PASS: nine scenarios | Synthetic regression coverage; this remains a separate test layer, not used as proof of real integration |
| Parser/validation tests | PASS: nine tests | Existing CRM/activity parsers |
| Readiness guards | PASS: three tests | Endpoint refusal, canonical migration copying, ignore rules and credential permissions |
| Typecheck, lint, production build | PASS | Existing app plus new integration tests build; production builds run with explicit local public configuration |
| Local security advisors | PASS: zero findings | Fresh Supabase baseline has no reported security warnings/errors at the checked level |
| Hosted/browser deployment and CBC acceptance | NOT performed | Needs explicit approval and final environment-specific verification |

The running frontend at http://localhost:3140 also passed a final real-admin sign-in and Activities-page smoke check. Fourteen built browser JavaScript assets were scanned and contain no generated admin keys or passwords.

The real API surfaced `PGRST201`: contact-to-organization embedding was ambiguous after the primary-contact composite FK was added. Both application contact queries now name `contacts_organization_id_fkey` explicitly. Real API/browser and existing fixture regressions pass after this small integration fix. No ownership policy or working module was rewritten.

## Migration order and dependencies

Canonical source is **only** `database/migrations/`, ordered by filename. `node scripts/demo/prepare.mjs` copies those files byte-for-byte to the isolated workspace and records SHA-256 checksums privately. Generated copies are ignored; proposals, test bootstrap, test fixture SQL and PDFs are never copied into the real Supabase migration path.

| Order | File | Dependencies / effect |
|---|---|---|
| 1 | `202610130001_initial_crm.sql` | Requires Supabase roles, `auth.users` and `auth.uid()`. Creates profiles/organizations/contacts, roles/status enum, indexes, initial RLS, user-profile/timestamp triggers and role helper. Original 12-digit version is accepted by the pinned CLI; do not rename it or replay it against existing tables |
| 2 | `20261027032358_organization_ownership.sql` | Depends on initial profiles/organizations/functions. Adds active state, restricted staff projection and private validation/sync, explicit grants and operation policies. ADR-010 is enforced in SQL; no browser profile writes |
| 3 | `20261027032422_crm_fields.sql` | Depends on baseline CRM tables. Adds manual fields, finite estimate/email/URL guards and primary-contact composite FK. The affiliation/primary-contact cycle is resolved by creating organization, contact, then primary selection |
| 4 | `20261027041158_activities_followups.sql` | Depends on initial timestamp helper plus ownership role/directory infrastructure. Adds activities/participant links/tasks, explicit grants/RLS, private owner validation, invoker RPCs and security-invoker status view; pins timestamp-helper search path |

Repeatability means applying **pending migrations through migration history**, not rerunning raw SQL files. Initial DDL is intentionally not generally idempotent. `migration up --local` was run repeatedly and preserved the exact four-version history. No reset, history repair, baseline marking, manual schema edit, extension move or new migration was needed in the fresh environment.

`api.auto_expose_new_tables = false` verifies that explicit grants are sufficient. All public base tables have RLS; only `public` is exposed. Private helpers and `cbc_demo_draft` are not API schemas; the draft schema is absent in the real integration database. Finance/Viewer read CRM data; active Admin/Staff write per current policies. Organization owner reassignment, task-directory restrictions, profile escalation denial and anonymous access were checked through real API calls and/or SQL assertions. CBC review remains required before using sensitive records or expanding module-specific permissions.

## The pgcrypto warning

The earlier warning came from a **bare PostgreSQL test bootstrap**, where the initial `CREATE EXTENSION IF NOT EXISTS pgcrypto` installed into `public`. In the fresh official Supabase stack, pgcrypto already exists in **extensions**, so the same migration preserves its placement. Actual namespace checks and local advisors report zero findings. The baseline uses PostgreSQL's built-in `gen_random_uuid()` and does not depend on `public.crypt` or a particular extension namespace.

This does not prove the existing hosted project's extension placement. Audit it separately during an approved hosted rollout. Do not blindly relocate an existing extension: assess references and operator permissions first. No historical migration was edited to hide a warning.

## Reproduce and connect — no manual schema edits

From the repository root, on Linux amd64/arm64 with glibc 2.35+ or macOS 14+ on Apple silicon (other hosts need a separately configured Docker runtime):

```sh
npm --prefix apps/frontend ci
node scripts/demo/prepare.mjs
node scripts/demo/stack.mjs start
node scripts/demo/stack.mjs migrate
node scripts/demo/seed.mjs
node scripts/demo/verify-database.mjs
node scripts/demo/check-repeatability.mjs
node scripts/demo/verify-api.mjs
node scripts/demo/stack.mjs audit
node scripts/demo/audit.mjs
node scripts/demo/readiness.test.mjs
```

`start` downloads checksum-verified native service archives on first use and saves generated local keys privately. `seed` creates real Auth users through the admin API and assigns fixture roles through a trusted local SQL connection, then creates records through a signed-in Admin using the public Data API. It never grants roles through user metadata. Signup stays disabled; no password is hardcoded. Repeated seeds preserve generated account credentials and refuse to overwrite unrelated existing identities. API/browser verification creates additional synthetic test records; the named seed baseline itself remains stable. No data is reset or deleted automatically.

Run automated frontend checks:

```sh
npm --prefix apps/frontend test
npm --prefix apps/frontend run typecheck
npm --prefix apps/frontend run lint
npm --prefix apps/frontend run test:e2e
npm --prefix apps/frontend run test:integration
```

Both browser commands build the production app with their own explicit API settings. Install Chromium and its runtime libraries if needed; see the frontend README for this workstation's `/tmp` paths. The real integration suite uses a private reporter/output directory to avoid publishing generated credentials in error logs, screenshots or traces. The mock suite uses ports 3130/54339; real integration uses 3140/54421. Do not run simultaneous production builds from the same frontend checkout.

To explore the real demo:

```sh
node scripts/demo/run.mjs
```

Open **http://localhost:3140/login**. Read the generated `cbc-demo-admin@example.test` password locally from `.local/cbc-demo/accounts.json`; do not paste credentials into Git/chat. Staff, Finance and Viewer identities are in the same private file. The run helper builds then starts production with the real local URL/public key. It does not overwrite the existing frontend `.env.local`. Use `localhost` for this demo and `127.0.0.1` for the older mock demo to separate browser cookie domains. The legacy mock demo still uses 3100/54329 and has no real Auth/database persistence.

Stop only this local backend without destroying its data:

```sh
node scripts/demo/stack.mjs stop
```

`destroy`, `reset`, `link` and cloud commands are deliberately absent from the helper. Runtime artifacts under `.local` must remain ignored and private.

## Hosted approvals and blockers

Local integration readiness is complete for the tested scope. There is no approval to create cloud resources or apply hosted migrations. Before a separate hosted demo:

1. Approve a **new** demo project with owner/organization, region, cost limit and synthetic-only scope. Do not reuse or modify the existing hosted project.
2. Record and independently verify its project reference and empty-schema/migration baseline. Approve applying the four checksum-reviewed migrations to that new target and creating synthetic Auth users/data.
3. Provision keys through the approved secure configuration mechanism. Browser receives only project URL/public key; keep admin keys/DB credentials server-side. Do not copy `.local` runtime files or local signing keys into the hosted project.
4. Apply pending migrations through versioned history, run advisors, seed synthetic accounts/records and rerun real API/browser allow/deny checks against the explicitly approved new environment. Current helpers intentionally refuse remote URLs; hosted support requires a separate reviewed target guard.
5. Approve deployment URL, Auth redirect settings, operator access, rollback/backup approach and CBC demonstration/sign-off. Existing hosted history reconciliation is outside this separate-environment task.

Native runtime is experimental; the current verified CLI/config/manifest are reproducible evidence, not a production guarantee. CBC review of ADR-011 date/count conventions and the remaining business definitions is still pending.

Next implementation priorities: **Sponsorship & Giving**, then **Sponsor Interests**. Finance recognition/commitment/in-kind/currency/KPI rules remain open; represent undefined calculations honestly instead of inventing approved formulas.
