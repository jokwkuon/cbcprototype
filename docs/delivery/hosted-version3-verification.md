# Hosted Version 3 upgrade verification

Executed 2026-11-04 America/Los_Angeles (2026-11-05 UTC), feature branch `feature/version3-operational-upgrade`, REQ-001/002/004/005/008. Explicit owner instruction authorized upgrading the existing hosted database after the earlier GitHub push. No application deployment, branch merge, paid-plan change or new business policy was authorized or performed.

## Target, baseline and preservation

Confirmed existing project `cbcprototype`, `sywfyjaqzziyqhgulvjp`, active healthy, PostgreSQL 17.11.0.003. Read-only catalog inspection matched the original CRM enums, columns, constraints, indexes, policies, functions and triggers. Baseline contained one profile (Admin), one organization and one contact; no migration history. No contact/name/email values appear in this report or public source.

A private logical data/catalog snapshot was saved outside Git at `/tmp/cbc-hosted-reference/baseline-backup.json`, directory mode 700, file mode 600. No Auth secrets were exported. This is not a full platform backup or a tested disaster-recovery/PITR service. The upgrade used an atomic transaction with short lock timeout and explicit preservation assertions rather than replaying the initial schema or rebuilding tables.

After upgrade **and** rollback-only hosted verification, counts remained 1/1/1 and original-field fingerprints matched exactly, including IDs, names/contact details, affiliation, owner and timestamps. New `is_active` defaults true; existing role was preserved. No verification Auth users, contributions or documents remained after smoke testing. No real student/contact/financial records were used as test fixtures.

## Applied changes and source traceability

- Initial CRM migration adopted after independent catalog verification; never rerun against existing tables.
- Canonical increments through `20261105002247_role_helper_hardening.sql` applied with their existing RLS/integrity/business conventions. New policy proposals and `database/proposals` were excluded.
- `database/hosted/reconcile-version3.sql` and `source-manifest.json` preserve the actual reviewed adoption bundle and twelve source checksums. Hosted version `20261105003148` has a canonical no-op reconciliation receipt so fresh/local/hosted version lists align without repeating DDL.
- `20261105003326_foreign_key_indexes.sql` covers nine advisor-identified FK lookup paths, including task owner and composite affiliations; no indexes dropped and no financial/eligibility/mentorship rule changed.
- Privileged role lookup moved to a narrowly granted private-schema helper; public `current_role` remains an invoker wrapper with the same active-profile semantics. Trigger functions have fixed search paths and no browser RPC execute grants. Equivalent existing CRM policies use statement-level auth lookups and separate operations, preserving allowed actors.

Hosted now has **24 public tables**, all with RLS; **10 views**, all security invoker; **14 recorded canonical versions**. Anonymous table SELECT grants: zero. Browser profile writes: denied. Public security-definer functions executable by anonymous/authenticated callers: zero. Original same-organization mentorship, ownership restrictions, exact CAD/pledge/receipt conventions and Admin-only document boundaries remain intact.

## Executed evidence

| Check | Result | Scope |
|---|---|---|
| Existing-baseline reconciliation rehearsal | PASS | Separate local fictional baseline; all original values preserved, twelve historical source entries recorded, repeated adoption refused |
| Full local SQL/RLS regression | 285 assertions passed after hardening/index changes | Fresh PostgreSQL database, independent of hosted data |
| Local real Auth/PostgREST | 20 access checks and 39 financial checks passed | Active/inactive/anonymous/ownership restrictions and exact cash/pledge/correction behavior |
| Hosted rollback-only SQL permission smoke | 28 assertions passed | Four roles plus inactive/anonymous, profile/owner protection, document restriction, finance reconciliation and unchanged affiliation rule; fixtures rolled back |
| Hosted HTTPS API smoke | PASS | Five anonymous REST/RPC requests denied (401/403), Auth health HTTP 200; uses publishable key only |
| Hosted record reconciliation | PASS | Original counts/fingerprints unchanged after upgrade and smoke; no retained verification records |
| Hosted security advisors | Database findings cleared | Remaining Auth warning below |
| Hosted performance advisors | Only unused-index INFO remains | Missing-FK, overlapping-policy and auth-initplan findings cleared; no indexes dropped based only on lack of traffic |
| Authenticated hosted browser/login/CRUD | Not run | No existing user's password requested, changed or used; SQL role simulation and anonymous HTTP checks do not establish authenticated browser acceptance |
| Frontend build/lint/typecheck/browser redesign | No frontend changes in this hosted increment | Prior local evidence remains in the operational verification report; it is not re-labeled as hosted browser evidence |

Private API output is `.local/cbc-demo/hosted-api-verification.json`. Local rehearsal diagnostics stay ignored under `.local/cbc-demo`; no raw hosted records or credentials are committed. The local preview at port 3140 still uses the isolated local demo, not the hosted records.

## Remaining risks and approvals

The organization is currently on the Free plan. Hosted security advisors still report **leaked-password protection disabled**. Supabase documents this capability as [Pro plan and above](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No plan/billing upgrade was made; the connected database tools do not expose Auth configuration updates. This warning is not claimed resolved.

Unused-index INFO is expected on newly introduced tables with little/no traffic; assess workload before removing indexes. Broad existing student-module read roles remain suitable only for the accepted prototype scope: proposed finer-grained student/safeguarding access is not implemented or approved for real data. There is no approval for real student imports. Eligibility, awards/disbursements, new affiliation rules, imports/merges, immutable audit and lifecycle extensions remain gated.

Application configuration/deployment, production readiness, durable backup/restore verification, instructor/CBC acceptance and authenticated hosted walkthrough remain separate work. This upgrade updates the hosted schema and database protections; it does not certify production readiness.
