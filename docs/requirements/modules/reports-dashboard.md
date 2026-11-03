# Reports & Dashboard — REQ-013/006/004/008

**Status:** Reports foundation, Financial Performance and Sponsor Relationship record subset implemented locally under ADR-012/015; exact verification in [progress](../../delivery/progress.md#reports-foundation). CBC report demonstration/acceptance remains pending. The executive dashboard is not completed by this slice.

## Routes and scope

`/reports` links Executive Performance (`executive`), Sponsor Relationship (`sponsor`), Scholarship Impact (`scholarship`), Mentorship (`mentorship`), Membership (`membership`) and Financial Performance (`financial`) under `/reports/[category]`. Executive, Scholarship, Mentorship and Membership categories show their specified topics and no fabricated totals. Sponsor Relationship has a record-based subset; its performance calculations remain pending. Shared desktop/mobile navigation enables Reports.

Financial Performance reuses `giving_summary`, `contribution_details` and `giving_receipts`, with shared summary/table components. Calendar year and optional organization filters apply to the labeled scope. Cash received, prior comparable cash and YoY use receipt dates/comparable periods; lifetime cash, active Cash pledged/outstanding and separately declared in-kind are all-time current values. The year filter does not reconstruct historical commitment balances. Void receipts never count as received cash; prospects/cancelled planning stages never create debt. Zero baseline has no percentage.

## Reconciliation and states

Read all ordered pages with exact counts. Failed, incomplete, duplicate or changing reads fail explicitly. Compare exact decimal cents for period/prior/lifetime cash and pledged/outstanding/in-kind totals against underlying records before rendering. Contribution received balances also reconcile to their receipts. Selected-period receipt rows and all-time contribution rows link to existing Giving details. No float summation or client-supplied totals.

Loading uses Next Suspense/loading UI without sample totals. Empty contributions, empty receipt periods and zero balances are distinct successful states. Errors show Financial report unavailable and a retry/reset link, with no zero fallback. Invalid periods/organizations are explicit errors, not silently widened filters. Separate queries are not a transactional snapshot; concurrent edits may require retry.

## Permissions and verification

Existing active Admin/Finance/Staff/Viewer reads are reused; no writer role or data grant changes. No service-role frontend access, migration, report framework, stored report or export is added. SQL/API/browser checks cover exact totals, dates, voids, cancelled/prospect/in-kind cases, year and organization scopes, empty/failed/loading states, pagination, source links and role boundaries. See progress/checklist for executed results; source presence is not manual CBC acceptance.

Event ROI, other category formulas, export, financial targets and production accounting reconciliation remain pending definitions. Existing ADR-012 finance rules are only accepted for the synthetic MVP.


## Sponsor Relationship continuation

After Financial verification, `/reports/sponsor` gained explicit organization selection, all recorded agreement/renewal dates, organization-linked interactions and opportunity name/reference links. All dates are raw evidence, including planned future dates. No automatic sponsor classification, period KPI, pipeline total, opportunity estimate/currency sum, renewal rate or risk score is calculated. No-selection, empty source groups, invalid filters and query failures are distinct; complete pagination and existing access rules are reused. Tests cover future manual dates, source links, scope/empty/error recovery and all four active reader roles.

## Board completion — 2026-11-02 (supersedes pending-category scope above)

Under ADR-016/017/018 all six categories now have actual accessible source records, relevant filters, explicit empty/error states and secure CSV subsets. Executive shows organization/contact counts plus clearly labeled independently global operational/finance panels; Program Impact shows distinct recipient/enrollment counts, exact known declared support and unknown counts; Membership shows recorded terms/provisional date statuses; Mentorship shows pair/check-in counts and raw latest feedback. Sponsor/Financial implementations and existing financial definitions remain intact. CSV shares authenticated query/filter code, quotes every cell, neutralizes formulas and uses private/no-store responses. Financial exports selected-period receipts; Sponsor exports commitment agreement dates; operational exports match displayed rows. Unsupported rates, scores, retention, pipeline and event ROI remain pending.

Dashboard now links to Membership, Mentorship, Interests, Programs and recent interactions, alongside existing CRM/action/finance panels. Status datasets and enrollment histories now paginate fully; a failed page is unavailable, not a partial count or zero. New fixture regressions force panel/report failures and verify recovery. New real-browser scenarios cover workflows, all four roles, filters, exports and Settings; executed results are in progress.
