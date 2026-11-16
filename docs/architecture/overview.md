# Proposed conceptual architecture

> Historical planning/audit content below. Current observed architecture and operational limits: [release/recovery](release-and-recovery.md), [engineering findings](../audits/version3-engineering-remediation.md) and [executed verification](../delivery/version3-reliability-verification.md). Existing implementation does not settle CBC/instructor approval.


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
