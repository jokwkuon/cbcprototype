-- REQ-004/005/008: fictional restore-only records, never hosted/demo seeding.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
insert into public.organizations(id,name,notes) values('c1000000-0000-4000-8000-000000000001','Cedar Harbour Foundation','Fictional recovery rehearsal only');
insert into public.contacts(id,organization_id,first_name,last_name,email) values('c2000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','Nadia','Hartwell','nadia.hartwell@example.test');
insert into public.activities(id,organization_id,occurred_at,activity_type,purpose) values('c3000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','2020-01-01T12:00:00Z','Call','Review the community mentorship proposal');
insert into public.activity_contacts(activity_id,contact_id) values('c3000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000001');
insert into public.tasks(activity_id,description,due_date) values('c3000000-0000-4000-8000-000000000001','Prepare the partnership briefing','2020-01-02');
insert into public.contributions(id,organization_id,contribution_date,amount,contribution_type) values('c4000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','2020-01-01',200.20,'Cash');
insert into public.cash_receipts(contribution_id,received_on,amount,is_void,void_reason) values
('c4000000-0000-4000-8000-000000000001','2020-01-02',60.05,false,null),
('c4000000-0000-4000-8000-000000000001','2020-01-03',40.05,false,null),
('c4000000-0000-4000-8000-000000000001','2020-01-04',10.10,true,'Duplicate receipt corrected in the fictional recovery example');
