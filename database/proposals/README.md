# Remaining CRM entities — review-only migration draft

REQ-003/004/005/006/009–013. The SQL here is deliberately outside `database/migrations/`. It prepares 29 small relational entities and typed links in an unexposed `cbc_demo_draft` schema. All tables have RLS enabled, no policies, and no anonymous/authenticated privileges. No app depends on this draft; it is not a working module.

Open decisions remain in `docs/architecture/data-model.md`: Finance must resolve the canonical contribution/commitment/receipt model and currencies; program/person reuse, membership lifecycle, document storage/access, lookup values, task deadlines and KPI definitions need review. No calculated amounts, statuses, health or renewal formulas are encoded. Agreement renewal remains pending because its source rule is unspecified. Settings has no source field guide; no invented settings schema is included.

The draft reuses contacts as synthetic person identities and has an exclusive contact/organization membership holder; these are review proposals, not approved domain rules. Promote only approved slices into future migrations, then add least-privilege operation policies and tests before connecting UI. Never expose this schema to the Data API as a shortcut.
