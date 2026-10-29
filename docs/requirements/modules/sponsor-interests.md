# Sponsor Interests — REQ-014

**Status:** Provisional MVP implementation; CBC approval pending. Authority: explicit repository-owner instructions on 2026-10-27, recorded in [ADR-013](../../project/decisions.md). Related requirements: REQ-001/003/005/008. Runtime evidence is recorded separately in [progress](../../delivery/progress.md).

Source: physical pages 9–10 already transcribed in the [field matrix](../field-matrix.md). The confidential PDF was not reopened or republished.

## Screens and field mapping

Routes: `/interests`, `/interests/new`, `/interests/[id]`, `/interests/[id]/edit`. The list supports search and Include archived, with Organization, Interest, Strength, Program Alignment, Owner and Opportunity (amount) columns. Organization detail includes linked interests and a preselected Add interest link. Mobile/desktop navigation links to the module. Validation preserves all selected multi-links; empty, unavailable and denied states are explicit.

| Field | Implemented source / behavior |
|---|---|
| INT-01 Organization | Required `sponsor_interests.organization_id` FK; list/form/detail and organization integration |
| INT-02 Primary Contact | Optional `primary_contact_id`; explicitly selected same-organization contact, read-only linked display; no automatic global-contact copying |
| INT-03 Interest Category | Required nonblank manual `category`, used as the record label; no invented taxonomy |
| INT-04 Interest Strength | Optional manual `strength` text, no scoring or matching |
| INT-05 Program Alignment | Optional `interest_programs` joins to existing funding Program references; typed FK rejects Events |
| INT-06 Last Discussed | `interest_details.last_discussed`: latest explicitly linked nonfuture activity timestamp |
| INT-07 Last Discussion | Same selected activity as INT-06; equal timestamps sort by ascending UUID |
| INT-08 Related Opportunity | Optional `opportunity_id` composite FK; same-organization reference and detail link |
| INT-09 Relationship Owner | Live organization owner and existing restricted staff label; no independent assignment |
| INT-10 Next Action | `interest_tasks` links to existing tasks; incomplete only, due date ascending, undated last, then UUID; task content/status managed in Activities |
| INT-11 Notes | Optional manually entered trimmed `notes` |

Directory Opportunity (amount) uses the linked opportunity's manual exact decimal estimate, distinct from INT-08's link. Its currency definition remains explicitly pending; the estimate is never received cash, a pledge balance or a finance KPI. Small opportunity create/detail screens support the association without a full pipeline workflow. Full Programs functionality remains deferred; Program references retain existing Giving write permissions.

## Access, integrity and lifecycle

All active authenticated roles view. Admin/Staff create/edit, only Admin archives/restores. Archived records remain viewable/editable and can be included in search. No interest or opportunity hard-deletion grants/policies exist. Join-row deletion is only for explicit link replacement. Inactive and anonymous access is denied.

The organization is mandatory. Contact/opportunity composite FKs enforce affiliation on insert/edit and prevent later reparenting of linked targets. Organization changes require compatible optional links or explicit clearing. Relationship ownership remains inherited; ADR-010/012 policies are preserved. Public views use `security_invoker`; the save RPC is an invoker transaction that locks the parent and replaces program/discussion/task links atomically. Invalid links roll back scalar edits and prior link removal. Private triggers preserve immutable IDs and creation timestamps and generate update/archive times. Full audit history is deferred.

Discussions and tasks are explicit selections, not every activity of the organization. No links means No linked past discussion / No linked open action, not a fabricated date or zero. Query failure displays unavailable. All selection rules and access decisions above are provisional pending CBC review.

## Verification and acceptance

- AT-07: synthetic organization, contact, program, opportunity, two discussions and existing follow-ups; unrelated/future/tied discussion exclusion and completed/undated task behavior.
- AT-14: database and real API allow/deny checks, archive bypass prevention, affiliation and parent reparenting constraints, restricted owner labels and existing ownership/finance regressions.
- AT-15: all eleven INT labels and six directory columns; list/create/detail/edit, organization history, mobile navigation, inline errors preserving multi-links, empty/search and role controls.
- AT-16: repeatable canonical migrations and synthetic seed; SQL, real Auth/PostgREST, real-Supabase Chromium, validation, typecheck, lint and build.

Automated evidence does not establish manual board demonstration or CBC approval. See the [demo checklist](../../delivery/demo-checklist.md). Hosted rollout remains unauthorized.
