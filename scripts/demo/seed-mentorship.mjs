import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {local} from './prepare.mjs';
import {login,check,privateWrite} from './client.mjs';
export async function seedMentorship(){
 const c=await login('admin'),b=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8')),p=JSON.parse(readFileSync(resolve(local,'program-records.json'),'utf8'));
 const pairId='c0000000-0000-4000-8000-000000000001',checkinId='c1000000-0000-4000-8000-000000000001';
 check(!(await c.from('mentorship_pairs').upsert({id:pairId,organization_id:b.organizationId,mentor_id:b.contactIds[0],mentee_id:b.contactIds[1],program_id:p.programIds[0],cohort_id:p.cohortIds[0],start_date:'2020-01-01',target_end_date:null,status:'Active',checkin_frequency:'Monthly (manual)',issues:'Discuss scheduling availability',next_action:'Schedule the next mentoring conversation',action_due_date:b.calendarDate})).error,'Pair seed failed.');
 check(!(await c.from('mentorship_checkins').upsert({id:checkinId,pair_id:pairId,checked_in_on:'2020-02-01',mentor_satisfaction:'The conversation was productive',mentee_satisfaction:'Would appreciate help preparing a business plan',feedback:'Reviewed goals and agreed on next steps',issues:'Send the business-plan template before the next check-in'})).error,'Check-in seed failed.');privateWrite('mentorship-records.json',{pairId,checkinId});
}
