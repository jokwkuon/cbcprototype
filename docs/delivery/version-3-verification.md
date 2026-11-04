# Version 3 reference implementation evidence

REQ-001/002/005/008. New branch `version3`, based on `2803dba` (`version-2`, tracking remote `version2`). Local synthetic scope only. No migration, RLS, grant, financial definition, hosted Supabase change, branch merge or push.

Review commits: audit `076138c`; implementation/tests/comparison helpers `04994b1`.

## Phase 0: audit

Completed before application implementation: [audit, query/mutation map, design system and prioritized acceptance plan](../design/version-3-audit.md). Reviewed all major page families and ten canonical migrations cumulatively. Classified supported operations, partial workflows and presentation-only controls separately. Attio/Linear informed connected context and consistent navigation; no assets or business model copied.

Original audit evidence is preserved privately at `.local/cbc-demo/version-3/audit-before/`: 50 desktop/mobile screenshots, zero page errors, console errors or document overflow. This original dataset predates interaction-test fixture additions. A frozen frontend archive of `2803dba` (frontend only, no architecture PDF) provides a fresh comparison against the same current local database on port 3141.

## Phase 1: Organizations and Contacts

- Single search/filter toolbar with optional name ordering/grouping. Search includes identity, affiliation/context and record reference; stage or organization filter combines with it. URL state preserves filters, page and explicit selection across refresh/history. Separate identities always retain distinct references, even when names repeat.
- Desktop shows results beside an automatically previewed record; explicit selection is linkable. Mobile starts with results and opens one record with Back to results. Native links, arrow/Home/End list navigation, `/` search focus, keyboard tabs, focus rings and native modal focus containment support keyboard use.
- Record workspace leads with identity/owner, actions, open follow-ups and a dated timeline. Three open tasks appear initially, with remaining/completed tasks accessible in disclosures. All source interactions and follow-up editing remain reachable. Profile includes original manual fields and explicit unresolved definitions; Related records exposes scoped authorized Giving, Programs, Membership, Mentorship, Documents and organization Interests links.
- Quick-edit dialogs save only explicit allowed fields through the existing domain parser and cookie-authenticated Supabase client. Server checks active role independently. A conditional `updated_at` write detects stale/concurrent edits; failures retain input. Ownership, financial values, identity/affiliation and other omitted fields are never overwritten by the quick-edit patch. Full record editors remain available.
- Add contact and Log an interaction carry explicit organization/person context. Target IDs are validated and checked against authorized selections. Existing activity save/participant RPC and contact/organization FK enforcement are unchanged. Contact interactions inherit that person's current affiliation without restricting the existing cross-organization participant workflow.
- Canonical detail/edit routes and original financial/source histories remain intact, with quick edit/contextual creation added. Source-history anchors include membership and mentorship. New relationship CSS is isolated in `relationships.css`; shared legacy table/report styling is unchanged.

Runtime evidence and remaining issues are recorded below after verification. Code presence alone is not acceptance.

## Reproduce the local comparison

```sh
# Version 3, terminal 1
node scripts/demo/stack.mjs start
node scripts/demo/run.mjs
# Frozen Version 2, terminal 2 (same local synthetic database)
node scripts/demo/run-version-2.mjs
# With the existing local Chromium/runtime configured:
CBC_CAPTURE_PORT=3141 node scripts/demo/capture-version3.mjs before
node scripts/demo/capture-version3.mjs after
node scripts/demo/comparison-version3.mjs
```

Credentials remain private in `.local/cbc-demo/accounts.json`. Captures and the standalone `comparison.html` remain ignored/private. The scripts reject non-demo ports and validate the local API endpoint; the after capture fails on runtime/console/hydration errors or document overflow. Do not build two previews into the same `.next` directory; the frozen baseline uses its own ignored source/build directory.

## Remaining boundaries

Only Organizations and Contacts receive the reference workspace in this slice. Broader module redesign, whole-app CSS consolidation, request-level auth deduplication, server-side directory paging and capped legacy form-option/history loaders remain prioritized follow-up work. New relationship histories and related lists use complete reads; very large ID sets still warrant measured query/batching work. Existing manual classification and undefined health/risk/engagement/outcome/retention/ROI rules remain unchanged. Binary document storage and production administration remain unavailable.

Screenshots and browser interaction checks are engineering/demo evidence. A human CBC/instructor walkthrough, approval of provisional operational conventions and wider production/stack requirements remain pending. No formal assistive-technology or WCAG certification is claimed.

