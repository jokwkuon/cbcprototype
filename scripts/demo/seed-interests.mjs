import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {local} from './prepare.mjs';
import {login,check,privateWrite} from './client.mjs';
export async function seedInterests(){
 const c=await login('admin'),base=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8')),giving=JSON.parse(readFileSync(resolve(local,'giving-records.json'),'utf8'));
 const opportunityId='67000000-0000-4000-8000-000000000001',interestId='68000000-0000-4000-8000-000000000001',discussionId='69000000-0000-4000-8000-000000000001';
 check(!(await c.from('opportunities').upsert({id:opportunityId,organization_id:base.organizationId,name:'Future Builders Partnership',estimated_amount:'1234.56'})).error,'Interest opportunity seed failed.');
 check(!(await c.from('activities').upsert({id:discussionId,organization_id:base.organizationId,occurred_at:'2021-07-15T14:30:00Z',activity_type:'Meeting',purpose:'Education partnership discussion'})).error,'Interest discussion seed failed.');
 const otherOrganizationId='60000000-0000-4000-8000-000000000014',otherContactId='61000000-0000-4000-8000-000000000014',otherOpportunityId='67000000-0000-4000-8000-000000000014';
 check(!(await c.from('organizations').upsert({id:otherOrganizationId,name:'Aspen Bridge Consulting'})).error,'Other interest organization seed failed.');
 check(!(await c.from('contacts').upsert({id:otherContactId,organization_id:otherOrganizationId,first_name:'Leila',last_name:'Bennett'})).error,'Other interest contact seed failed.');
 check(!(await c.from('opportunities').upsert({id:otherOpportunityId,organization_id:otherOrganizationId,name:'Aspen Bridge Community Partnership'})).error,'Other interest opportunity seed failed.');
 const values={organization_id:base.organizationId,primary_contact_id:base.contactIds[0],opportunity_id:opportunityId,category:'Education and youth leadership',strength:'Manually assessed: strong',notes:'Synthetic interest only. No automatic scoring.'};
 check(!(await c.from('sponsor_interests').upsert({id:interestId,...values,archived_at:null})).error,'Interest identity seed failed.');
 check(!(await c.rpc('save_interest',{p_id:interestId,p_values:values,p_programs:[giving.programId],p_activities:[base.activityId,discussionId],p_tasks:['62000000-0000-4000-8000-000000000001','62000000-0000-4000-8000-000000000002','62000000-0000-4000-8000-000000000004']})).error,'Interest link seed failed.');
 privateWrite('interest-records.json',{interestId,opportunityId,discussionId,programId:giving.programId,otherOrganizationId,otherContactId,otherOpportunityId});
}
