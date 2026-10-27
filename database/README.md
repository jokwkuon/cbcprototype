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
