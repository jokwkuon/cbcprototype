# Version 3 audit and implementation plan

Audited 2026-11-04, source `version-2` / remote `version2`, commit `2803dba`. REQ-001/002/005/008 are the first implementation slice. REQ-003/004/006/009/010/011/012/013/014 are reviewed for compatibility. This audit precedes application changes. Existing stack retained under the owner's explicit local redesign request; CBC/instructor approval and unresolved definitions remain separate.

## Evidence and findings

Fresh real-local synthetic baseline: 50 screenshots, 25 destinations at 1440×1000 and 390×844; zero page errors, console errors or document overflow. Originals/manifest: `.local/cbc-demo/version-3/before/`. Screenshots contain fictional local fixtures and stay ignored/private. Reproduce with `node scripts/demo/capture-version3.mjs before` while Version 2 is serving on port 3140. All source queries/actions below were inspected; code presence is not runtime verification of every flow.

| Priority | Observed issue | Source / screenshot | Consequence |
|---|---|---|---|
| P0 | Two search inputs, two stage selectors and a grouping selector on Organizations | `app/organizations/page.tsx`, `components/data-table-client.tsx`; organizations-desktop.png | Server and client filters intersect invisibly; clearing one does not clear the other |
| P0 | Contextual create links drop the originating relationship | organization detail links to bare `/contacts/new`, `/activities/new` | Staff must select the same organization again; contact interactions cannot start from the person |
| P0 | No list context on record navigation | both directories and `[id]/page.tsx` | Inspecting several relationships requires repeated back navigation |
| P0 | Editing requires a separate whole-record form | `app/actions.ts`, `crm-form.tsx` | Changing a phone number or stage is slower than necessary |
| P1 | Large, uppercase definition grids dominate first viewport; timeline starts below fold | organization-detail-desktop.png | Name/status repeat; follow-ups compete with metadata |
| P1 | Contacts summary promotes two undefined metrics | contacts-mobile.png | Takes nearly 100px on mobile without helping staff act; do not invent replacements |
| P1 | Wide generic tables and repeated per-section toolbars | giving/program/interests/relationship detail composition | Record detail resembles several directory pages stacked together |
| P1 | Same shell authenticates independently of page and related components | `shell.tsx`, `crm-context.ts`, relationship components | Query ownership obscured; helpers are not request-memoized |
| P1 | Global datasets fetched then filtered in related cards | `relationship-context.tsx` uses memberships/pairs/documents | Correct RLS but unnecessary reads; gradual scoped-query follow-up warranted |
| P1 | Several selection/history queries omit complete pagination | `crm-form-data.ts`, `activity-data.ts` | API caps can hide related records/options; directory `readAll` already protects completeness |
| P2 | Typography often 9–11px; scattered global overrides and `!important` | `app/globals.css` | Low hierarchy, high maintenance cost and unpredictable component coupling |
| P2 | Status tone is regex-derived, default grouping inferred from key names | `data-table-client.tsx` | Convenient generic component but domain semantics are hard to control |
| P2 | Monolithic compressed JSX across shell/forms/reports | components and page files | Harder review and safer reuse require domain boundaries, not another universal renderer |

Baseline visual inspection: Organizations desktop, Organization detail desktop, Contacts mobile. Full captures include all six reports, operational modules, create forms, account and login. Captured baseline has only the canonical fixture set after the local data restoration; historical Version 2 screenshot counts/row volumes are not assumed current.

## Screen → query → mutation and functional status

All reads use the cookie-authenticated public client and existing RLS. `crmContext` validates user plus active profile; shell repeats user/profile reads. Complete reads use stable IDs, exact counts and `readAll` where noted. Database objects refer to ten canonical migrations; no migration is needed for this redesign.

