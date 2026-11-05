-- REQ-005/008: same active-role SELECT predicate, evaluated once per statement.
-- No grant/role/ownership/financial/lifecycle change. No data rewrite.
-- Measured local 10k relationship workload exposed repeated profile lookups.
begin;
set local lock_timeout='5s';
alter policy "active CRM readers see activities" on public.activities
 using ((select public.current_role()) in ('admin','staff','finance','viewer'));
commit;
