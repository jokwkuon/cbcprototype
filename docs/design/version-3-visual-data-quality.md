# Version 3 visual and demo-data quality

2026-11-04 · REQ-001/002/004/005/006/008/009/010/011/012/013/014.
Branch: `feature/version3-visual-data-quality`, based on operational upgrade `b505120f2fb26c0509be2accf8f1cbefd86cd8d1`. This is an authorized local synthetic prototype improvement. CBC/instructor acceptance and production readiness remain separate gates. No migration, financial formula, pairing rule or permission was changed. No hosted changes or merge were performed.

## Source audit

| Finding | Source and consequence | Change |
|---|---|---|
| Body 14px, navigation 11.5px, table 12px, badges 10px | `app/globals.css`; dense information had little hierarchy | Body 16px, nav/labels/table 14px, metadata 12–13px, headings 20–32px, KPI values 30–36px |
| Status inferred from substring regex | `components/data-table-client.tsx`; arbitrary text could imply success, scheduled implied warning | Exact typed module maps in `lib/status-tone.ts`; unknown/missing labels stay neutral; partial receipts amber; scheduled blue |
| Repetitive white bordered sections | Shared CSS and dashboard | Navy overview metric and relationship identity header; purple selection/actions; distinct work and context surfaces; quiet secondary panels |
| Work queue preceded overview and repeated technical explanation | Dashboard and `action-queue.tsx` | Overview first; compact personalized upcoming work, readable scope tabs and concise empty state |
| Mentorship used another generic table | Mentorship page | Mentor/mentee roster with program/cohort, status, last check-in and next action; retained table option |
| Duplicate search/status controls | Membership, Mentorship, Documents, Giving, Programs, Interests | Disable redundant client-side filters where server filters already exist; table sorting/grouping retained |
| Large unsearchable multi-selects | `components/fields.tsx` | Search plus native keyboard/screen-reader selection; selected options remain visible; validation restores selected arrays |
| Canonical fixture reused one organization/two contacts | `scripts/demo/seed*.mjs` | Separate presentation fixture adds 13 organizations, 26 contacts, linked actions, terms, pairings, participants, receipts and distinct document names |
| Browser tests used `Date.now()` in names and retained created rows | Integration demo/interests/programs/membership/documents tests | Natural stable fictional labels; dedicated test stack and app port; regression config refuses the presentation API |
| Scale fixture used UUID/numeric display suffixes | `benchmark-operational.mjs` | Believable two-part fictional company names; query/run marker in industry/provenance; existing exact-ID finally cleanup retained |
| API verification uses random IDs and leaves fixtures | `verify-api/giving/interests/programs/membership/mentorship/documents/reports.mjs` | Run only against the isolated regression instance; these are test artifacts, not presentation records |
| Manual/old local records have incomplete provenance | Read-only local inventory | Exact IDs/notes recorded privately; no unknown record removed or merged |
| Saved CLI stack status shape differed | `stack.mjs` assumed `identity.id`, saved status used top-level `id` | Support both; validate endpoint env before replacing status; independent instance directories/ports |

No Jim screenshot attachment was present. The written navy/purple/white direction informed the implementation.

## Component and token system

`app/visual-system.css` defines the new surfaces and treatments; `globals.css` retains the shared base, with a larger type scale. `relationships.css` defines split-view identity/context styling. Existing record links, history, quick edit, server filtering and keyboard behavior remain available.

| Role | Foreground/action | Surface |
|---|---|---|
| Identity | White | Navy `#111B2E` |
| Primary action/selection | Purple `#7447E6`; hover `#6036CF` | Selected tint `#EFE8FF` |
| Main text | `#182238` | White / background `#F3F5FA` |
| Supporting text | `#526078` | White / cool neutral |
| Success | `#086447` | `#D9F5E8` |
| Warning | `#854609` | `#FFF0CB` |
| Critical/error | `#A32239` | `#FFE1E7` |
| Information | `#214FA8` | `#E1ECFF` |

Semantic badges use text plus a dot, stronger tints and consistent padding. Known status meaning is domain-specific, not inferred from an arbitrary substring. The contrast unit test checks normal-text AA (4.5:1) for nine token pairs, including primary buttons and all four semantic tones. It is not a claim of a complete accessibility certification. Visible focus, reduced-motion behavior, native controls and existing responsive navigation remain in place.

The dashboard highlights overview metrics, then upcoming work, receipts/relationship stages/renewals and operational/recent activity panels. Financial labels distinguish cash receipts, commitments, outstanding balances and in-kind values. Original exact decimal calculations and unknown/error handling are unchanged. Membership explicitly distinguishes overdue terms, current terms, scheduled terms and renewals within the existing 30-day view. Repeated terms retain their dates and references.

## Isolated fictional data

| Instance | Private directory | API / PostgreSQL | Purpose |
|---|---|---|---|
| Legacy | `.local/cbc-demo` | 54421 / 54422 | Existing synthetic records retained; read-only contamination review |
| Presentation | `.local/cbc-presentation` | 55421 / 55422 | Meeting dataset; never used by browser regressions |
| Test | `.local/cbc-test` | 56421 / 56422 | SQL/API/browser fixtures; integration app uses 3142 |

The added fixture has fixed IDs, believable fictional names, reserved `example.test` addresses and a fixed 2026-11-04 visual-demo date anchor. Canonical fixtures retain their existing Calgary-current-date boundary cases. Re-seeding is idempotent by identity and does not create duplicate presentation names. Activity IDs generated by the existing RPC are retained on repeat runs; fresh resets generate fresh activity/Auth identities. This is reproducible content, not a claim of byte-identical database dumps.

