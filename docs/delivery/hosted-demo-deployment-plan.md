# Separate hosted synthetic demo plan — REQ-008/013

**Prepared only. No resources created, no public deployment, no existing hosted project modified.** Existing hosted schema has three baseline application tables, no recorded migration history and advisor warnings; do not replay these migrations there. Its baseline reconciliation and security review are a separate owner-approved task.

## Architecture and configuration

Use the existing Next.js application as one managed Node hosting deployment (or container), connected to one **new**, isolated Supabase project in a CBC-approved region. Database/Auth are sufficient for metadata-only Documents; no Storage bucket is required. Choose a host supporting the pinned Next.js/Node version and server actions. Keep the demo private behind approved access controls; no indexing/public invitation flow.

Browser/server runtime environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or a separately reviewed publishable-key migration). These are public project identifiers, protected by RLS. Never supply service-role/secret/DB credentials as `NEXT_PUBLIC_*`. Trusted migration/seed operator credentials belong only in a secrets manager or ephemeral operator environment. Do not upload `.local`, `.env.local`, local signing keys, test logs, architecture PDF, extracted source artifacts or raw records.

## Operator sequence after explicit hosted approval

1. Record owner, project reference, region, budget and synthetic-only scope. Independently confirm a brand-new empty project with no production linkage. Take an initial backup/export of schema and migration history. Existing scripts intentionally reject remote targets: **do not weaken their guards**.
2. Review pinned CLI `--help`, hosting compatibility, dependency lock and current vendor security guidance. Configure Auth site URL and exact callback/redirect URLs for the approved host; disable public signup and use operator-created confirmed synthetic accounts. Disable unnecessary providers. Do not copy local passwords.
3. Review all **ten** canonical `database/migrations/*.sql` in lexical timestamp order: initial CRM → ownership → CRM fields → Activities → Giving → Interests → Programs → Membership → Mentorship → Documents. Preserve checksums and versions; exclude `database/proposals` and SQL test bootstrap/fixtures. On this new empty target only, use a securely reviewed CLI target and `supabase db push --dry-run`, then `supabase db push`. Discover flags with `--help` before executing; these commands are a plan, not executed evidence.
4. Prepare a separate reviewed hosted seed operator using only explicit synthetic identities. Create Admin/Staff/Finance/Viewer accounts via trusted Auth administration, then trusted profile role/activation assignment. Seed via normal signed-in role clients to exercise RLS. Reuse the synthetic fixture shapes, never a local `status.json` or unrestricted service-key frontend. Record generated hosted credentials only in the approved vault. Existing local seed helpers remain local-only.
5. Verify every exposed table has RLS, explicit grants and active-role policies; views use `security_invoker=true`. Check restricted directory/profile access, Admin-only document metadata, spoofed creator prevention, inactive/anonymous denial and cross-entity constraints. Run hosted security advisors and review all warnings/errors before use. Check extension placement; do not assume the existing project's warnings are resolved by local results.
6. Build and deploy a private preview with only approved public runtime variables. Local equivalent verification commands:

   ```sh
   npm ci --prefix apps/frontend
   npm test --prefix apps/frontend
   npm run typecheck --prefix apps/frontend
   npm run lint --prefix apps/frontend
   npm run build --prefix apps/frontend
   ```

   Hosting build: frontend root `apps/frontend`, `npm ci` then `npm run build`; Node runtime starts with `npm run start`. Do not deploy static export: authentication/server actions require a server runtime. Configure TLS, exact host allowlists and platform secrets; ensure logs never capture account passwords/tokens. Run a separately reviewed hosted smoke harness against only the approved new URL; local helpers must continue rejecting remote URLs.
7. Smoke-test login/logout, inactive/anonymous denial, all four roles, create/edit/link validation for each module, all six report filters/source links/CSV, dashboard reconciliation, mobile layout and explicit errors. Run the synthetic walkthrough; save private evidence without screenshots containing personal details or credentials. Record commit, migration manifest, deployment ID and CBC review.

## Rollback and cost

Keep the prior application deployment available for immediate traffic rollback. Before data/schema changes, take a restorable approved backup and capture migration history/checksums. Additive migrations have dependencies: do not issue ad-hoc DROP/down migrations or reset an existing database. For a failed first deployment, remove access and pause the new demo; review backup restoration or an authorized replacement empty demo project. Restore data/schema and matching application version together, then recheck RLS/Auth and smoke tests. Revoke demo sessions/accounts when retiring the environment; deletion alone does not revoke already issued access tokens.

Approve current host/Supabase plan costs and spending caps at deployment time (no price quoted or assumed here). Consider database compute, backups/retention, storage, egress, host build/runtime limits, inactivity behavior, custom domains and ongoing ownership. Metadata-only files avoid binary storage costs; this is not a zero-cost guarantee.

## Final approval gate

- [ ] CBC/instructor accept existing stack, provisional ADR-016/017/018, permissions and pending formulas.
- [ ] Owner authorizes a specific new hosted project, region, host, costs and operator.
- [ ] Owner resolves tracked architecture PDF removal/public-history remediation before publication; no history rewrite without authorization.
- [ ] Migration/seed manifests and outgoing source reviewed for secrets/confidential material.
- [ ] Hosted RLS/advisors/Auth/smoke checks pass; warning disposition documented.
- [ ] Private URL/access controls, credentials vault, backup/rollback and support owner approved.
- [ ] CBC names reviewer and records board-demo acceptance. Only then authorize any public publication separately.
