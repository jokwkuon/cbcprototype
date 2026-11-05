# Version 3 visual/data-quality verification

2026-11-04 · `feature/version3-visual-data-quality` · REQ-001/002/004/005/006/008/009/010/011/012/013/014.

Implementation and audit: [design, data provenance, safe reset and meeting walkthrough](../design/version-3-visual-data-quality.md).

## Runtime and automated results

| Check | Result | Evidence |
|---|---|---|
| Unit tests | 32 passed | `npm --prefix apps/frontend test`; private `.local/cbc-presentation/unit-results.log` |
| Text contrast | Nine foreground/background token pairs meet 4.5:1 | Included in the unit suite; buttons, secondary text and semantic badges |
| SQL integrity/RLS | 285 assertions passed | `CBC_DEMO_INSTANCE=test node scripts/demo/verify-database.mjs`; private test instance `database-assertions.json` and `database-verification.json` |
| Auth/API | 335 checks passed | Core 20; Giving 39; Interests 59; Programs 68; Membership 32; Mentorship 25; Documents 22; Reports 70 |
| Real integration browser suite | 52 passed | Dedicated test API 56421; app 3142; private `.local/cbc-test/browser-verification.json` |
| Final Giving/Membership/Reports recheck | 17 passed | Targeted real integration invocation after cash-label and renewal-badge refinements |
| Synthetic API browser suite | 37 passed | `npm --prefix apps/frontend run test:e2e`; includes failed-query, empty-state, loading, permission, form and navigation paths |
| Lint | Passed | `npm --prefix apps/frontend run lint` |
| Typecheck | Passed | `npm --prefix apps/frontend run typecheck` |
| Production build | Passed | Final presentation review runner builds using local API 55421 |
| Clean fixture | Passed | `verify-visual.mjs`: nine exact table counts, unique organization/contact identities, no generated numeric organization suffixes, five exact financial balances |
| Scale fixture | 2,500 fictional organizations; cleanup passed | Directory: one query, ten returned rows, p95 18.17ms; global search: six rows, p95 15.12ms; seven local samples, not a production SLA |
| Reset/reseed | Passed | Sealed ID/fingerprint dry run, transactionally locked apply, canonical/visual reseed and reseal |
| Reset guard | Expected refusal, no deletions | Test-created additions differ from the pre-test seal; private test `reset-dry-run.json` |
| Screenshots | 62 before + 62 after | 1440×1000 and 390×844, all major modules, all six reports, representative forms/details, split-view related/quick-edit states; zero runtime errors, console errors or body overflow |

The main real browser walkthrough passed: create Organization → linked Contact → participant Interaction → assigned Follow-up → Dashboard queue → completion. Giving create/edit/receipt/correction and report source/CSV reconciliation are separate passing tests in the same suite. Read-only Finance/Viewer and anonymous/inactive boundaries remain covered. No privileged frontend or export endpoint was introduced.

Earlier failures were investigated and corrected, then rerun: searchable multi-select validation lost selected arrays; the direct-action replay test used a hardcoded old app port; a repeated-label archive assertion incorrectly expected the whole search to become empty; moving the queue initially hid it when unrelated relationship queries failed. The corrected failure-state synthetic suite passed all 37 cases. The archive check now identifies the exact created record instead of assuming the label is unique. Repeating the entire suite on retained test artifacts also exposed ambiguous label selectors and a task-history timeout; the final full result is from a reset, reviewed test-only fixture. These failures did not pollute the presentation instance.

Non-failing toolchain notices remain: Next middleware-to-proxy deprecation, Node typeless-package notices in strip-types tests, and test-runner colour-environment notices. No dependency upgrade or unrelated middleware migration was included.

## Visual and demo evidence

The private gallery is `.local/cbc-presentation/visual-quality/comparison.html`. It contains 124 screenshot links. It is not uploaded or staged. Each screenshot is fictional local data, with restricted file permissions. The baseline used the prior local fixture; final screenshots use the clean presentation fixture, so counts legitimately differ.

Visual review covers desktop/mobile dashboard, organizations, contacts, activities, interests, programs, mentorship, membership, giving, documents, settings, report overview and all six reports; representative forms and quick-edit/related-record states were also inspected. Visual inspection caught squeezed identity columns and awkward year-over-year wrapping despite zero body overflow; minimum readable table widths and grouped financial summary rows corrected both. Review checks include section separation, active navigation, readable type, semantic badges, mobile stacking, horizontal table scrolling, and financial/unknown-value wording. Full manual screen-reader and assistive-technology acceptance remains pending; token contrast and keyboard regressions do not replace that review.

Final fixture reconciliation (CAD): cash received in 2026 **3,650.00**, lifetime cash **3,850.00**, active cash commitments **6,700.00**, outstanding **2,850.00**, separately declared in-kind **1,300.00**. Values come from the unchanged summary RPC, compared with exact cent arithmetic. The dataset includes genuine separate terms/enrollments and unknown amounts/outcomes.

## Approval and remaining limits

CBC/instructor business and stack acceptance remain open. No merge, hosted mutation, deployment, history rewrite, production-readiness claim or source-PDF republication occurred. The optional dark theme is deferred. Documents remain metadata only. Undefined program rates, award classifications, Pair Health and other pending business metrics remain explicitly unavailable. Unknown legacy/manual records were inventoried and retained; no heuristic deduplication was applied.
