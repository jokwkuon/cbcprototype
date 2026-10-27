# Decision / architecture log
| ID | Question | Status | Decision owner |
|---|---|---|---|
| ADR-001 | Data-first or operational app MVP? | OPEN | CBC + instructor |
| ADR-002 | PostgreSQL vs SQL Server? | PROPOSED PostgreSQL | Technical team |
| ADR-003 | Backend/frontend framework? | OPEN | Student team + instructor |
| ADR-004 | Power BI vs embedded dashboard? | OPEN | CBC + team |
| ADR-005 | Google sign-in vs other authentication? | OPEN | CBC admin |
| ADR-006 | Drive document links vs separate storage? | OPEN | CBC admin |
| ADR-007 | Distinguish opportunities, commitments and payments? | OPEN | CBC Finance |
| ADR-008 | Prototype vs production and environment? | OPEN | CBC sponsor |
| ADR-009 | Code ownership, public repo and post-term support? | OPEN | CBC + Bow Valley |

## ADR-010 — MVP organization ownership (accepted 2026-10-26)

Authority: explicit repository-owner instruction in this session; REQ-001/002/008.

- Admins assign/reassign organizations only to active profiles whose role is `staff`.
- Staff may select themselves on creation, or leave ownership unset; afterward staff cannot change or clear ownership. Finance/Viewer cannot change ownership.
- Enforce actor role through RLS and compare old/new ownership in a database trigger; reject invalid, inactive and non-staff owner IDs. UI filtering is supplementary.
- Restricted owner directory exposes only staff ID and display name: admins see active staff; staff see themselves; Finance/Viewer/anonymous receive no directory rows. Profiles retain existing self/admin read restrictions.
- Implementation defines active as `profiles.is_active`; existing profiles default true, preserving current accounts. Only trusted operators may change role/active state; browser profile writes remain denied. Deactivation removes selectable ownership but does not rewrite existing organization ownership. Non-ownership edits preserve historical assignments.
- Existing nullable ownership remains supported. Staff deletion is disabled to prevent delete/reinsert ownership reassignment; admin deletion remains available through the database. No delete UI is added.
- This authorizes the ownership slice, not unresolved finance/KPI formulas or production use. Existing stack is retained for the explicitly requested three-day synthetic demo; instructor/CBC broader stack and acceptance approvals remain open.

## ADR-011 — Activities demo conventions (implemented; CBC review pending)

REQ-005/008. The user explicitly requested the complete activity/follow-up workflow and overdue calculation. These are visible MVP implementation conventions, not approved KPI formulas:

- Store interaction timestamps as timestamptz; forms explicitly accept UTC. Future timestamps represent planned activities and do not advance Last Contact.
- Evaluate date-only deadlines in `America/Edmonton` (Calgary). Complete takes precedence; otherwise due before today = Overdue; today/future/no due date = Open. A follow-up may be completed and reopened explicitly.
- An activity may have zero/many participants and zero/many follow-ups. Organization is optional for person-only interactions. Participants may belong to other organizations; log links are historical, not automatic changes to affiliations.
- Reuse existing CRM access: active Admin/Staff create/edit, Finance/Viewer read only; anonymous/inactive denied. No delete workflow is introduced. Actions may select only owners visible through the existing restricted directory (Admin: active Staff; Staff: self), or be unassigned. Preserving an existing owner is allowed without exposing their profile. This does not modify organization ownership (ADR-010).
- Last Contact is the latest nonfuture explicitly linked interaction. For an activity detail it covers the activity's organization and participant relationships; organization/contact pages use their specific links. Open next action sorts by due date (undated last), then task UUID. No scores/health metrics are implied.
- Dashboard queue includes all overdue and today through six days ahead (seven Calgary calendar dates); show undated actions separately. The page's Due this week metric uses Monday–Sunday; Upcoming meetings counts future activities whose type is exactly Meeting (case-insensitive). Types remain free text with suggestions, not a new approved taxonomy.
- Save activity plus participant replacement atomically. Follow-ups are separate records/forms so a validation error never leaves a partially created action. No financial/reporting KPI definitions are changed. Hosted rollout requires explicit review.

## ADR-012 — MVP giving rules (accepted for synthetic MVP, 2026-10-26)

Authority: explicit user approval in this session; REQ-003/004/006/008. CAD only; calendar-year reporting uses dated cash receipts, never unpaid pledges. Pledges and partial receipts are separate records. Active Admin/Finance are financial writers; Staff/Viewer are read-only. In-kind support is recorded separately without automatic valuation or FX conversion. ADR-007 is resolved for this limited MVP, not production finance/accounting policy.

Implementation conventions supporting those rules:
- Contribution Amount is the manual planned/pledged amount. Funding Status is a planning stage (Prospect, Committed, Invoiced, Cancelled); payment status is separately derived from actual receipts. Setting a stage cannot create cash revenue. Unpaid prospects and cancelled commitments do not create outstanding debt; actual receipts remain cash received even after a planning cancellation.
- Cash pledged/outstanding cover Cash records in Committed/Invoiced stages; outstanding is max(pledge minus non-void receipts, 0). Overpayments remain visible as received cash; never negative outstanding. In-kind amounts are manually declared values, displayed separately and never cash revenue.
- Positive CAD receipts have a nonfuture received date. Void corrections retain the receipt with a reason and exclude it from aggregates. Refunds, accounting reconciliation, immutable financial audit trails and production approval remain deferred.
- Reporting uses Calgary's current date. Current-year comparisons use YTD against the same prior-year cutoff (Feb 29 maps to Feb 28); completed years compare full calendar years. A zero prior baseline returns no percentage, not infinity or a fabricated growth rate. Lifetime cash includes all eligible receipts through today, independent of pledge date.
- Agreement/renewal dates are stored planning metadata. Renewal is entered explicitly; no automatic scheduling rule is assumed from the guide's AUTO label. Program/Event support is a small typed funding-reference lookup, not implementation of recipient/event modules. Documents are reference links only; no file uploads or external access controls are claimed.