| Screen family | Actual read path | Actual write path | Classification / limits |
|---|---|---|---|
| Organizations list/detail/form | organizations; affiliated contacts; restricted staff_directory; activity history/Last Contact RPC; related Giving/Interests/Programs/Membership/Mentorship/Documents | `app/actions.ts`: parseCrmForm → insert/update organizations → select id; triggers/FK enforce owner and primary contact | CRUD/search/stage/sort/group/page functional; local table controls presentational over authorized loaded rows; contextual create loses context |
| Contacts list/detail/form | contacts + organizations; staff_directory; activity_contacts → activities/follow_ups + activity_last_contact; same related sources | same actions → insert/update contacts; composite affiliation FKs protect primary contacts and other linked records | Functional CRUD, affiliation and source histories; Events Attended pending; send-email is a mailto link, not delivery/logging |
| Activities and follow-ups | activities, activity_contacts, follow_ups security-invoker view, activity_today/activity_last_contact RPCs | save_activity atomic invoker RPC; tasks insert/update scoped to activity | Functional explicit participant links, complete/reopen, Calgary deadlines; future interactions are planned and excluded from Last Contact |
| Giving | contribution_details, giving_receipts, giving_summary; funding_initiatives; giving_document_links | contributions/cash_receipts/links/initiative insert/update with parsers | Functional exact CAD cash/pledge separation, partial/void receipts; document URLs are references; refund/audit/automatic renewals deferred |
| Sponsor Interests / opportunity references | interest_details; link tables; organizations/contacts/funding initiatives/opportunities/activities/tasks | save_interest atomic invoker RPC; sponsor_interests archive/restore; opportunities insert | Functional links/manual strength/archive rules; opportunity is reference metadata, not a full pipeline; currency/scoring pending |
| Programs / cohorts / recipients / enrollments | programs, program_cohorts, program_recipient_details, program_enrollment_details, program_summary | saveProgramRecord → corresponding table writes with program/cohort/affiliation checks | Functional records and exact known support; manual outcomes; field alignment and rates pending |
| Membership | membership_details, membershipOptions, related enrollment/history | memberships insert/update via saveMembership | Functional recorded terms and date statuses; fee/payment labels do not establish cash or entitlement; risk/score/attendance pending |
| Mentorship | mentorship_details, mentorship_checkins, org/contact/program/cohort options | mentorship_pairs/checkins insert/update via saveMentorship | Functional explicit pairing/check-ins; health/matching/cadence automation pending |
| Documents | documents under Internal/Admin-only RLS; creator/reference selections | documents insert/update via saveDocument | Metadata CRUD functional; registration is not binary upload/download; manual version is not file version history |
| Dashboard | organization/contact counts, organization stages/recent records, finance summary/receipts, action queue, memberships/pairs/interests/enrollments/activities | links to source workflows only | Defined counts/exact cash functional; charts/distributions presentational; no inferred engagement or health metrics |
| Reports: financial/sponsor | report-data: giving_summary + complete contribution_details/giving_receipts; source activities/opportunities/commitment dates | no report mutations; export route shares authenticated filtered loaders | Defined reconciliation/filter/export functional; historical pledge snapshots/pipeline rates/ROI pending |
| Reports: executive/scholarship/mentorship/membership | operational-report: complete org/contact/enrollment/membership/pair data + authorized option reads | same CSV path, no writes | Raw counts/known support functional; distributions presentational, undefined outcome/retention/risk rates explicit |
| Search / settings / login | api/search reads authorized module sources; auth.getUser + profiles; password Auth | password sign-in/sign-out only | Search/navigation/account access functional; create menu is navigation; role/account administration unavailable |

## Schema, access and integrity review

- Initial CRM + ownership + CRM fields: active-role `current_role`, read-only restricted staff directory, database owner validation/Staff ownership preservation, organization-primary-contact composite FK, technical URL/email constraints. Finance/Viewer are readers, Admin/Staff CRM writers. Browser profile role/activation writes remain denied.
- Activities: organization/contact link tables and atomic participant replacement; tasks use owner guard, invoker follow_ups status view, explicit Calgary date/RPC rules.
- Giving: Admin/Finance writers, four active-role readers; exact numeric columns, positive receipts, no client deletion; invoker views and existing summary semantics. No estimates join received cash.
- Interests: invoker RPC, organization affiliation FKs, typed Program links, Admin-only archive including direct API enforcement.
- Programs/Membership/Mentorship: composite FKs guard cohort/program and contact/organization relationships, immutable identifiers/creation and server timestamps; active Admin/Staff write.
- Documents: Internal versus Admin-only RLS, actor-derived creator and protected registration metadata. No new document projection is needed.
- Existing security-definer helpers have narrowly scoped purposes and fixed search paths; preserve them. Querying related metadata must never use a service key or widen staff-directory/profile access.
- Reviewed migrations cumulatively, rather than treating the permissive initial schema as the final policy. Runtime SQL/API/security verifiers must run independently of source review. No new schema, policy, grant or financial formula is proposed.

