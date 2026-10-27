-- Synthetic identities only. No passwords or tokens. Used in disposable test database.
insert into auth.users(id,email,raw_user_meta_data) values
('10000000-0000-4000-8000-000000000001','admin@example.test','{"full_name":"Demo Admin"}'),
('10000000-0000-4000-8000-000000000002','staff-a@example.test','{"full_name":"Demo Staff A"}'),
('10000000-0000-4000-8000-000000000003','staff-b@example.test','{"full_name":"Demo Staff B"}'),
('10000000-0000-4000-8000-000000000004','finance@example.test','{"full_name":"Demo Finance"}'),
('10000000-0000-4000-8000-000000000005','viewer@example.test','{"full_name":"Demo Viewer"}'),
('10000000-0000-4000-8000-000000000006','inactive@example.test','{"full_name":"Demo Inactive Staff"}');
update public.profiles set role = case right(id::text,1) when '1' then 'admin'::public.app_role when '4' then 'finance'::public.app_role when '5' then 'viewer'::public.app_role else 'staff'::public.app_role end;
update public.profiles set is_active=false where id='10000000-0000-4000-8000-000000000006';
