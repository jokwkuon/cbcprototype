# Audit, import, mentorship and document proposals

REQ-007/008/010/011/012. **Policy-dependent designs only**, except the explicitly no-write fictional CSV preview prototype. No real-data import, new role, audit trigger, storage bucket, mentorship constraint removal or hosted change is applied. Existing [migration contracts](../design/version-3-operational-migrations.md) and [rollback-wrapped SQL skeleton](../design/proposals/operational-workflows.sql) remain canonical starting points.

## Append-only audit history

Proposed protected `private.audit_events`: generated UUID; subject table/type + stable UUID; actor Auth UUID from verified DB context; operation; server timestamp; approved field-name list; minimal old/new JSON values; validated request/correlation identifier; schema/version. Use allowlists by domain, never arbitrary row JSON. Exclude passwords, tokens, document bodies, sensitive free text and unnecessary participant identifiers. Actor display name is not authoritative; keep stable reference with approved deletion/pseudonymization policy.

Trigger function would be narrowly scoped SECURITY DEFINER only where necessary to write private storage; fixed empty search path; fully qualified relations; trusted owner; revoke EXECUTE from PUBLIC/anon/authenticated. Browser roles get no direct insert/update/delete/truncate/sequence access. Subject writes still require existing RLS. Do not accept actor IDs from request payloads. Application correlation is supporting context only, never authorization. Database administrators can alter the system; append-only application permissions do not establish external tamper-proof evidence.

Before implementation CBC must approve: audited operations/fields, readers, sensitive-value masking, legal/retention/deletion policy, incident access, export handling, account deletion behavior and operational cost. A trigger failure should fail the sensitive mutation atomically; confirm availability tradeoff. Export auditing needs separately approved actor/scope/count metadata, not exported contents.

Proposed migration sequence: private event table and minimal indexes (subject/time, actor/time); revoke all browser writes; create private trigger function and approved allowlist; attach to approved tables; test rollback/atomicity; grant only approved scoped read projection. Existing historical edits are not recoverable; no fabricated backfill.

Sample approved-operator queries after implementation:

```sql
-- Parameterized subject investigation, no unrestricted browser query.
select actor_id, operation, occurred_at, changed_fields
from private.audit_events
where subject_type = $1 and subject_id = $2
order by occurred_at, id;
```

Acceptance: real SQL/API actor forgery denial; browser insert/update/delete denied; inactive user denied; fields outside allowlist absent; rollback creates neither subject edit nor audit event; concurrent edits produce separate committed events; authorized audit read is scoped; role revocation takes effect; retention job is operator-controlled and logged. Existing event/history tables are not this audit ledger. These tests require approved DDL; not executed as current security evidence.

## Import pipeline and no-write preview

Start with explicit source inventory and permission. Approved operator uploads CSV into private staging with a cryptographic checksum, source label, batch UUID, mapping version and idempotency key. Parse bounded UTF-8, reject duplicate/unknown headers, limit bytes/rows/field sizes, report source row/field errors, normalize only approved transformations. Never execute user-supplied expressions or SQL mappings. Formula-like source text remains text; exported review files must preserve formula neutralization.

Preview must resolve linked records by explicit approved IDs/source keys, validate FK/parent relationships under target permissions, show unknown/null versus zero, and flag possible duplicates for manual review. Names alone are candidates, never merge keys. Existing IDs cannot be silently reassigned. Approved dry run contains proposed creates/updates/skips/errors with no target writes.

Proposed private tables: import batch (checksum/source/status/actor/mapping/idempotency), row staging (batch+row unique, validation state, proposed IDs, error codes), source-reference map (source system+external ID unique), and explicit duplicate decisions. Batch apply uses transaction/validated bounded chunks, unchanged existing domain validation/RLS, actor recorded server-side and resumable idempotent receipts. Unique idempotency keys stop duplicate processing. Corrections preserve provenance. Rollback deletes only provably batch-created unreferenced records or applies reviewed inverse corrections; never broadly delete matching names. Finance imports need independent reconciliation and approval.

CBC decisions: authoritative source/fields, approved mapping, update/merge authority, identity keys, corrections/conflicts, batch approval, retention and who can see previews. Actual imports remain gated. The fictional prototype only parses and validates organization CSV locally; it creates no database entities, applies no business taxonomy and does not prove the future pipeline.

Acceptance: quoted/newline CSV; malformed syntax; bad headers/mapping; oversize inputs; row/field errors; duplicates flagged but not merged; invalid linked IDs; repeated batch idempotency; interrupted chunk recovery; concurrent approval; permission revocation; correction with new references; exact-cent finance source reconciliation. Parser tests are executable now; DB/apply tests remain specified for approved implementation.

## Cross-organization mentorship and sensitive programs

Existing pair stores mentor/mentee contacts under one shared organization and program/cohort. Proposed model: independent mentor and mentee contact FKs plus explicit administering organization; preserve non-self and program/cohort consistency; optional affiliation snapshots only if CBC approves historical meaning. Do not infer enrollment or matching eligibility from contact affiliation.

Preflight existing rows: every contact exists; validate shared affiliations and program/cohort; count pairs and check-ins; record rows affected by proposed reparenting. Add independent FKs validated before dropping composite affiliation FKs in a separately approved migration. No data rewrite by name. Forms choose participants independently, show affiliations and authorized identities, preserve current selections and clear incompatible cohort changes. RLS must authorize both participant visibility and assigned program; avoid revealing other programs through option/search/API joins. Existing broad operational reads are insufficient for sensitive use.

Rollback: after cross-organization pairs exist, old constraints cannot simply be restored. Retain independent links, stop new cross-org writes and obtain CBC decisions for affected pairs; never delete or silently reassign contacts. Acceptance: different-org allowed only after approval; same person rejected; inaccessible participant rejected; later contact affiliation changes preserve approved historical meaning; unassigned staff cannot read/create/export; coordinator revoked mid-edit denied; unrelated cohort and forged organization fail; check-in parent remains immutable.

Sensitive design: minimal recipient identity separate from restricted educational/review notes and safeguarding records; explicit active program assignments and capability-specific reviewers; separate restricted export capability; consent evidence only where approved/applicable; revocation evaluated by database; retention/deletion policy and incident access approved before collecting real information. No automatic eligibility, graduation, health score, award or safeguarding rules.

## Private document storage

Documents currently store metadata only; no binary upload occurs. Future design: private bucket(s), opaque object keys bound to authorized document/version IDs, transactional metadata lifecycle, immutable version references and current-version pointer. Browser requests authenticated upload authorization with approved size/type limits; server validates actual bytes/type, quarantines until malware scanning succeeds, then publishes privately. Never trust filename or client MIME. Scanner/provider/cost and maximum types/sizes need approval; no external scanner is purchased here.

Downloads reauthorize metadata/class/program each time and issue short-lived signed access; never log signed URLs. Revocation prevents new links, but issued links remain valid until expiry, so CBC must approve lifetime and sensitivity constraints. Files and metadata share retention/legal holds and audited deletion; orphan cleanup uses explicit lifecycle IDs, not filename heuristics. Reject path traversal and replacement of another version. Audit uploads/download authorizations/classification/retention actions using approved minimal fields.

Acceptance: anonymous/inactive/unauthorized classes denied through direct storage paths; altered object key rejected; stale signed URL expires; version cannot overwrite another subject; oversized/spoofed/malicious/quarantined file cannot download; metadata/object failure reconciles; deletion respects approved holds; backups restore both metadata and bytes. No public buckets, real files or confidential screenshots are introduced.
