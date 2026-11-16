# Documents — REQ-012/008

Implemented for the synthetic local board demo under provisional ADR-018; CBC acceptance remains pending. Routes: `/documents, /documents/new, /documents/[id], /documents/[id]/edit`.

See [decision rules](../../project/decisions.md), [field matrix](../field-matrix.md), [coverage audit](../../delivery/field-coverage.csv) and [executed verification](../../delivery/progress.md). Tests: `board-completion.sql; verify-documents.mjs; board-completion.spec.ts`. Code presence alone is not runtime or CBC acceptance evidence.

Working metadata list/search/create/detail/edit, classifications, explicit source links and protected registration/update provenance. Binary upload/download is deferred; timestamps do not claim an actual file upload. Internal versus Admin only metadata access is enforced in RLS.
