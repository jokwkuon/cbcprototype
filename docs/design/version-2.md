# CBC Version 2 product experience

REQ-001/002/003/004/005/006/008/009/010/011/012/013/014. Explicit owner authorization: complete local frontend redesign on `version-2`, retaining Version 1 at `e0e864eae90e5726f1a06c7289dea5d1b5ebf1ec`. No merge, push, deployment, hosted Supabase change or database migration is authorized or performed.

## Design and interaction choices

The requested [Attio](https://attio.com/) relationship patterns and [Linear](https://linear.app/) navigation quality informed a compact, contextual workspace rather than a copy of either interface. CBC's name, navy navigation and purple accent remain. System typography avoids a runtime font dependency. White surfaces, restrained borders, consistent SVG icons, readable secondary text, focus rings and reduced-motion support establish one visual language.

Navigation groups Overview, Relationships, Programs, Operations and Administration. Desktop navigation collapses; mobile uses an explicit drawer. Active routes are identified with `aria-current`. The header has a real keyboard-search dialog (Ctrl/Cmd K, arrow navigation, Escape), a role-aware create menu and account/settings/sign-out access. Search is a no-store authenticated read using the existing RLS permissions; it cannot reveal Admin-only document metadata to Staff or anonymous users.

Directory tables share filtering, column sorting, exact decimal sorting where provided, grouping by meaningful categories, page-size/paging controls, accessible column headers/captions, row menus and contextual empty states. Original values remain separate from server-formatted display values, avoiding Node/browser Intl hydration differences. Wide tables scroll inside their container on mobile; the document itself must not overflow.

Guided forms group identity/context, relationships/ownership, scheduling, financial information and notes. They preserve original parser/actions/database enforcement. Required labels, hints, inline errors, sticky save/cancel actions, saving states, successful-save notifications and unsaved-change protection make state visible. Membership has an explicit person/corporate choice. Pairings and enrollments filter cohorts by program; contacts/opportunities filter by affiliation. Validation feedback retains optional selections and multiselect histories. Forged incompatible inputs remain covered by SQL/API/browser negative tests.

Record overviews use identity/status headers, contextual actions and related evidence. Organization/contact pages combine profile, contacts, activity timelines, follow-ups, giving, interests/programs and accessible membership/mentorship/document links. Repeated names are distinguished with source context and compact record references. No profile-directory or financial privilege was widened.

Dashboard charts use reconciled receipt records and existing relationship-stage labels. Monthly cash is summed with exact cents after the original report query has excluded voids and scoped receipt dates. Prior comparable cash and current pledged/outstanding balances retain their original definitions. A historical commitment trend is unavailable and is explicitly not inferred. Renewals, tasks, memberships, programs/recipients, interests, mentorship and recent interactions link to underlying records. Query failures never become zero metrics.

All six reports retain their source/filter/CSV authorization paths, adding summary panels, record-label distributions and paginated drill-down tables. Raw label counts are not success rates or scores. Exports include the entire authorized server-filtered dataset across table pages; local grouping/sorting is presentation only. Unsupported rates, health/risk/pipeline/ROI and event attendance remain explicitly pending.

## Duplicate investigation

Named seed records use fixed UUIDs; two migration/seed replays verify their stable counts. Repeated organization/person labels in the local dataset came from distinct historical browser/API-created records and the finite fictional-name catalog used to replace old generic labels. Repeated membership terms, cohort enrollments and mentor pairings are also distinct source records. Equal names are not a safe deduplication key. No rows were deleted, hidden or merged to make the screenshots appear cleaner. Tables show references, affiliation, dates and source context and support grouping/filtering. Canonical seed replay does not create duplicate fixture identities.

## Screen inventory

- Login, workspace shell, loading skeletons and error/retry state.
- Executive dashboard and its finance, relationships, renewal, follow-up and activity views.
- Organizations and Contacts: directories, create/edit forms and connected overviews.
- Activities & Follow-Ups: directory, activity create/edit/detail and action create/edit flows.
- Sponsor Interests: directory, create/edit/detail, archive/restore and opportunity reference create/detail.
- Programs & Recipients: program directory/catalog, recipients/cohorts directories, program/recipient/cohort/enrollment details and their create/edit flows.
- Membership: directory, search/renewal scope, person/corporate create, edit and term history/detail.
- Mentorship: directory, pairing create/edit/detail, related history and check-in create/edit/history.
- Sponsorship & Giving: directory, commitment create/edit/detail, receipt entry/correction and document reference forms.
- Documents: metadata directory, create/edit/detail and classification/provenance presentation.
- Reports: landing, Executive Performance, Sponsor Relationship, Scholarship Impact, Mentorship, Membership and Financial Performance with existing secure CSV subsets.
- Settings: current account, actual permissions, available sign-out and clearly unavailable administration.

Shared components apply the redesign to nested forms and detail routes rather than replacing working flows with mockups. No large UI/chart dependency was added. Mutation actions, ten canonical migrations, RLS and financial/business definitions are preserved.

## Comparison and rollback

The frozen Version 1 source is archived privately from the exact baseline commit (frontend files only; no architecture PDF), built in an ignored local directory and served separately. Both previews use the same local synthetic database and Auth project; signing out can affect the shared session. The baseline branch is not switched, amended or rebuilt in place by this process.

```sh
# Version 2 — from this branch
node scripts/demo/stack.mjs start
node scripts/demo/run.mjs
# In a separate terminal, frozen Version 1
node scripts/demo/run-version-1.mjs
```

Version 2: http://localhost:3140/login. Version 1: http://localhost:3141/login. Credentials remain in the private `.local/cbc-demo/accounts.json`; no passwords are published. Returning to the Version 1 branch requires a clean working tree and `git switch feature/mvp-foundation`; never reset/discard work or merge without authorization.

Visual evidence is private under `.local/cbc-demo/version-2/`: original before/after PNGs, capture manifests and `comparison.html`. It contains fictional local fixtures only and is not staged. The capture guard rejects non-demo ports and final after-captures fail on runtime/console errors or document overflow. See [delivery evidence](../delivery/version-2-verification.md) for exact executed results.