## Phase 2: executed automated verification — 2026-11-04

| Command / evidence | Final executed result |
|---|---|
| `npm test --prefix apps/frontend` | PASS: 30 unit/validation tests; existing parsers, dates and exact cash behavior |
| `npm run typecheck --prefix apps/frontend` | PASS |
| `npm run lint --prefix apps/frontend` | PASS |
| `npm run test:integration --prefix apps/frontend` with local Chromium/runtime configured | PASS: all 51 real-Supabase Chromium scenarios in the final full run; private copy `version-3/real-browser-verification.json` |
| `npm run test:e2e --prefix apps/frontend` with local Chromium/runtime configured | PASS: all 36 fixture-browser scenarios in the final full run, including deliberate slow reads, failed saves, retained input, retry and successful recovery |
| `node scripts/demo/verify-database.mjs` | PASS: 279 SQL assertions in a fresh PostgreSQL 17 database; ten canonical migrations/checksums, cumulative RLS and integrity checks |
| `node scripts/demo/verify-api.mjs` | PASS: 20 real Auth/PostgREST checks |
| `node scripts/demo/stack.mjs audit`; `node scripts/demo/audit.mjs` | PASS: zero local advisor findings |
| `node scripts/demo/readiness.test.mjs` | PASS: three endpoint/manifest/private-artifact guards |
| Production build / preview | PASS: final local production rebuild; preview at port 3140 uses real local Supabase, frozen Version 2 at port 3141 |
| `git diff --check` and screenshot helper syntax checks | PASS |

The real suite adds nine Version 3 scenarios and replaces the old Version 2 directory-only scenario with stronger directory/workspace interactions. It verifies paging/grouping/order/search, reload/history, selected-row deep links, empty/malformed/missing states, quick-edit persistence and untouched fields, server validation, stale updates, unsaved-edit dismissal, contextual creation, source records, keyboard/mobile navigation, role-sensitive actions/documents and a captured Server Action replay under a Viewer session. A forged ownership input is ignored by the narrow patch; the Viewer replay returns a role error and leaves the record timestamp unchanged. Existing role/financial/module workflows remain in the full suite.

Controlled failure/slow-query tests use the synthetic HTTP fixture; they do not stand in for real RLS verification. Its timestamps now model the existing database defaults/update trigger so stale-write behavior can be exercised meaningfully. All real-local and fixture browser scenarios are separately accounted for.

Failures found and corrected before the final passing runs: accessible search input naming; keeping quick-edit defaults/input after action feedback; mounting modal fields only when open; a test clicking before pagination completed; selected-row paging versus deliberate sort/filter resets; and mobile canonical-header action wrapping. The old fixture directory locator was updated for context-bearing list links without removing its create/edit/validation assertions. Existing middleware deprecation, Node module-type and test color-environment warnings remain; no dependency/framework upgrade was made.

Local review-label maintenance removed timestamp suffixes left by older browser-created fictional entities and normalized test industry descriptions. It changed display text only, preserved identities/links/counts/cash and deleted no records. New Version 3 fixtures use a shared UUID prefix for test isolation/search while their names/descriptions remain natural. Both comparison versions read the same normalized dataset; equal names continue to represent separate referenced records.

## Final visual comparison and demonstration

Both final captures passed: **62 before + 62 after screenshots**, covering all major modules/six reports plus Organization/Contact workspaces, related records and editors at 1440×1000 and 390×844. Each manifest reports zero runtime errors, console/hydration errors and document-overflow screens. The after capture was repeated after fixing the two canonical mobile action-header overflows; the final result is zero.

Private [comparison gallery](../../.local/cbc-demo/version-3/comparison.html), [before manifest](../../.local/cbc-demo/version-3/before/manifest.json) and [after manifest](../../.local/cbc-demo/version-3/after/manifest.json). Original audit captures remain in `audit-before/`. Visual inspection included Organizations/Contacts directories, Organization workspace desktop/mobile, Contact related records mobile, quick-edit mobile and the corrected canonical Organization detail mobile. All screenshots contain fictional local fixtures. No screenshots, keys, passwords, archive or private source artifacts are staged.

Demonstrate Version 3 at http://localhost:3140/organizations or http://localhost:3140/contacts. For the named canonical relationship use `/organizations?selected=60000000-0000-4000-8000-000000000001` and `/contacts?selected=61000000-0000-4000-8000-000000000001`. Frozen Version 2 remains at http://localhost:3141/login. Human CBC/instructor acceptance is still pending; broader module rollout follows the audit plan after review.
