\set ON_ERROR_STOP on
-- REQ-009/008; disposable synthetic fixtures only.
create or replace function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$ begin if ok is not true then raise exception 'FAIL: %',label; end if; end $$;
create or replace function pg_temp.expect_error(statement text,expected text,label text) returns void language plpgsql as $$ begin begin execute statement; exception when others then if sqlstate=expected then return; end if; raise exception 'FAIL: % expected %, received %',label,expected,sqlstate; end; raise exception 'FAIL: % unexpectedly allowed',label; end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
set role authenticated;
insert into public.memberships(id,contact_id,organization_id,membership_type,start_date,renewal_date,fee) values('b0000000-0000-4000-8000-000000000001','96000000-0000-4000-8000-000000000001','95000000-0000-4000-8000-000000000001','Synthetic SQL',public.activity_today()-365,public.activity_today(),0.10);
select pg_temp.assert_true((select status='Current term' and fee='0.10' from public.membership_details where id='b0000000-0000-4000-8000-000000000001'),'renewal today is current; exact decimal');
update public.memberships set renewal_date=public.activity_today()-1 where id='b0000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select status='Renewal overdue' from public.membership_details where id='b0000000-0000-4000-8000-000000000001'),'renewal yesterday overdue');
select pg_temp.expect_error($q$update public.memberships set organization_id='95000000-0000-4000-8000-000000000002' where id='b0000000-0000-4000-8000-000000000001'$q$,'23503','reject cross organization');
select pg_temp.expect_error($q$update public.contacts set organization_id='95000000-0000-4000-8000-000000000002' where id='96000000-0000-4000-8000-000000000001'$q$,'23503','reject target reparenting');
select pg_temp.expect_error($q$update public.memberships set member_organization_id='95000000-0000-4000-8000-000000000001' where id='b0000000-0000-4000-8000-000000000001'$q$,'23514','reject both identities');
select pg_temp.expect_error($q$update public.memberships set contact_id=null where id='b0000000-0000-4000-8000-000000000001'$q$,'23514','reject no identity');
select pg_temp.expect_error($q$update public.memberships set fee='NaN' where id='b0000000-0000-4000-8000-000000000001'$q$,'23514','reject NaN');
select pg_temp.expect_error($q$update public.memberships set fee=0.001 where id='b0000000-0000-4000-8000-000000000001'$q$,'23514','reject precision');
select pg_temp.expect_error($q$update public.memberships set renewal_date=start_date-1 where id='b0000000-0000-4000-8000-000000000001'$q$,'23514','reject chronology');
select pg_temp.expect_error($q$delete from public.memberships where id='b0000000-0000-4000-8000-000000000001'$q$,'42501','no delete grant');
reset role;
