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
