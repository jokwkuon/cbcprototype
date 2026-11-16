# Version 2 verification and handoff

Branch `version-2`, baseline `feature/mvp-foundation` at `e0e864eae90e5726f1a06c7289dea5d1b5ebf1ec`. Version 1 remains unchanged. Local synthetic scope only; no merge/push/deployment/hosted database change.

The [design and complete screen inventory](../design/version-2.md) describes all redesigned pages and shared nested workflows. All 133 architecture fields retain their existing representations and business limits: 125 complete demo fields, two partial and six pending-definition displays. UX work does not turn those pending formulas or binary file storage into functional metrics/features.

## Executed checks

| Command | Result |
|---|---|
| `npm test --prefix apps/frontend` | PASS: 30 tests, including exact monthly cash and Calgary/DST/calendar-date formatting |
| `npm run typecheck --prefix apps/frontend` | PASS |
| `npm run lint --prefix apps/frontend` | PASS |
| `npm run test:integration --prefix apps/frontend` | PASS: 43 real-Supabase Chromium scenarios; original workflows plus sorting/grouping/paging, guided forms, feedback, keyboard/mobile navigation and search denial |
| `npm run test:e2e --prefix apps/frontend` | PASS: 33 fixture-browser scenarios, including record CRUD, dashboard/report failure states and responsive navigation |
| Production build | PASS during real and fixture browser builds and preview launch |
| `node scripts/demo/verify-database.mjs` | PASS: 279 SQL assertions on fresh PostgreSQL 17; ten unchanged canonical migrations/RLS audit |
| `node scripts/demo/verify-api.mjs` | PASS: 20 real Auth/PostgREST checks |
| `node scripts/demo/verify-giving.mjs` | PASS: 39 |
| `node scripts/demo/verify-interests.mjs` | PASS: 59 |
| `node scripts/demo/verify-programs.mjs` | PASS: 68 |
| `node scripts/demo/verify-reports.mjs` | PASS: 70 |
| `node scripts/demo/verify-membership.mjs` | PASS: 32 |
| `node scripts/demo/verify-mentorship.mjs` | PASS: 25 |
| `node scripts/demo/verify-documents.mjs` | PASS: 22; total 335 API checks |
| `node scripts/demo/check-repeatability.mjs` | PASS: two migration/seed replays, stable canonical and fixture identity counts |
| `node scripts/demo/stack.mjs audit` and `node scripts/demo/audit.mjs` | PASS: zero local advisor findings |
| `node scripts/demo/readiness.test.mjs` | PASS: three endpoint/manifest/private-credential guards |

The local CLI originally resolved a different managed stack after the Git branch changed. The helper now pins the saved local stack ID and validates an explicit loopback database URL/port for migrations/advisors. It still rejects hosted targets and never logs connection credentials. No migration or database permission/business rule was changed to resolve this tooling issue.

Tests were updated for intentionally changed UI patterns, not to remove behavior checks: explicit mobile drawer opening, scoped profile assertions, local date/CAD display, filtering paginated related records and deliberate forged-option tests where dependent selectors now prevent normal invalid selection. A real optional-selection loss after validation feedback was fixed and rerun. Initial hydration differences and horizontal containment issues were identified by actual screenshots and corrected before final evidence.

## Visual and accessibility evidence

Before/after evidence covers desktop 1440×1000 and mobile 390×844 for every major module, all six reports, primary relationship details, guided forms and login. Final manifests contain 50 before and 50 after screenshots (desktop/mobile). The final Version 2 capture reports zero runtime errors, zero console errors and zero document-overflow screens. Visual inspection covered dashboard, financial report (mobile) and membership form (mobile). React hydration warnings found during capture were resolved by using stable, semantic HTML for the monthly chart; zero warnings were verified across all captured screens. Artifacts remain ignored and private; no credentials, real CBC records or architecture PDF are included.

Keyboard checks cover Ctrl/Cmd K, arrow navigation, Escape, native menu controls, form cancellation and visible focus. Tables expose captions, scoped headings and sort state; forms have programmatic labels and required/error descriptions. Navigation has a skip link/current-page state and reduced-motion CSS. Visual review covers actual renders and viewport overflow; this is an accessibility-basics pass, not a formal WCAG certification or assistive-technology audit.

No redesign functionality is intentionally deferred. Existing business limits remain: binary upload/download, undefined engagement/health/risk/outcome/retention/ROI calculations, production account administration, accounting/refund/audit policies and CBC/instructor/manual acceptance. Separate hosted/public deployment and any merge or push still require authorization.
