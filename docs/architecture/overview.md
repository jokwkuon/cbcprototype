# Proposed conceptual architecture

```text
WordPress          Legacy HubSpot          Finance exports          Google Drive
(public site)      (contacts / forms)      (small CSV or JSON)      (documents)
    |                    |                        |                      |
    +-- optional --+-----+------ approved batch import / references -----------+
                   |
              validate / map / stage
                   |
             relational database
                   |
          app API / business rules (Track B)
                   |
             staff web UI / reporting
```

## Major technical components
- **UI:** forms, directories, pipeline, dashboard and charts
- **Backend:** CRUD endpoints, validation, permissions, business rules
- **Database:** relational schema, constraints, source record identifiers
- **Analytics:** approved KPI queries and exports
- **Security:** least-privilege accounts, restricted datasets, auditability
- **Infrastructure:** hosting, secrets, migrations, backups, monitoring
- **Testing:** database, import, unit, integration, E2E and acceptance

Prefer a modular monolith if the team selects Track B. Data volume is small; complexity comes from workflows and permissions.
