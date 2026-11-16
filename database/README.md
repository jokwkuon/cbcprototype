# Database setup and synthetic verification

**Current Version 3:** 15 canonical migrations, 24 public tables and 10 invoker views. This increment adds a permission-equivalent activity SELECT initplan optimization, applied to the isolated test database only. Hosted history previously reconciled 14 versions; the new migration is not applied there. See [hosted baseline evidence](../docs/delivery/hosted-version3-verification.md), [current reliability results](../docs/delivery/version3-reliability-verification.md) and [release/recovery](../docs/architecture/release-and-recovery.md). Earlier setup/hosted observations below are historical, not current operator instructions.

Structural comparison: `node scripts/schema/rehearse.mjs` builds canonical/reconciled paths in two new disposable PostgreSQL databases (Docker test container or dedicated `CBC_PG_BIN` connection). `scripts/schema/catalog.sql` is read-only; capture expected/actual JSON privately and run `node scripts/schema/compare.mjs expected.json actual.json`. It reports missing/unexpected/changed objects and exits nonzero on drift, without modifying either target. Version/checksum checks remain separate. Auth/platform/storage and row data are outside this catalog. Actual hosted structural comparison is still pending.

`node scripts/schema/restore-rehearsal.mjs` restores a full fictional disposable database dump into another new database and reconciles public catalogs and complete public/test-Auth rows. It is not a hosted recovery tool. No existing database is reset or dropped.

REQ-001/002/008. Apply files in `migrations/` in filename order to a new isolated Supabase demo environment. The original migration creates the three CRM tables; the two Day 1 migrations add ownership enforcement, restricted staff directory and manual organization/contact fields. Do not apply the original migration a second time to an existing schema.

The connected project was inspected read-only: it has the original columns/policies but reports no migration history. **No hosted changes were made.** Before applying incremental migrations there, reconcile the existing baseline/history and review with the operator. Do not use reset, drop, or replay the initial migration to fix history. This task prepares and tests migration files; it does not deploy them.

The ownership decision is ADR-010 in `docs/project/decisions.md`. A trusted operator sets `profiles.role` and `profiles.is_active`; new signups remain Viewer. No browser profile write access is granted. Staff options are an automatically synchronized ID/display-name projection, not a broader profile policy. Deactivated staff stay attached to existing organizations but cannot be selected for new assignments. Staff edit preserves existing ownership, and delete is admin-only to close delete/reinsert reassignment. Direct API attempts are checked by RLS and a private owner trigger, including upserts and immutable IDs.

The field migration adds a composite FK for primary contact membership. Clear an organization's primary contact before moving that contact to another organization. Contact deletion clears the primary-contact pointer. Estimated amounts have no currency/default/KPI formula; numeric precision and recognition rules await Finance. URL/email `NOT VALID` checks enforce future writes without forcing an unreviewed cleanup of historical rows.

## Isolated SQL suite

With Docker available:

```sh
docker run --detach --name cbc-day1-db --network none --env POSTGRES_HOST_AUTH_METHOD=trust postgres:17
bash database/tests/run.sh
```

The container has no published ports or network. Each run creates a new database and applies the minimal auth contract, all migrations, locked entity proposals, synthetic identities and assertion suite. No existing database is reset/deleted. No real credentials, auth tokens or CBC records are used. The auth contract emulates `auth.users` and `auth.uid()` for PostgreSQL RLS tests; it does not verify Supabase Auth or hosted PostgREST deployment. Retained synthetic databases may be inspected with `docker exec`.

`proposals/` is separate: 29 unexposed tables for future modules, all RLS enabled and with no client grants/policies. Only the isolated suite applies those files. Review model and domain decisions before promoting any slice into application migrations. No service-role key is required for any test or browser code.

## Activities & Follow-Ups — REQ-005/008

`20261027041158_activities_followups.sql` adds public activities, activity_contacts and tasks plus an RLS-respecting follow_ups view and invoker RPCs. Organization ownership policies and directory visibility are unchanged. Active Admin/Staff write; Finance/Viewer read; anonymous/inactive denied. Task owners must be selectable through the existing restricted directory; historical assignments can be preserved on edits. No task/activity deletion workflow is granted.

Activity plus participant changes save atomically through `save_activity`; invalid links roll back the whole save. Tasks are separate records with one-to-many cardinality. Status is computed on query (not stored): Complete if completion exists, otherwise Overdue only before today's Calgary date, otherwise Open. No due date means Open. Last Contact ignores future activities. Calendar/selection conventions are recorded in ADR-011 for CBC review; no financial KPI formulas were introduced.

