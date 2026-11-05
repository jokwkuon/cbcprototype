# Access matrix proposal — REQ-008/010/011/012/013

**Proposal only.** Existing four-role policies are unchanged. CBC must name approvers and accept scopes before new roles, sensitive-data restrictions, audit access or cross-organization mentoring ship. This matrix does not imply current broad read access is approved for real student records.

Notation: R read; C create; U update; A archive; X export; O assign ownership; S sensitive fields; M role administration. `—` denied; `assigned` requires active explicit record/program assignment; no browser hard-delete capability is proposed. Administrative role management is trusted-operator-only until a separately reviewed workflow exists.

## Current implemented baseline

| Domain | Admin | Staff | Finance | Viewer |
|---|---|---|---|---|
| Organizations/contacts | R C U X; organization O | R C U X; organization owner self/unassigned on create, preserve thereafter | R X | R X |
| Activities/follow-ups | R C U; permitted task owners | R C U; self/unassigned task owner or preserved historical owner | R | R |
| Interests/opportunity references | R C U A X | R C U X | R X | R X |
| Programs/recipients/enrollments | R C U X | R C U X | R X | R X |
| Membership/mentorship/check-ins | R C U X | R C U X | R X | R X |
| Giving/contributions/receipts/voids | R C U X | R X | R C U X | R X |
| Internal document metadata | R C U | R C U | R | R |
| Admin-only document metadata | R C U | — | — | — |
| Profiles | Self + all read; M trusted operator | Self read | Self read | Self read |

X denotes existing report exports for included records, not a generic module bulk export. All capabilities require an active profile. RLS applies to direct PostgREST; Server Actions independently verify role; finance operations retain existing exact-cent/void rules. Relationship owners inherit from organizations, not a new permission grant. No staff financial write or browser profile write is permitted.

## Proposed least-privilege refinement for approval

| Domain / scope | Admin | Staff | Finance | Viewer | Program coordinator / assigned program staff | Relationship owner |
|---|---|---|---|---|---|---|
| General relationship records | R C U A X O | R C U; X if approved | R; financial subset X | Approved nonsensitive R; X separately approved | As current Staff if CBC approves, no implicit sensitive access | U only within approved owner scope; O remains Admin |
| General interactions/tasks | R C U A O | R C U assigned/team scope approved by CBC | R finance-linked context | Approved nonsensitive R | R C U assigned program | R U assigned relationship; no inferred student access |
| Giving/receipts/voids | R C U X | Approved relationship totals R | R C U X | Approved summaries R | Approved program totals R | Approved relationship totals R |
| Program identity/enrollment | R; operational admin does not imply S | Approved minimal R | Minimal finance references R | Aggregated approved R | R C U assigned program; O coordinator only if approved | Minimal approved R only |
| Restricted student fields/review notes | S only with explicit capability | — | Approved minimum finance fields only | — | S assigned reviewer capability, separate from general assignment | — |
| Safeguarding/consent records | Explicit specialist capability only | — | — | — | Explicit specialist capability only | — |
| Restricted documents/files | Explicit class/program grant | Explicit grant | Explicit grant | — | Assigned class/program grant | Explicit grant |
| Sensitive exports | Explicit export approval/capability | — | Approved minimal finance export | — | Assigned program + export capability; log access | — |
| Assignments and access revocation | Trusted administration | — | — | — | Coordinator can request; approval boundary pending | — |
| Audit events | Approved auditor R; no mutation | — | Approved finance audit subset R | — | Approved scoped reviewer R | — |
| Roles/accounts | M trusted operator; separation of duties pending | — | — | — | — | — |

Program coordinator and assigned staff are **proposed capabilities**, not implemented roles. Scope questions: global versus owning relationship; team task visibility; per-program reviewer membership; cross-organization contact disclosure; finance need-to-know; administrator break-glass access. CBC must resolve consent applicability, student/safeguarding classifications and export policy before real records.

## Executable acceptance contract after approval

Preserve current `database/tests/{ownership,giving,programs,board-completion}.sql`, local API verification and role-specific browser tests. They test current rules, not this proposed policy. For each approved capability add a fixture actor with only that capability and exercise SELECT/INSERT/UPDATE/DELETE, embedded joins, invoker views, RPC, direct API, Server Action replay and CSV:

1. Anonymous/inactive → no rows and no mutation; deactivate an assigned user and confirm the next request loses access.
2. Unassigned Staff → cannot retrieve restricted fields by ID/search/join/export; error must not leak contents. General operational read alone grants no sensitive access.
3. Assigned reviewer → only assigned programs and approved columns; cannot reparent record to an unassigned program; revoke assignment and repeat requests.
4. Finance → only approved finance identity/amount fields; cannot read safeguarding notes; Staff cannot insert/update receipts/voids.
5. Owner → cannot change organization owner, program assignment, role or sensitive classification through forged payloads.
6. Admin without specialist capability → follow approved break-glass decision; no assumed blanket sensitive access.
7. Unknown UUIDs/invalid links → generic unavailable; record count/empty-state behavior must not disclose restricted records.
8. Concurrent access revocation/write → database check at statement time; prior browser cache cleared on next navigation. Export permission rechecked immediately before export; streaming cannot retract bytes already sent.

These are acceptance specifications, not passed tests or deployed RLS. Do not broaden an existing policy to satisfy them.
