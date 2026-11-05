# CBC Relationship & Impact Management Prototype

**Status: Version 3 synthetic prototype; reliability work on `feature/version3-reliability-operations`. Production use, CBC acceptance and instructor stack approval remain open.**

Current engineering record: [remediation](docs/audits/version3-engineering-remediation.md), [executed verification](docs/delivery/version3-reliability-verification.md), [release and recovery](docs/architecture/release-and-recovery.md), [access proposal](docs/architecture/access-matrix-proposal.md), [audit/import/storage proposals](docs/architecture/audit-and-import-proposals.md). Historical delivery notes remain evidence of their original checkpoints.

The repository began as a planning scaffold for Calgary Black Chambers (CBC) and a proposed Bow Valley College student project. It now contains a Next.js frontend, Supabase PostgreSQL migrations, and synthetic verification tooling. Existing implementation does not settle the open CBC/instructor scope, stack, term or student deliverable decisions.

## Current capabilities

- Organizations and Contacts: create/edit/search, explicit affiliations and primary contacts, restricted relationship ownership, linked histories.
- Activities & Follow-Ups: interactions, multiple participants/tasks, completion/reopening, Calgary due dates, Last Contact and an action queue.
- Sponsorship & Giving: separate pledges/receipts, partial payments, void corrections, CAD cash summaries, manual renewals and document reference links.
- Sponsor Interests: priorities, explicit program/discussion/opportunity/task links, inherited restricted owner and Admin archive/restore.
- Programs & Recipients: program/cohort/recipient/enrollment create/detail/edit, education and manual outcomes, scoped distinct participant/enrollment counts and exact known support totals. Linked-contact interactions, Last Contact and explicitly eligible person-wide alumni giving are supported. Program/cohort filters normalize on the server and clear incompatible cohorts in the browser.
- Membership: contact/corporate terms, validated affiliations, manual fees/payments, provisional date status, history and upcoming renewals.
- Mentorship: organization/program/cohort-bound pairs, manual lifecycle, check-in history/counts/latest raw feedback, issues and next actions.
- Documents: protected metadata CRUD and Internal/Admin-only access; binary files deferred. Settings displays the actual account, role and implemented permissions.
- Dashboard: CRM, actions, finance, interests, programs/recipients, membership/renewals, mentorship and recent interactions. Failed queries display unavailable states; successful zero counts remain zero.
- Reports: all six categories query source records with relevant filters, supported counts/exact money, source links and permission-preserving CSV subsets. Advanced undefined metrics remain pending.

Permissions are enforced in the database as well as the UI. Verification uses synthetic fixtures and real **local** Supabase Auth/PostgREST; it does not establish hosted deployment or CBC acceptance.

## Coverage and gaps

The [133-row field audit](docs/delivery/field-coverage.csv) records **133 represented**, **127 with working behavior**, **125 complete within demo scope**, **two partial** and **six pending definitions**. The calculated subset is 25; explicit links/server metadata do not inflate that count. PRO-13 remains partial engagement classification; DOC-06 records metadata registration without binary upload.

Pending: event attendance, field alignment, pair health, engagement score and renewal risk. Global search is bounded and permission-aware. Actual imports/integrations, full immutable audit history, production accounting/refunds, payment collection, automatic renewal and other undefined outcome/retention/ROI formulas remain deferred. No file was uploaded by metadata registration. CBC/instructor acceptance and hosted deployment are separate gates.

Version 2 redesign inventory and actual local/browser verification are documented in [design notes](docs/design/version-2.md) and [verification evidence](docs/delivery/version-2-verification.md). Comparison screenshots are private under ignored `.local/cbc-demo/version-2/` and are not published. See [current verification and counting definitions](docs/delivery/progress.md#current-field-audit), [board walkthrough](docs/delivery/board-demo-walkthrough.md) and [separate hosted plan](docs/delivery/hosted-demo-deployment-plan.md). The 133 denominator excludes directory-only metrics, dashboard/report panels and Settings.

## Run and verify locally

Use the guarded [local Supabase setup](docs/delivery/hosted-integration-readiness.md) and [frontend instructions](apps/frontend/README.md). From the repository root:

```sh
CBC_DEMO_INSTANCE=presentation node scripts/demo/stack.mjs start
CBC_DEMO_INSTANCE=presentation node scripts/demo/stack.mjs migrate
# Seed only the intended fictional instance; preserve any existing presentation seal.
CBC_DEMO_INSTANCE=presentation node scripts/demo/seed.mjs
CBC_DEMO_INSTANCE=presentation node scripts/demo/run.mjs
```

These helpers target the isolated local synthetic environment. Generated credentials stay in ignored, permission-restricted `.local/cbc-demo` files; never copy them into tracked files. Do not apply migrations to an existing hosted project without operator review and separate authorization.

Verification: frontend `npm test`, `npm run typecheck`, `npm run lint`, production build, `npm run test:e2e` and `npm run test:integration`; root `node scripts/demo/verify-database.mjs`, `verify-api.mjs`, `verify-giving.mjs`, `verify-interests.mjs`, `verify-programs.mjs`, `verify-reports.mjs`, `verify-membership.mjs`, `verify-mentorship.mjs` and `verify-documents.mjs`. Browser suites rebuild the production app and must run sequentially. Required browser-runtime setup and exact executed results are in the linked delivery notes.

## Planning and traceability

- [Requirements register](docs/requirements/register.csv) and [decisions](docs/project/decisions.md): scope and approval authority.
- [Field matrix](docs/requirements/field-matrix.md) and [data model](docs/architecture/data-model.md): source-page and schema traceability.
- [Scope](docs/project/scope.md), [charter](docs/project/charter.md), [module inventory](docs/requirements/module-matrix.md), [demo checklist](docs/delivery/demo-checklist.md).

Code lives in `apps/frontend`; canonical schema changes in `database/migrations`; locked review-only designs in `database/proposals`; local verification helpers in `scripts/demo`; planning and delivery records in `docs`.

## Data and publication policy

This is a public repository. Commit synthetic records only: no live CBC records, private documents, confidential screenshots, credentials or tokens. The architecture PDF is already tracked; that is not permission to republish it. Its removal and historical Git exposure require a repository-owner decision before publication. No history remediation or publication is authorized by local implementation work.


Open `http://localhost:3140/login`. Presentation credentials are private in `.local/cbc-presentation/accounts.json`; passwords are never published here. All named people and organizations are fictional examples.
