# CBC Relationship & Impact Management Prototype

**Status: locally verified synthetic prototype on `feature/mvp-foundation`; not a production deployment or an accepted complete board demo.**

The repository began as a planning scaffold for Calgary Black Chambers (CBC) and a proposed Bow Valley College student project. It now contains a Next.js frontend, Supabase PostgreSQL migrations, and synthetic verification tooling. Existing implementation does not settle the open CBC/instructor scope, stack, term or student deliverable decisions.

## Current capabilities

- Organizations and Contacts: create/edit/search, explicit affiliations and primary contacts, restricted relationship ownership, linked histories.
- Activities & Follow-Ups: interactions, multiple participants/tasks, completion/reopening, Calgary due dates, Last Contact and an action queue.
- Sponsorship & Giving: separate pledges/receipts, partial payments, void corrections, CAD cash summaries, manual renewals and document reference links.
- Sponsor Interests: priorities, explicit program/discussion/opportunity/task links, inherited restricted owner and Admin archive/restore.
- Programs & Recipients: program/cohort/recipient/enrollment create/detail/edit, education and manual outcomes, scoped distinct participant/enrollment counts and exact known support totals. Linked-contact interactions, Last Contact and explicitly eligible person-wide alumni giving are supported. Program/cohort filters normalize on the server and clear incompatible cohorts in the browser.
- Dashboard: basic CRM counts/status/recent records, action queue and giving summary. Failed queries display unavailable states; successful zero counts remain zero.

Permissions are enforced in the database as well as the UI. Verification uses synthetic fixtures and real **local** Supabase Auth/PostgREST; it does not establish hosted deployment or CBC acceptance.

## Coverage and gaps

The [133-row field audit](docs/delivery/field-coverage.csv) records **90 represented fields**, **88 with verified working demo behavior**, including **one partial field**, and **19 calculated fields** (an overlapping subset). Thus 87 fields are fully functional within the documented demo scope. **46 fields have deferred whole-field behavior**: 43 absent, two placeholders and one partial classification. Other limitations, including manual renewal instead of automation, are recorded separately.

Mentorship, Membership, Documents, Reports and Settings remain unavailable as full navigation destinations. Six report categories and much of the specified executive dashboard still need representation. Global search, importer, email/calendar integrations, full audit history, production financial reconciliation and approved outcome/health/risk calculations remain deferred. Document links do not provide file storage or enforce access to external files.

See [current verification, counting definitions and blockers](docs/delivery/progress.md#current-field-audit). The 133 detailed fields exclude directory-only metrics, dashboard panels, reports and Settings; 90/133 is not whole-board completion.

## Run and verify locally

Use the guarded [local Supabase setup](docs/delivery/hosted-integration-readiness.md) and [frontend instructions](apps/frontend/README.md). From the repository root:

```sh
node scripts/demo/prepare.mjs
node scripts/demo/stack.mjs start
node scripts/demo/stack.mjs migrate
node scripts/demo/seed.mjs
node scripts/demo/run.mjs
```

These helpers target the isolated local synthetic environment. Generated credentials stay in ignored, permission-restricted `.local/cbc-demo` files; never copy them into tracked files. Do not apply migrations to an existing hosted project without operator review and separate authorization.

Verification: frontend `npm test`, `npm run typecheck`, `npm run lint`, production build, `npm run test:e2e` and `npm run test:integration`; root `node scripts/demo/verify-database.mjs`, `verify-api.mjs`, `verify-giving.mjs`, `verify-interests.mjs` and `verify-programs.mjs`. Browser suites rebuild the production app and must run sequentially. Required browser-runtime setup and exact executed results are in the linked delivery notes.

## Planning and traceability

- [Requirements register](docs/requirements/register.csv) and [decisions](docs/project/decisions.md): scope and approval authority.
- [Field matrix](docs/requirements/field-matrix.md) and [data model](docs/architecture/data-model.md): source-page and schema traceability.
- [Scope](docs/project/scope.md), [charter](docs/project/charter.md), [module inventory](docs/requirements/module-matrix.md), [demo checklist](docs/delivery/demo-checklist.md).

Code lives in `apps/frontend`; canonical schema changes in `database/migrations`; locked review-only designs in `database/proposals`; local verification helpers in `scripts/demo`; planning and delivery records in `docs`.

## Data and publication policy

This is a public repository. Commit synthetic records only: no live CBC records, private documents, confidential screenshots, credentials or tokens. The architecture PDF is absent from the current tree; its historical Git exposure still requires a repository-owner decision before publication. No history remediation or publication is authorized by local implementation work.
