-- REQ-008: receipt for the existing-hosted-baseline reconciliation on 2026-11-05 UTC.
-- Hosted history at this version contains the reviewed one-time adoption bundle
-- in database/hosted/reconcile-version3.sql, which applied the preceding canonical
-- increments atomically without replaying initial_crm or changing original values.
-- Fresh targets already receive those increments individually; no schema work is
-- needed here. Keep this receipt so local and hosted migration versions reconcile.
select true as hosted_reconciliation_receipt;