The runner also supports an existing isolated local PostgreSQL installation when Docker is unavailable:

```sh
CBC_PG_BIN=/path/to/postgres/bin PGHOST=/private/socket/directory PGPORT=55439 PGUSER=your_local_user bash database/tests/run.sh
```

Use only a dedicated disposable server: the auth bootstrap creates test roles. The runner always creates a fresh database, never resets/drops an existing one. This session used PostgreSQL 18.6 extracted under `/tmp/cbc-postgres-runtime`, a cluster under `/tmp/cbc-activities-pgdata`, and a mode-700 Unix socket directory `/tmp/cbc-activities-socket`, with TCP listening disabled. It tests real PostgreSQL SQL/RLS, not a mock engine; hosted PostgreSQL 17/Supabase Auth/PostgREST integration still requires explicit review and verification.

The local Supabase security advisor is run with an explicit socket DSN, never `--linked`. The existing timestamp helper's mutable-search-path warning is fixed additively in the Activities migration. The baseline `pgcrypto` extension-in-public warning is recorded for operator review; moving an existing extension is deliberately deferred from this local module slice. No new security-definer function is added by Activities.

## Real Supabase integration readiness

A separate native Supabase PostgreSQL 17.11/Auth/PostgREST environment is now verified. Canonical migrations remain unchanged; the demo's generated, ignored migration copies are history-managed and byte-checked. No proposal/test bootstrap enters the real default database. `node scripts/demo/verify-database.mjs` runs the 97 SQL assertions in a separate fresh database on that same PostgreSQL 17 server; real service integration is independently checked through Auth/PostgREST and browser workflows.

Two migration/seed replays preserve history and named synthetic counts without manual schema edits. Fresh Supabase already has pgcrypto in extensions and advisors report zero findings; the prior public-schema warning described the bare PostgreSQL bootstrap and is not proof of hosted placement. Do not relocate an existing hosted extension based on that warning alone.

Use [the readiness guide](../docs/delivery/hosted-integration-readiness.md) for complete commands, dependencies, credential boundaries and required hosted approvals. The existing hosted project was neither modified nor queried during this readiness task.

Giving migration `20261027060754_sponsorship_giving.sql` is additive and local-demo validated (REQ-003/004/006/008, ADR-012). It adds financial writer RLS for Admin/Finance, read-only Staff/Viewer, invoker views/RPC and exact numeric receipt accounting. Run all 134 assertions through `node scripts/demo/verify-database.mjs` in the real local stack; the default Supabase Auth database must never receive the synthetic test bootstrap/proposals. Migration replay uses history, not raw SQL replay. No hosted target is approved.

## Sponsor Interests — REQ-014/003/005/008

`20261028015014_sponsor_interests.sql` adds interests, small organization-bound opportunity references and explicit Program/activity/task joins. It does not expose draft tables. Contact/opportunity composite FKs enforce affiliation; Program alignment rejects Event references. Active roles read, Admin/Staff write, Admin alone archives/restores, no interest hard deletion. Organization ownership and Giving policies remain unchanged. ADR-013 records these provisional conventions pending CBC approval.

`save_interest` atomically replaces links with invoker permissions and a row lock. `interest_details` uses `security_invoker` and selects latest explicitly linked past discussion plus earliest explicitly linked incomplete task. Private metadata triggers preserve creation timestamps and immutable IDs; updates/archive times are server-generated. Full audit history is deferred.

Run `node scripts/demo/verify-database.mjs` for all 172 assertions in a new disposable PostgreSQL 17 database. Run `node scripts/demo/seed.mjs`, then `node scripts/demo/verify-interests.mjs` for real local Auth/PostgREST verification. Seeding includes two named interest organizations/contacts/opportunities, one interest, two linked discussions, a Program and three existing follow-up links. Replays use stable IDs; no reset/hard deletion. Existing account credentials remain private and ignored. Hosted rollout is not authorized.

## Owner-authorized hosted reconciliation (2026-11-04 / Nov 5 UTC)

The preceding read-only statements are historical. The owner later explicitly authorized upgrading the existing hosted project. See [hosted reconciliation sources](hosted/README.md) and [verification](../docs/delivery/hosted-version3-verification.md). Fourteen canonical versions now include role-helper hardening, a no-op existing-hosted reconciliation receipt and FK index coverage. Do not replay the one-time hosted bundle on a fresh/upgraded database or infer permission for future hosted changes from this checkpoint.
