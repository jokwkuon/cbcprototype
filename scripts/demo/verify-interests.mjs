import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {local} from './prepare.mjs';
import {login,client,check,privateWrite,sql,accounts,uuid} from './client.mjs';
const base=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8')),seed=JSON.parse(readFileSync(resolve(local,'interest-records.json'),'utf8')),giving=JSON.parse(readFileSync(resolve(local,'giving-records.json'),'utf8'));
const admin=await login('admin'),staff=await login('staff');const evidence=[];
const assert=(ok,label)=>{check(ok,label);evidence.push(label);};
const row=await staff.from('interest_details').select('*').eq('id',seed.interestId).single();
assert(!row.error&&row.data.category==='Education and youth leadership'&&row.data.strength==='Manually assessed: strong','Staff reads seeded manual fields');
assert(row.data.primary_contact_id===base.contactIds[0]&&row.data.opportunity_id===seed.opportunityId&&row.data.opportunity_amount==='1234.56','Contact/opportunity linked; estimate exact');
assert(row.data.programs[0].id===giving.programId&&row.data.last_discussion_id===seed.discussionId&&row.data.next_task_id==='62000000-0000-4000-8000-000000000001','Program/discussion/next-action derived from explicit links');
assert(row.data.owner_name==='Jordan Ellis','Inherited restricted owner label');
const org=randomUUID(),otherContact=randomUUID(),otherOpportunity=randomUUID();
assert(!(await admin.from('organizations').insert({id:org,name:'Alder Grove Consulting'})).error,'Synthetic other organization');
assert(!(await admin.from('contacts').insert({id:otherContact,organization_id:org,first_name:'Elena',last_name:'Coleman'})).error,'Synthetic other contact');
assert(!(await staff.from('opportunities').insert({id:otherOpportunity,organization_id:org,name:'Entrepreneurship mentoring partnership'})).error,'Staff creates small opportunity reference');
const values={organization_id:base.organizationId,primary_contact_id:base.contactIds[0],opportunity_id:seed.opportunityId,category:'Small business development',strength:'Self assessed',notes:'Synthetic only'};
const save=await staff.rpc('save_interest',{p_id:null,p_values:values,p_programs:[giving.programId],p_activities:[base.activityId,seed.discussionId],p_tasks:['62000000-0000-4000-8000-000000000001']});
assert(!save.error&&save.data,'Staff creates interest atomically');const id=save.data;
for(const [change,label] of [[{primary_contact_id:otherContact},'Cross-organization contact'],[{opportunity_id:otherOpportunity},'Cross-organization opportunity'],[{organization_id:org},'Organization move with incompatible links'],[{organization_id:null},'Required organization'],[{category:'  '},'Blank category'],[{id:randomUUID()},'Immutable ID'],[{archived_at:new Date().toISOString()},'Staff archive']])assert((await staff.from('sponsor_interests').update(change).eq('id',id)).error,`${label} denied directly`);
assert((await staff.from('sponsor_interests').insert({...values,id:randomUUID(),archived_at:new Date().toISOString()})).error,'Staff archive on creation denied');
assert((await staff.from('interest_programs').insert({interest_id:id,program_id:giving.eventId})).error,'Event cannot align as program');
const rollback=await staff.rpc('save_interest',{p_id:id,p_values:{...values,category:'SHOULD ROLLBACK'},p_programs:[giving.eventId],p_activities:[],p_tasks:[]});assert(rollback.error,'Invalid atomic save denied');
const unchanged=await staff.from('interest_details').select('*').eq('id',id).single();assert(!unchanged.error&&unchanged.data.category===values.category&&unchanged.data.last_discussion_id===seed.discussionId,'Atomic rollback preserves values and links');
const archived=await admin.from('sponsor_interests').update({archived_at:new Date().toISOString()}).eq('id',id).select('*').single();assert(!archived.error&&archived.data.archived_at,'Admin archives');
assert((await staff.from('sponsor_interests').update({archived_at:null}).eq('id',id)).error,'Staff cannot restore');
assert(!(await admin.from('sponsor_interests').update({archived_at:null}).eq('id',id).select('id').single()).error,'Admin restores');
for(const actor of [admin,staff])assert((await actor.from('sponsor_interests').delete().eq('id',id)).error,'Hard deletion denied');
for(const role of ['finance','viewer']){
 const c=await login(role),r=await c.from('interest_details').select('*').eq('id',id).single();
 assert(!r.error&&r.data.owner_name==='Assigned staff member (directory restricted or inactive)',`${role} reads without leaking restricted directory`);
 assert((await c.from('sponsor_interests').insert(values)).error,`${role} insert denied`);
 assert((await c.rpc('save_interest',{p_id:id,p_values:values,p_programs:[],p_activities:[],p_tasks:[]})).error,`${role} writer RPC denied`);
 for(const [table,payload] of [['sponsor_interests',{notes:'Denied'}],['opportunities',{name:'Denied'}]]){
  const changed=await c.from(table).update(payload).eq('id',table==='opportunities'?seed.opportunityId:id).select('id');assert(!changed.error&&changed.data.length===0,`${role} ${table} update denied`);
 }
 for(const [table,payload] of [['interest_programs',{program_id:giving.programId}],['interest_activities',{activity_id:seed.discussionId}],['interest_tasks',{task_id:'62000000-0000-4000-8000-000000000001'}]]){
  assert((await c.from(table).insert({interest_id:id,...payload})).error,`${role} ${table} insertion denied`);
  const deleted=await c.from(table).delete().eq('interest_id',id).select('*');assert(!deleted.error&&deleted.data.length===0,`${role} ${table} removal denied`);
 }
}
for(const table of ['sponsor_interests','interest_details','opportunities','interest_programs','interest_activities','interest_tasks'])assert((await client().from(table).select('*')).error,`Anonymous ${table} denied`);
assert((await client().rpc('save_interest',{p_id:null,p_values:values,p_programs:[],p_activities:[],p_tasks:[]})).error,'Anonymous RPC denied');
// Use the second synthetic Staff account for inactive checks, then restore it even on failure.
const second=accounts().find(a=>a.name==='staff-b'),inactive=client();assert(!(await inactive.auth.signInWithPassword({email:second.email,password:second.password})).error,'Real Auth second Staff login');
sql(`update public.profiles set is_active=false where id='${uuid(second.id)}';`);
try {
 const r=await inactive.from('interest_details').select('id');assert(!r.error&&r.data.length===0,'Inactive reader denied');
 assert((await inactive.rpc('save_interest',{p_id:null,p_values:values,p_programs:[],p_activities:[],p_tasks:[]})).error,'Inactive writer denied');
}finally{sql(`update public.profiles set is_active=true where id='${uuid(second.id)}';`);}
const updated=await staff.from('sponsor_interests').update({notes:'Reviewed by the partnership coordinator',created_at:'1900-01-01',updated_at:'1900-01-01'}).eq('id',id).select('*').single();
assert(!updated.error&&updated.data.created_at===unchanged.data.created_at&&Date.parse(updated.data.updated_at)>Date.parse(unchanged.data.updated_at),'Staff edits with server-maintained timestamps');
assert(!(await staff.rpc('save_interest',{p_id:id,p_values:{organization_id:org,category:'Community leadership'},p_programs:[],p_activities:[],p_tasks:[]})).error,'Organization move with optional links cleared');
const final=await staff.from('interest_details').select('*').eq('id',id).single();assert(!final.error&&final.data.organization_id===org&&final.data.primary_contact_id===null&&final.data.next_action===null,'Optional links cleared, no invented next action');
privateWrite('interests-api-verification.json',{checks:evidence,syntheticOnly:true});
console.log(`PASS: ${evidence.length} real local Sponsor Interests Auth/PostgREST checks; allow/deny, affiliation, archive, atomic saves, inherited ownership and timestamps.`);
