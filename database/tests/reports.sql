-- REQ-013/004/008: existing Giving query contracts used by Financial Performance.
\set ON_ERROR_STOP on
begin;
create or replace function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$ begin if ok is not true then raise exception 'FAIL: %',label; end if; end $$;
create or replace function pg_temp.expect_error(statement text,expected text,label text) returns void language plpgsql as $$ begin begin execute statement; exception when others then if sqlstate=expected then return; end if; raise exception 'FAIL: % expected %, received %',label,expected,sqlstate; end; raise exception 'FAIL: % unexpectedly allowed',label; end $$;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
insert into public.organizations(id,name) values('b0000000-0000-4000-8000-000000000001','Synthetic Report Partner'),('b0000000-0000-4000-8000-000000000002','Synthetic Empty Report Partner');
insert into public.contributions(id,organization_id,contribution_date,amount,contribution_type,funding_status) values
('b1000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','2023-01-01',0.30,'Cash','Committed'),
('b1000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','2024-01-01',1.00,'Cash','Invoiced'),
('b1000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000001','2024-01-01',7,'In-Kind','Committed'),
('b1000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000001','2024-01-01',5,'Cash','Cancelled'),
('b1000000-0000-4000-8000-000000000005','b0000000-0000-4000-8000-000000000001','2024-01-01',9,'Cash','Prospect');
insert into public.cash_receipts(contribution_id,received_on,amount,is_void,void_reason) values
('b1000000-0000-4000-8000-000000000001','2024-12-31',0.10,false,null),
('b1000000-0000-4000-8000-000000000001','2025-01-01',0.20,false,null),
('b1000000-0000-4000-8000-000000000001','2025-01-01',99,true,'Synthetic void'),
('b1000000-0000-4000-8000-000000000004','2025-01-01',0.05,false,null);
select pg_temp.assert_true((public.giving_summary(2025,'b0000000-0000-4000-8000-000000000001')->>'annual_cash')::numeric=0.25,'report period uses received date not contribution date, excludes void and includes cancelled cash');
select pg_temp.assert_true((public.giving_summary(2024,'b0000000-0000-4000-8000-000000000001')->>'annual_cash')::numeric=0.10,'report period changes receipt sum');
select pg_temp.assert_true((public.giving_summary(2025,'b0000000-0000-4000-8000-000000000001')->>'pledged')::numeric=1.30 and (public.giving_summary(2025,'b0000000-0000-4000-8000-000000000001')->>'outstanding')::numeric=1.00,'active cash commitments differ from received cash; no prospect/cancelled debt');
select pg_temp.assert_true((public.giving_summary(2024,'b0000000-0000-4000-8000-000000000001')->>'pledged')=(public.giving_summary(2025,'b0000000-0000-4000-8000-000000000001')->>'pledged'),'pledged balance remains all-time when year changes');
select pg_temp.assert_true((public.giving_summary(2025,'b0000000-0000-4000-8000-000000000001')->>'in_kind_declared')::numeric=7,'in-kind separate from cash');
select pg_temp.assert_true((public.giving_summary(2025,'b0000000-0000-4000-8000-000000000001')->>'annual_cash')::numeric=(select sum(r.amount::numeric) from public.giving_receipts r join public.contribution_details c on c.id=r.contribution_id where c.organization_id='b0000000-0000-4000-8000-000000000001' and not r.is_void and r.received_on between '2025-01-01' and '2025-12-31'),'period ledger reconciles exact summary');
select pg_temp.assert_true((public.giving_summary(2025,'b0000000-0000-4000-8000-000000000001')->>'outstanding')::numeric=(select sum(outstanding::numeric) from public.contribution_details where organization_id='b0000000-0000-4000-8000-000000000001'),'all-time contribution balances reconcile');
select pg_temp.assert_true((public.giving_summary(2025,'b0000000-0000-4000-8000-000000000002')->>'annual_cash')::numeric=0 and (public.giving_summary(2025,'b0000000-0000-4000-8000-000000000002')->>'pledged')::numeric=0,'successful empty scope has genuine zero');
select pg_temp.expect_error($q$select public.giving_summary(0)$q$,'22023','invalid period is an error, not zero');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',false);
select pg_temp.assert_true((public.giving_summary(2025,'b0000000-0000-4000-8000-000000000001')->>'annual_cash')::numeric=0.25,'Finance report read unchanged');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
select pg_temp.assert_true((public.giving_summary(2025,'b0000000-0000-4000-8000-000000000001')->>'annual_cash')::numeric=0.25,'Staff report read unchanged');
with changed as(update public.contributions set amount=999 where id='b1000000-0000-4000-8000-000000000001' returning id) select pg_temp.assert_true((select count(*)=0 from changed),'Staff report cannot mutate financial records');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',false);
select pg_temp.assert_true((public.giving_summary(2025,'b0000000-0000-4000-8000-000000000001')->>'annual_cash')::numeric=0.25,'Viewer report read unchanged');
with changed as(update public.cash_receipts set amount=999 where contribution_id='b1000000-0000-4000-8000-000000000001' returning id) select pg_temp.assert_true((select count(*)=0 from changed),'Viewer report cannot mutate receipts');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',false);
select pg_temp.assert_true((select count(*)=0 from public.giving_receipts),'inactive cannot read report ledger');
reset role;set role anon;
select pg_temp.expect_error($q$select * from public.giving_receipts$q$,'42501','anonymous cannot read report ledger');
select pg_temp.expect_error($q$select public.giving_summary(2025)$q$,'42501','anonymous cannot execute report summary');
reset role;rollback;
