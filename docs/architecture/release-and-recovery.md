# Release and recovery — REQ-008

This is a synthetic prototype, not an approved production system. Current operational owner assignments, hosting provider, real-data permissions, RPO/RTO, retention, support funding and CBC/instructor stack approval remain open. No release, merge, hosted migration, purchase or public deployment is performed by this document.

## Architecture and compatibility

Next.js 16.4.3 / React 19 / TypeScript modular frontend; pinned Supabase SSR 0.12.7 and JS 2.117.3; PostgreSQL 17 with RLS, Auth and PostgREST. Four implemented roles: Admin, Staff, Finance, Viewer. 24 public tables, 10 invoker views, 15 canonical migrations. This increment adds one local-only permission-equivalent activity SELECT optimization. Refer to the requirement register and ADR-010–019 for provisional workflows and financial conventions. The public CBC website is outside this system.

Use Node 22+ (CI 22; local evidence may use 24), committed npm lockfile and `npm ci`. Run `npm --prefix apps/frontend run build` with standard `NODE_ENV=production`. Deployment must support Next Node server/Proxy/streamed responses; static export is unsuitable. Session-bearing responses must never be cached by a CDN. Use HTTPS, verified Auth site URL/redirect allowlist, narrowly scoped Server Action allowed origins, and provider-managed secrets. Browser variables contain only Supabase URL and publishable/legacy anon key; never service-role or database credentials. Local seeding uses a private operator key only in guarded scripts.

## Release sequence

1. Small feature branch commits referencing REQ IDs → PR with implementation/limitations and exact checks → independent review. Require owner review for migrations/security/finance and CBC acceptance for changed policy.
2. Fast CI: units, types, lint, production/synthetic browser build. Database job: fresh PostgreSQL integrity/RLS and canonical versus reconciled catalog comparison. Heavy integration: ephemeral local Supabase Auth/PostgREST + API and browser workflows, no hosted credentials.
3. Stage the reviewed commit against a separate approved staging project with synthetic records. Verify exact public structure with `scripts/schema/catalog.sql` (read-only) and `compare.mjs`. Same PostgreSQL major; normalized output includes grants/policies/functions, not data or platform configuration. Restrict catalog artifacts; do not upload hosted catalogs automatically.
4. Before each hosted migration: identify project/reference, inspect history and row counts, confirm durable recovery and rehearse restore, review data loss/locks/client compatibility/RLS, test on isolated DB. Only separately authorized backward-compatible changes may run. Never reset hosted. Historical adoption bundle is already applied and must not be replayed.
5. Record staging walkthrough/screenshots and acceptance; approve a version/tag/changelog; deploy the exact approved artifact. Verify auth refresh, account deactivation, role denial, receipt/void exact cents, report/export, health, error logs and migration/catalog version after release.
6. Monitor, then record operator/date/commit/schema/acceptance. Never merge or release just because CI is green.

Recommended branch protection: require PRs, frontend/database/integration checks, at least one independent approval, dismiss stale approvals, require resolved conversations, block force push/deletion, restrict bypass. Named finance/security reviewers and CODEOWNERS need owner/team assignments before enabling. Use patch versions for compatible fixes; minor for compatible workflows; incompatible schema/client changes require an explicit migration release plan. `main` remains behind; no automatic branch synchronization.

## Recovery ownership and asset coverage

| Asset | Required protection / owner to assign | Restore procedure / present evidence |
|---|---|---|
| Public schema/data | Supabase operator; provider backup/PITR eligibility and retention approved by CBC; encrypted logical export where appropriate | Restore into isolated staging, compare catalogs/counts/financial examples and RLS; route traffic only after approval. Limited earlier `/tmp` snapshot is not durable full recovery |
| Auth identities/config | Supabase administrator; providers, redirect/site settings, SMTP, MFA and session revocation plan | Inventory/export via approved platform method; restore validation must include sign-in/reset/revocation. Public DB dump alone excludes platform guarantees |
| Storage | Future storage administrator | Metadata and object binaries/version lineage both needed; no object storage implemented |
| Application | Hosting/GitHub maintainer | Retain immutable prior artifact, lockfile and compatible env config. Redeploy prior artifact; test current schema compatibility before rollback |
| Secrets | CBC-designated administrators, approved secret manager | Escrow/reissue/rotate; never Git or screenshots. Account recovery and two administrators recommended; no credentials documented here |
| Backups and support | CBC technical owner and deputy | Schedule restore drills and dependency/security review; define escalation/support hours before launch |

CBC must set acceptable data loss (RPO), recovery time (RTO), retention, geography, encryption/access and recovery approvers. No service target is invented. A backup is verified only after an actual restore drill. Schema recovery usually uses a tested forward fix; never automatically down-migrate financial data. Stop writers if consistency is uncertain, retain diagnostics privately, assess impact, then approve repair. Reverting app code does not revert data.

Synthetic restore drill tooling: `scripts/schema/restore-rehearsal.mjs` (executed result is recorded in the verification ledger). It covers a disposable PostgreSQL public-data/schema snapshot with the minimal test Auth contract, not real Supabase Auth, secrets, storage, providers or hosting. Production recovery remains unverified.

## Operational health and diagnostics

Authenticated `/api/health` verifies an active profile and a limited authorized DB query with a five-second timeout. It is not a public uptime probe or whole-schema health guarantee. Deploy platforms may use login availability for liveness; never expose a privileged DB probe. Search/history/export emit event, correlation ID, duration and timestamp; Next instrumentation records route template/type without exception message, headers, URLs or payloads. Hosting access/default Next logs require separate redaction and retention configuration.

Daily operator checks: auth/refresh and access denial; DB/API availability and schema drift; error/slow-event trends; backup completion and most recent verified restore; financial report reconciliation; export failures; dependency alerts and support queue. Correlation IDs help investigate without recording confidential content. No paid monitoring dependency is added.

## Hosted configuration follow-up

Read-only comparison on this branch found three default-privilege differences for future public objects, plus expected service-role object grants and the local-only activity policy optimization. Current named browser-role object privileges match. Do not silently reconcile platform defaults. Proposed operator change after recovery/review: revoke default privileges for `anon`/`authenticated` on future tables/sequences and default EXECUTE on future public functions, then require every migration to explicitly enable RLS/grant approved capabilities. Preserve service-role platform behavior and review PUBLIC function EXECUTE separately. Capture exact grantor/schema/object-class ACLs first, rehearse the change, verify both allowed and denied paths, and prepare the captured inverse configuration. This does not retroactively repair existing objects and does not authorize hosted execution.

Hosted security advisor also reports leaked-password protection disabled. Administrator must review enablement and plan applicability; no setting was changed.