Final presentation inventory: 15 organizations, 29 contacts, nine membership terms, five pairings, six recipients, eight enrollments, 15 document records, ten contributions and six receipt records. The original Amara membership history and recipient enrollments remain separate legitimate records. The fixture includes unknown support/outcomes, in-kind support, unpaid/partial/fully received cash examples, cancelled/prospect commitments, current/scheduled/overdue terms and approaching renewals. It does not invent approved rates or Pair Health.

### Safe setup and repeatable reset

From repository root, use the existing installed dependencies:

```sh
CBC_DEMO_INSTANCE=presentation node scripts/demo/stack.mjs start
CBC_DEMO_INSTANCE=presentation node scripts/demo/stack.mjs migrate
CBC_DEMO_INSTANCE=presentation node scripts/demo/seed.mjs
CBC_DEMO_INSTANCE=presentation node scripts/demo/seed-visual.mjs
CBC_DEMO_INSTANCE=presentation node scripts/demo/reset-visual-data.mjs --seal
CBC_DEMO_INSTANCE=presentation CBC_DEMO_APP_PORT=3141 node scripts/demo/run.mjs
```

`--seal` is a one-time operation immediately after creating a known fresh fixture. It refuses to overwrite an existing seal. Never seal an unknown/manual dataset to bypass review. Generated Auth account details remain private in the selected instance's `accounts.json`.

Before any reset:

```sh
CBC_DEMO_INSTANCE=presentation node scripts/demo/reset-visual-data.mjs --dry-run
```

Review that instance's `reset-dry-run.json`: exact IDs/composite-row fingerprints and proposed removals. `--apply` locks all fixture tables and rechecks the sealed row fingerprints in the same transaction. Any added, missing or edited row aborts the reset. Legacy/hosted instances are refused. Auth identities, profiles and staff directory are retained. After a matching dry run, `--apply`, re-run both seed scripts and seal the fresh fixture. This full cycle was exercised successfully. A dry run after browser-created test additions was correctly refused without removing rows.

Initialize the `test` instance with start/migrate/canonical seed before running API/browser scripts. Do not run the visual seed there. Routine integration configuration defaults to `.local/cbc-test` and rejects any API port except 56421. Test artifacts remain confined to this disposable instance. Review and reset its own artifacts before repeat suites; the guarded reset intentionally refuses to silently adopt new rows. Performance cleanup deletes only IDs generated by its own run and its matching run marker.

### Contamination inventory

`audit-visual-data.mjs` is read-only. The legacy audit found 222 organizations, 55 contacts, 15 membership terms, 11 pairings, 21 documents, eight recipients and 30 contributions; 301 repeated-label/generated-suffix review entries across those tables. These are candidates, not 301 confirmed duplicate identities. Repeated contribution organization IDs, membership types, pair histories and enrollment identities are often legitimate.

The exact legacy record list, IDs, source notes and reasons are in `.local/cbc-demo/visual-data-audit.json`. Provenance that is not recorded remains unknown. Matching `Date.now()` suffixes trace to the browser sources above; scale-run markers trace to benchmark source; no matching label alone authorizes deletion. `proposedRemovals` is empty. Early additive showcase trial records in that legacy instance were also retained. No unknown/manual/hosted record was deleted. The clean presentation inventory and its exact reset proposal are separate private files under `.local/cbc-presentation`.

## Verification and visual evidence

See the delivery entry for exact final results. All screenshots use fictional local data; credentials and generated artifacts stay ignored and permission-restricted. The comparison gallery is `.local/cbc-presentation/visual-quality/comparison.html`, with desktop 1440×1000 and mobile 390×844 captures of every major module, six reports, detail/forms and relationship workspace/edit states. Before captures show the original local fixture; after captures show the clean expanded presentation fixture, so counts differ intentionally. Recreate final captures with `CBC_DEMO_INSTANCE=presentation node scripts/demo/review-visual.mjs` and the environment's Playwright browser/library paths when required. The runner builds, starts its own app on 3143, captures and stops that server.

## Remaining decisions and limits

Light theme is the deliverable; no decorative or partial dark-theme toggle was added. Binary file storage, approved Pair Health/retention/graduation/award formulas, student access and production confidentiality remain deferred. Existing finance, same-organization pairing and role rules are unchanged. Some technical detail remains on dedicated detail/report screens where it qualifies financial meaning; not every historical label was rewritten. No new destructive UI or business lifecycle was introduced. Full manual accessibility acceptance and named CBC/instructor approval remain outstanding. Source code, local verification and screenshots are separate from business approval.

## Meeting walkthrough

1. Open Dashboard. Read the overview, switch upcoming work to Team actions and open a due task.
2. Open Organizations and select Willowcrest Advisory. Review its navy identity header, primary contact, owner, last interaction and next steps. Use Quick edit, then Related records.
3. Open Imani Clarke and the linked interaction. Review its follow-up and return to Dashboard; use the assigned staff account for personalized work.
4. Open Giving. Compare Willowcrest's fully received cash with Northstar's partial receipt and Juniper Ridge's in-kind support. Open receipt history; no pledge is counted as received cash.
5. Open Financial report and export the same filtered source records. Open the source contribution to reconcile the value.
6. Show Membership warning/overdue/current badges and the dated Amara term history; then Mentorship roster and its table option.
7. Show Programs/Recipients, the explicit pending metrics and distinct linked document records. Repeat the organization selection/navigation at mobile width.
