import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {local} from './prepare.mjs';
import {login,client,check,privateWrite,sql,accounts,uuid} from './client.mjs';
const seed=JSON.parse(readFileSync(resolve(local,'program-records.json'),'utf8')),base=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8')),giving=JSON.parse(readFileSync(resolve(local,'giving-records.json'),'utf8')),interest=JSON.parse(readFileSync(resolve(local,'interest-records.json'),'utf8'));
const admin=await login('admin'),staff=await login('staff'),checks=[];
const assert=(ok,label)=>{check(ok,label);checks.push(label);};
let summary=await staff.rpc('program_summary',{p_program_id:seed.programIds[0]});
assert(!summary.error&&summary.data.participants===2&&summary.data.enrollments===3,'Distinct recipient and enrollment counts across two cohorts');
assert(summary.data.known_support==='1500.30'&&summary.data.unknown_support_count===1,'Exact known support and missing support');
assert(!('graduation_rate' in summary.data)&&!('employed_in_field' in summary.data),'Unsupported outcome rates absent');
summary=await staff.rpc('program_summary',{p_program_id:seed.programIds[0],p_cohort_id:seed.cohortIds[0]});assert(!summary.error&&summary.data.enrollments===2&&summary.data.known_support==='1000.10','Cohort summary isolation');
const enrollment=await staff.from('program_enrollment_details').select('*').eq('id',seed.enrollmentIds[0]).single();assert(!enrollment.error&&enrollment.data.institution==='Cedar Vale College'&&enrollment.data.education_level==='Post-Secondary'&&enrollment.data.employment_status==='Employed','Education/institution/manual outcome fields');
assert(enrollment.data.contact_id===base.contactIds[0]&&enrollment.data.organization_id===base.organizationId&&enrollment.data.alumni_cash==='950','Linked contact/organization and eligible person-wide alumni receipts');
const unknown=await staff.from('program_enrollment_details').select('*').eq('id',seed.enrollmentIds[2]).single();assert(!unknown.error&&unknown.data.support_amount===null&&unknown.data.graduation_status===null&&unknown.data.employment_status===null&&unknown.data.alumni_cash===null&&unknown.data.recorded_interactions===null,'Unknown support/outcomes and unsupported history remain null');
const program=randomUUID(),cohort=randomUUID(),recipient=randomUUID(),id=randomUUID();
assert(!(await staff.from('programs').insert({id:program,name:'Community Enterprise Accelerator'})).error,'Staff creates program without financial write privilege');
assert(!(await staff.from('program_cohorts').insert({id:cohort,program_id:program,label:'Autumn Enterprise Cohort',year:2025})).error,'Staff creates cohort');
assert(!(await staff.from('program_recipients').insert({id:recipient,name:'Zara Campbell'})).error,'Staff creates standalone identity');
assert(!(await staff.from('program_enrollments').insert({id,program_id:program,cohort_id:cohort,recipient_id:recipient,support_amount:'0.10'})).error,'Staff creates enrollment');
const before=await staff.from('program_enrollment_details').select('*').eq('id',id).single();
const updated=await admin.from('program_enrollments').update({education_level:'Continuing Education',support_amount:'0.20',graduation_status:'Review pending',created_at:'1900-01-01',updated_at:'1900-01-01'}).eq('id',id).select('id,created_at,updated_at').single();
assert(!updated.error&&updated.data.created_at===before.data.created_at&&Date.parse(updated.data.updated_at)>Date.parse(before.data.updated_at),'Admin edits; original creation preserved and update server-generated');
assert(!(await staff.from('program_recipients').update({notes:'Updated after the coordinator review'}).eq('id',recipient).select('id').single()).error,'Staff edits recipient');
assert(!(await staff.from('program_cohorts').update({year:2026}).eq('id',cohort).select('id').single()).error,'Staff edits cohort');
for(const [change,label] of [[{program_id:seed.programIds[1]},'Cross-program cohort'],[{support_amount:'-1'},'Negative support'],[{support_amount:'NaN'},'Nonfinite support'],[{support_amount:'0.001'},'Subcent support'],[{currency:'USD'},'Unapproved FX'],[{graduation_date:'2025-02-29'},'Invalid graduation date'],[{id:randomUUID()},'Identity mutation']])assert((await staff.from('program_enrollments').update(change).eq('id',id)).error,`${label} rejected directly`);
assert((await staff.from('program_enrollments').insert({program_id:program,cohort_id:cohort,recipient_id:recipient})).error,'Duplicate recipient/cohort rejected');
assert((await staff.from('program_cohorts').update({program_id:seed.programIds[1]}).eq('id',cohort)).error,'Enrolled cohort cannot silently reparent');
assert((await staff.from('programs').update({funding_program_id:giving.eventId}).eq('id',program)).error,'Event rejected as Program alignment');
assert((await staff.from('program_recipients').insert({contact_id:base.contactIds[0]})).error,'Duplicate contact identity rejected');
assert((await staff.from('program_recipients').insert({name:'Leila Bennett',contact_id:interest.otherContactId,organization_id:base.organizationId})).error,'Cross-organization recipient contact rejected');
assert((await staff.from('program_recipients').update({alumni_since:'2099-01-01'}).eq('id',recipient)).error,'Future alumni effective date rejected');
assert((await staff.from('program_recipients').insert({name:'  '})).error,'Blank unlinked identity rejected');
for(const role of ['finance','viewer']){
 const c=await login(role);
 assert(!(await c.from('program_enrollment_details').select('id').eq('id',id).single()).error,`${role} reads enrollments`);
 assert(!(await c.rpc('program_summary',{p_program_id:program})).error,`${role} reads summaries`);
 for(const [table,values,key] of [['programs',{name:'Denied'},program],['program_cohorts',{program_id:program,label:'Denied'},cohort],['program_recipients',{name:'Denied'},recipient],['program_enrollments',{program_id:program,cohort_id:cohort,recipient_id:recipient,support_amount:'1'},id]]){
  assert((await c.from(table).insert(values)).error,`${role} ${table} insert denied`);
  const result=await c.from(table).update(table==='program_enrollments'?{support_amount:'1'}:table==='program_cohorts'?{label:'Denied'}:{name:'Denied'}).eq('id',key).select('id');assert(!result.error&&result.data.length===0,`${role} ${table} update denied`);
 }
}
for(const actor of [admin,staff])for(const [table,key] of [['programs',program],['program_cohorts',cohort],['program_recipients',recipient],['program_enrollments',id]])assert((await actor.from(table).delete().eq('id',key)).error,`${table} hard deletion denied`);
for(const table of ['programs','program_cohorts','program_recipients','program_enrollments','program_recipient_details','program_enrollment_details'])assert((await client().from(table).select('*')).error,`Anonymous ${table} denied`);
assert((await client().rpc('program_summary',{})).error,'Anonymous summary denied');
const second=accounts().find(a=>a.name==='staff-b'),inactive=client();assert(!(await inactive.auth.signInWithPassword({email:second.email,password:second.password})).error,'Actual Auth inactive test identity signs in');
sql(`update public.profiles set is_active=false where id='${uuid(second.id)}';`);
try{const result=await inactive.from('program_enrollment_details').select('id');assert(!result.error&&result.data.length===0,'Inactive read denied');assert((await inactive.rpc('program_summary',{})).error,'Inactive summary denied');assert((await inactive.from('programs').insert({name:'Denied'})).error,'Inactive write denied');}finally{sql(`update public.profiles set is_active=true where id='${uuid(second.id)}';`);}
assert((await staff.from('funding_initiatives').insert({kind:'Program',name:'Denied financial permission expansion'})).error,'Operational Staff cannot write financial reference records');
privateWrite('programs-api-verification.json',{checks,syntheticOnly:true});console.log(`PASS: ${checks.length} real local Programs Auth/PostgREST checks; identity, cohort integrity, exact/unknown support, supported alumni giving and access control.`);
