# Database setup and synthetic verification

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