## Product direction and design system

Use relationship records as workspaces. Keep existing top-level routes: Relationships (Organizations, Contacts, Activities, Interests); Programs; Operations; Overview; Administration. Inside Organizations/Contacts use a single directory toolbar and a selectable list beside a record workspace. Mobile shows either list or selected record with an explicit return-to-results action. Selection/filter state belongs in the URL so refresh, direct links and browser history work.

Lead each record with identity, affiliation/stage, owner/context and actions. Activity and next action are primary; profile fields remain readily available; related finance/program/membership/mentorship/document workflows retain their existing routes and definitions. Keep unknown values explicit. Avoid empty KPI tiles. Preserve canonical full detail/edit links for every record.

Tokens for the reference surface: neutral white/slate, CBC navy structural navigation, purple selected/focus/action; 4/8/12/16/24 spacing; 14px body, 12px metadata, 16–20px section headings, 24px page title; 1px borders and modest 8px rounding. Use restrained status badges for recorded labels, clear dividers, tabular dates/counts and visible keyboard focus. List density must still provide 44px mobile targets. Keep styles scoped to the relationship surface, not another round of global overrides.

Quality references: [Attio](https://attio.com/) for connected relationship context and [Linear concepts](https://linear.app/docs/conceptual-model) for consistent work objects and navigation. These are design principles, not copied layouts, assets or business models.

## Prioritized implementation and acceptance

| Phase | Priority / IDs | Work | Acceptance |
|---|---|---|---|
| 0 Audit | P0, all reviewed IDs | baseline/source/access map and this plan | Completed before UI implementation; private screenshots and explicit functional limits |
| 1 Reference workspace | P0, REQ-001/002/005/008 | new `version3`; shared directory/list/detail composition; single search/filter/sort toolbar, pagination, selected record URL; focused timeline and related records; quick edits; contextual creation | Both entities support inspect several records without losing list/filter context; reload/back/direct-link and mobile results return work; duplicate identities remain distinct; canonical full workflows accessible |
| 2 Verification and handoff | P0, same IDs | real-local interaction tests, denied-role/direct API tests, failure/recovery, static/unit/SQL/API/advisor checks, before/after comparison | Quick saves persist and preserve unrelated data; invalid/failed/concurrent edits retain input; read-only roles cannot mutate; no hidden privileged metadata; keyboard and mobile pass, no console/runtime/overflow errors |
| 3 Extend after reference review | P1, REQ-003/004/009/010/011/012/014 | apply proven workspaces to operational records, scoped related queries, leaner section controls | Preserve each domain's parser, RLS and workflow; domain-specific tests and captures before claiming completion; future implementation, not included in first reference slice |
| 4 Broader refinement | P2, REQ-006/013/008 | consolidate global CSS/table API, request-level auth reuse, measured server paging/search, broader assistive-technology review | Performance measured first; all exports/financial semantics unchanged; no invented rates or taxonomy |

Per-phase delivery evidence belongs in `docs/delivery/version-3-verification.md`, `progress.md` and `demo-checklist.md`. Automated walkthroughs are not CBC sign-off. No hosted changes, branch merge or publication is authorized by this plan.

## Original screenshot samples

These are the immutable audit captures taken before application changes, using fictional local fixtures:

- [Organizations desktop](../../.local/cbc-demo/version-3/audit-before/organizations-desktop.png): redundant search/filter toolbars and mostly unused screen space.
- [Organization detail desktop](../../.local/cbc-demo/version-3/audit-before/organization-detail-desktop.png): profile grid before activity context.
- [Contacts mobile](../../.local/cbc-demo/version-3/audit-before/contacts-mobile.png): undefined summary metrics and wide generic table.

The later `before/` capture is a frozen Version 2 refresh against the same final dataset as `after/`; it does not replace the original audit evidence. The private comparison gallery also includes the new workspace, related-record and quick-edit states for both entities at desktop/mobile sizes.
