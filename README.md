# CBC Relationship & Impact Management System

**Status: pre-project planning scaffold — not a deployed application.**

Calgary Black Chambers (CBC) / proposed Bow Valley College student project. Term and April target await instructor confirmation.

## Project objective
Translate the *CBC Database Architecture 2026* field guide into an achievable academic-term deliverable, with requirements, data definitions, milestone demos, acceptance criteria, and a maintainable technical handoff.

## Start here
- [Scope and two MVP tracks](docs/project/scope.md)
- [Project charter](docs/project/charter.md)
- [Instructor meeting agenda](docs/delivery/instructor-meeting.md)
- [Requirements register](docs/requirements/register.csv)
- [Business module inventory](docs/requirements/module-matrix.md)
- [Data source inventory](docs/data/source-inventory.csv)
- [Delivery milestones](docs/delivery/milestones.md)
- [Open decisions](docs/project/decisions.md)

## Current CBC environment (reported; unverified)
- **WordPress** public website and possibly forms
- **HubSpot** legacy companies, contacts and form activity, freshness unknown
- **Google Workspace / Drive** identities, email, directories and documents
- **Finance department** small data exports/analytics, to be gathered as CSV or JSON

## Suggested project architecture
Small relational database (PostgreSQL proposed), controlled import of reviewed small datasets, optional web application, and approved KPI queries/dashboard. No need to introduce streaming or data-warehouse infrastructure without a demonstrated reason.

## Repository layout
```text
docs/
  project/         charter, scope, roles, decisions
  requirements/    stakeholder intake, module worksheets and traceability
  architecture/    high-level design, ERD, stack candidates, security
  data/            inventory, data dictionary, mapping and KPI formulas
  delivery/        milestones, instructor agenda, acceptance and handoff
  meetings/        meeting note template
data/samples/      synthetic fixtures only
apps/              empty frontend/backend workspaces
database/          empty migration/SQL workspaces
analytics/         empty queries/dashboards
integrations/      empty importer workspace
tests/             empty unit/integration/e2e workspaces
.github/           issue/PR templates
```

## Data policy
**This repository is public.** Never commit actual CBC contacts, financial data, participant details, private reports, passwords, API keys or source documents without explicit permission and an appropriate secure arrangement. Use synthetic test records. Do not use live credentials in issues, pull requests or AI prompts.

The architecture document is referenced but intentionally not included.
