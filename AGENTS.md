# Instructions for contributors and coding agents
- Treat this as a planning scaffold, not a functioning product.
- Use docs/requirements/register.csv and docs/project/decisions.md as scope/decision sources.
- Do not implement unstated business rules or fabricate approved KPI formulas.
- Never add live CBC records, private documents, screenshots with personal details, credentials or tokens to this public repository.
- Use synthetic test fixtures only.
- Do not choose a stack without the instructor's student skill and deliverable requirements.
- Use small, understandable relational components; avoid unnecessary microservices or distributed data engineering.
- Reference requirement IDs in issues and PRs.
- Definition of done: implementation + automated verification + demo + documentation + relevant CBC approval.

## Board-demo foundation
- Before reading the architecture PDF, copy it to a permission-restricted local reference directory outside the repository (for example `/tmp/cbc-reference`, directory mode 700, files mode 600). Keep extracted text/images there too. Never stage the PDF or its extracted artifacts.
- The architecture PDF is already tracked at the time of the 2026-10-26 audit. Do not interpret that as permission to republish it. Resolve removal and any history remediation with the repository owner before publication; do not rewrite history without authorization.
- Use `docs/requirements/field-matrix.md` for physical PDF page and field traceability, and `docs/architecture/data-model.md` for existing versus proposed mappings.
- The board-demo target represents every specified page and field, including fields whose calculation is pending. Label unresolved derived values explicitly; do not fabricate totals or approved rules.
- A source-code inspection establishes code presence only. Record runtime evidence, automated verification, demo evidence and CBC approval separately in `docs/delivery/progress.md` and `docs/delivery/demo-checklist.md`.
- Existing Next.js/Supabase code is an observed implementation, not evidence that ADR-002/003 or student requirements were approved. Reconcile scope and stack decisions with CBC/instructor before expanding implementation.
- Planning-only tasks must not modify migrations or application code. Follow the prioritized plan and requirement IDs before taking an implementation slice.
