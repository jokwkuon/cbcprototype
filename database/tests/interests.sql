\set ON_ERROR_STOP on
-- REQ-014/003/005/008: synthetic fixtures only; independent of application validation.
create function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$ begin if ok is not true then raise exception 'FAIL: %',label; end if; end $$;
create function pg_temp.expect_error(statement text,expected text,label text) returns void language plpgsql as $$ begin begin execute statement; exception when others then if sqlstate=expected then return; end if; raise exception 'FAIL: % expected %, received %',label,expected,sqlstate; end; raise exception 'FAIL: % unexpectedly allowed',label; end $$;
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
set role authenticated;
insert into public.organizations(id,name) values('80000000-0000-4000-8000-000000000001','Alder Grove Consulting'),('80000000-0000-4000-8000-000000000002','Juniper Meadow Partners');
insert into public.contacts(id,organization_id,first_name,last_name) values('81000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000001','Amara','Okafor'),('81000000-0000-4000-8000-000000000002','80000000-0000-4000-8000-000000000002','Leila','Bennett');
update public.organizations set relationship_owner='10000000-0000-4000-8000-000000000002' where id='80000000-0000-4000-8000-000000000001';
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
insert into public.opportunities(id,organization_id,name,estimated_amount) values('82000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000001','Future Builders Partnership',123.45),('82000000-0000-4000-8000-000000000002','80000000-0000-4000-8000-000000000002','Juniper Community Partnership',null);
insert into public.activities(id,organization_id,occurred_at,activity_type,purpose) values
('83000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000001','2020-01-01','Meeting','Initial partnership conversation'),
('83000000-0000-4000-8000-000000000002','80000000-0000-4000-8000-000000000001','2021-01-01','Meeting','Education partnership review'),
('83000000-0000-4000-8000-000000000003','80000000-0000-4000-8000-000000000001','2021-01-01','Meeting','Mentor recruitment planning'),
('83000000-0000-4000-8000-000000000004','80000000-0000-4000-8000-000000000001','2099-01-01','Meeting','Upcoming partnership meeting'),
('83000000-0000-4000-8000-000000000005','80000000-0000-4000-8000-000000000001','2025-01-01','Meeting','Community outreach discussion');
insert into public.tasks(id,activity_id,description,due_date,completed_at) values
('84000000-0000-4000-8000-000000000001','83000000-0000-4000-8000-000000000001','Prepare partnership brief',null,null),
('84000000-0000-4000-8000-000000000002','83000000-0000-4000-8000-000000000001','Send scholarship proposal','2020-02-01',null),
('84000000-0000-4000-8000-000000000003','83000000-0000-4000-8000-000000000001','Confirm mentor introductions','2020-02-01',null),
('84000000-0000-4000-8000-000000000004','83000000-0000-4000-8000-000000000001','Send thank-you message','2020-01-01',now());
insert into public.sponsor_interests(id,organization_id,primary_contact_id,opportunity_id,category,strength,notes,created_at) values('85000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001','82000000-0000-4000-8000-000000000001','Education and youth leadership','Manual emerging','Discuss scholarship and career pathways','1900-01-01');
select pg_temp.assert_true((select created_at>'2020-01-01' from public.sponsor_interests where id='85000000-0000-4000-8000-000000000001'),'server owns creation timestamp');
create temp table original_time as select created_at from public.sponsor_interests where id='85000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select primary_contact_name='Amara Okafor' and opportunity_name='Future Builders Partnership' and opportunity_amount='123.45' and owner_name='Jordan Ellis' from public.interest_details where id='85000000-0000-4000-8000-000000000001'),'linked fields and inherited restricted owner');
select pg_temp.assert_true((select last_discussed is null and next_action is null and programs='[]' from public.interest_details where id='85000000-0000-4000-8000-000000000001'),'no links yields no fabricated history');
insert into public.interest_activities select '85000000-0000-4000-8000-000000000001',id from public.activities where id::text like '83000000%' and id<>'83000000-0000-4000-8000-000000000005';
insert into public.interest_tasks select '85000000-0000-4000-8000-000000000001',id from public.tasks where id::text like '84000000%';
insert into public.interest_programs(interest_id,program_id) values('85000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001');
select pg_temp.assert_true((select last_discussion_id='83000000-0000-4000-8000-000000000002' and last_discussed='2021-01-01' from public.interest_details where id='85000000-0000-4000-8000-000000000001'),'past explicit discussions only; stable tie; future and unrelated excluded');
select pg_temp.assert_true((select next_task_id='84000000-0000-4000-8000-000000000002' and programs->0->>'name'='Future Builders Scholarship' from public.interest_details where id='85000000-0000-4000-8000-000000000001'),'next explicit action skips complete and undated; stable due tie; program alignment');
update public.tasks set completed_at=now() where id in ('84000000-0000-4000-8000-000000000002','84000000-0000-4000-8000-000000000003');
select pg_temp.assert_true((select next_task_id='84000000-0000-4000-8000-000000000001' from public.interest_details where id='85000000-0000-4000-8000-000000000001'),'undated open action follows completed dated actions');
select pg_temp.expect_error($q$update public.sponsor_interests set primary_contact_id='81000000-0000-4000-8000-000000000002' where id='85000000-0000-4000-8000-000000000001'$q$,'23503','cross-organization contact denied');
select pg_temp.expect_error($q$update public.sponsor_interests set opportunity_id='82000000-0000-4000-8000-000000000002' where id='85000000-0000-4000-8000-000000000001'$q$,'23503','cross-organization opportunity denied');
select pg_temp.expect_error($q$update public.sponsor_interests set organization_id='80000000-0000-4000-8000-000000000002' where id='85000000-0000-4000-8000-000000000001'$q$,'23503','organization change cannot invalidate contact/opportunity');
select pg_temp.expect_error($q$update public.contacts set organization_id='80000000-0000-4000-8000-000000000002' where id='81000000-0000-4000-8000-000000000001'$q$,'23503','contact cannot reparent behind interest');
select pg_temp.expect_error($q$update public.opportunities set organization_id='80000000-0000-4000-8000-000000000002' where id='82000000-0000-4000-8000-000000000001'$q$,'23503','opportunity cannot reparent behind interest');
select pg_temp.expect_error($q$insert into public.sponsor_interests(organization_id,category) values(null,'Amara')$q$,'23502','organization mandatory');
select pg_temp.expect_error($q$insert into public.sponsor_interests(organization_id,category) values('80000000-0000-4000-8000-000000000001','  ')$q$,'23514','blank category denied');
select pg_temp.expect_error($q$insert into public.interest_programs(interest_id,program_id) values('85000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000002')$q$,'23503','event is not a program');
select pg_temp.expect_error($q$update public.sponsor_interests set id=gen_random_uuid() where id='85000000-0000-4000-8000-000000000001'$q$,'23514','identity immutable');
select pg_temp.expect_error($q$update public.sponsor_interests set archived_at=now() where id='85000000-0000-4000-8000-000000000001'$q$,'42501','staff cannot archive directly');
select pg_temp.expect_error($q$insert into public.sponsor_interests(organization_id,category,archived_at) values('80000000-0000-4000-8000-000000000001','Community partnership',now())$q$,'42501','staff cannot create archived');
select pg_temp.expect_error($q$delete from public.sponsor_interests where id='85000000-0000-4000-8000-000000000001'$q$,'42501','staff cannot hard delete');
select pg_temp.expect_error($q$select public.save_interest('85000000-0000-4000-8000-000000000001','{"organization_id":"80000000-0000-4000-8000-000000000001","category":"SHOULD ROLLBACK"}',array['70000000-0000-4000-8000-000000000002']::uuid[],array[]::uuid[],array[]::uuid[])$q$,'23503','invalid program rolls back atomic save');
select pg_temp.assert_true((select category='Education and youth leadership' and (select count(*) from public.interest_activities where interest_id=i.id)=4 from public.sponsor_interests i where id='85000000-0000-4000-8000-000000000001'),'failed save preserves record and prior links');
select public.save_interest('85000000-0000-4000-8000-000000000001','{"organization_id":"80000000-0000-4000-8000-000000000001","category":"Small business development","strength":"Custom manual"}',array[]::uuid[],array['83000000-0000-4000-8000-000000000001','83000000-0000-4000-8000-000000000001']::uuid[],array[]::uuid[]);
select pg_temp.assert_true((select category='Small business development' and strength='Custom manual' and primary_contact_id is null and opportunity_id is null and programs='[]' and next_action is null from public.interest_details where id='85000000-0000-4000-8000-000000000001'),'staff edits all fields and clears optional links');
select pg_temp.assert_true((select count(*)=1 from public.interest_activities where interest_id='85000000-0000-4000-8000-000000000001'),'duplicate discussion IDs deduplicated');
update public.sponsor_interests set created_at='1900-01-01',updated_at='1900-01-01' where id='85000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select i.created_at=t.created_at and i.updated_at>'2020-01-01' from public.sponsor_interests i cross join original_time t where id='85000000-0000-4000-8000-000000000001'),'creation preserved; update maintained by server');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
update public.sponsor_interests set archived_at=now() where id='85000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select archived_at is not null from public.sponsor_interests where id='85000000-0000-4000-8000-000000000001'),'admin archives');
select pg_temp.expect_error($q$delete from public.sponsor_interests where id='85000000-0000-4000-8000-000000000001'$q$,'42501','admin cannot hard delete');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
select pg_temp.expect_error($q$update public.sponsor_interests set archived_at=null where id='85000000-0000-4000-8000-000000000001'$q$,'42501','staff cannot restore');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',false);
select pg_temp.assert_true((select count(*)=1 from public.interest_details),'finance reads archived interests');
select pg_temp.assert_true((select owner_name='Assigned staff member (directory restricted or inactive)' from public.interest_details),'finance does not receive restricted staff label');
select pg_temp.expect_error($q$insert into public.sponsor_interests(organization_id,category) values('80000000-0000-4000-8000-000000000001','Denied')$q$,'42501','finance cannot create');
select pg_temp.expect_error($q$select public.save_interest(null,'{}',array[]::uuid[],array[]::uuid[],array[]::uuid[])$q$,'42501','finance cannot invoke writer RPC');
with changes as(update public.sponsor_interests set notes='Denied' returning *) select pg_temp.assert_true((select count(*)=0 from changes),'finance updates no rows');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',false);
select pg_temp.assert_true((select count(*)=1 from public.interest_details),'viewer reads interests');
select pg_temp.expect_error($q$insert into public.interest_tasks(interest_id,task_id) values('85000000-0000-4000-8000-000000000001','84000000-0000-4000-8000-000000000001')$q$,'42501','viewer cannot change links');
with changes as(delete from public.interest_activities returning *) select pg_temp.assert_true((select count(*)=0 from changes),'viewer cannot remove discussions');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',false);
select pg_temp.assert_true((select count(*)=0 from public.interest_details),'inactive profile cannot read');
select pg_temp.expect_error($q$select public.save_interest(null,'{}',array[]::uuid[],array[]::uuid[],array[]::uuid[])$q$,'42501','inactive cannot write');
reset role; set role anon;
select pg_temp.expect_error($q$select * from public.interest_details$q$,'42501','anonymous cannot read');
select pg_temp.expect_error($q$select public.save_interest(null,'{}',array[]::uuid[],array[]::uuid[],array[]::uuid[])$q$,'42501','anonymous cannot invoke RPC');
reset role;
