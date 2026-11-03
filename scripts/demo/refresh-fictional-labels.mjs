// REQ-008/013: local synthetic fixtures only. Rename legacy generic labels; never delete records.
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {sql,check,privateWrite,accounts,uuid} from './client.mjs';
export function refreshFictionalLabels(){
 check(sql("select count(*) from auth.users where email not like 'cbc-demo-%@example.test'")==='0','Refusing label maintenance with unrecognized local Auth identities.');
 const balance=()=>sql("select json_build_object('organizations',(select count(*) from public.organizations),'contacts',(select count(*) from public.contacts),'programs',(select count(*) from public.programs),'memberships',(select count(*) from public.memberships),'pairs',(select count(*) from public.mentorship_pairs),'documents',(select count(*) from public.documents),'contributions',(select count(*) from public.contributions),'receipt_count',(select count(*) from public.cash_receipts),'cash',(select coalesce(sum(amount),0)::text from public.cash_receipts where not is_void))");
 const before=balance(),admin=accounts().find(a=>a.role==='admin');check(admin,'Admin fixture identity missing.');
 sql(`begin;
 select set_config('request.jwt.claim.sub','${uuid(admin.id)}',true);
 set local role authenticated;
 update public.organizations set name=(array['Cedar Crest Partners','Willow River Ventures','Birch Meadow Consulting','Juniper Grove Enterprises','Blue Heron Collective','Maple Harbor Partners'])[get_byte(uuid_send(id),15)%6+1] where name~'^(Synthetic|Demo)';
 update public.contacts set first_name=(array['Aisha','Daniel','Imani','Leila','Amara','Noah'])[get_byte(uuid_send(id),15)%6+1],last_name=(array['Morgan','Mensah','Brooks','Bennett','Okafor','Reed'])[get_byte(uuid_send(id),15)%6+1] where first_name~'^(Synthetic|Demo)' or last_name~'^(Synthetic|Demo)';
 update public.programs set name=(array['Horizon Scholars Program','Launchpad Business Skills','Bright Path Leaders','Cedar Grove Career Network'])[get_byte(uuid_send(id),15)%4+1] where name~'^(Synthetic|Demo)';
 with candidates as(select id,'Autumn Leadership Cohort '||coalesce(year::text,'North')||' Group '||row_number() over(partition by program_id,year order by id)::text as label from public.program_cohorts where label~'^(Synthetic|Demo)')
 update public.program_cohorts c set label=x.label from candidates x where c.id=x.id;
 update public.program_recipients set name=(array['Maya Chen','Nia Adebayo','Imani Brooks','Alex Reed'])[get_byte(uuid_send(id),15)%4+1] where name~'^(Synthetic|Demo)';
 update public.program_enrollments set institution='Cedar Vale College' where institution~'^(Synthetic|Demo)';
 update public.tasks set description='Prepare a community partnership follow-up' where description~'^(Synthetic|Demo)';
 update public.documents set name=(array['Community Partnership Agreement','Scholarship Program Brief','Board Planning Notes','Mentorship Participation Guide'])[get_byte(uuid_send(id),15)%4+1] where name~'^(Synthetic|Demo)';
 update public.opportunities set name='Community Education Partnership' where name~'^(Synthetic|Demo)';
 update public.funding_initiatives set name=case when kind='Program' then 'Future Builders Scholarship' else 'Prairie Connections Reception' end where name~'^(Synthetic|Demo)';
 update public.activities set purpose='Partnership planning conversation' where purpose~'^(Synthetic|Demo)';
 update public.sponsor_interests set category='Education and business development' where category~'^(Synthetic|Demo)';
 update public.memberships set membership_type=case when member_organization_id is null then 'Individual' else 'Corporate' end where membership_type~'^(Synthetic|Demo)';
 commit;`);
 check(balance()===before,'Record counts or cash changed during label maintenance.');
 const remaining=sql("select (select count(*) from public.organizations where name~'^(Synthetic|Demo)')+(select count(*) from public.contacts where first_name~'^(Synthetic|Demo)' or last_name~'^(Synthetic|Demo)')+(select count(*) from public.programs where name~'^(Synthetic|Demo)')+(select count(*) from public.documents where name~'^(Synthetic|Demo)')");
 check(remaining==='0','Generic entity labels remain in local fixture directories.');
 privateWrite('fictional-label-verification.json' ,{recordAndCashCountsPreserved:true});
 console.log('Refreshed legacy local fixture labels with fictional names; record identities, links, counts and cash are preserved.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))refreshFictionalLabels();
