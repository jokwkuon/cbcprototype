# Settings — REQ-008

Implemented for the synthetic local board demo under provisional ADR-018; CBC acceptance remains pending. Routes: `/settings`.

See [decision rules](../../project/decisions.md), [field matrix](../field-matrix.md), [coverage audit](../../delivery/field-coverage.csv) and [executed verification](../../delivery/progress.md). Tests: `board-completion.spec.ts`. Code presence alone is not runtime or CBC acceptance evidence.

Verified current identity, role, active status, actual operational/financial permissions and sign-out. User administration and password/email changes are explicitly unavailable; no sensitive environment configuration is exposed.
