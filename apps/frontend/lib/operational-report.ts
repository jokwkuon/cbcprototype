import {crmContext} from './crm-context';
import {readAll} from './read-all';
import {memberships} from './membership-data';
import {pairs} from './mentorship-data';
import {reportScope} from './report-data';
import {ReportFilterError,sumMoney} from './report-validation';
import type {Enrollment} from './program-data';
export type ReportFilters={organization?:string|string[];program?:string|string[];cohort?:string|string[];status?:string|string[];q?:string|string[]};
export type ReportRow={id:string;href:string;values:string[]};
type Client=Awaited<ReturnType<typeof crmContext>>['client'];
export async function operationalReport(client:Client,category:string,filters:ReportFilters){
 const scope=await reportScope(client,filters.organization);
 for(const v of Object.values(filters))if(v!==undefined&&typeof v!=='string')throw new ReportFilterError('Use one value per filter.');
 const q=String(filters.q||'').toLowerCase(),status=String(filters.status||''),program=String(filters.program||''),cohort=String(filters.cohort||'');
 let columns:string[]=[],rows:ReportRow[]=[],metrics:[string,string|number][]=[],pending='';
 const programs=await readAll<{id:string;name:string}>((a,b)=>client.from('programs').select('id,name',{count:'exact'}).order('id').range(a,b));
 const cohorts=await readAll<{id:string;program_id:string;label:string}>((a,b)=>client.from('program_cohorts').select('id,program_id,label',{count:'exact'}).order('id').range(a,b));
 if(program&&!programs.some(p=>p.id===program)||cohort&&!cohorts.some(c=>c.id===cohort&&(!program||c.program_id===program)))throw new ReportFilterError('Choose a valid program/cohort combination.');
 const text=(v:unknown)=>v===null||v===undefined?'Unknown':String(v);
 const match=(values:unknown[])=>!q||values.map(text).join(' ').toLowerCase().includes(q);
 if(category==='membership'){
  const records=(await memberships(client)).filter(r=>(!scope.organization||r.linked_organization_id===scope.organization)&&(!status||r.status===status)&&match([r.member_name,r.membership_type,r.industry,r.organization_name]));
  columns=['Member','Type','Organization','Start','Renewal','Status','Fee CAD (manual)','Payment (manual)','Last Engagement'];
  rows=records.map(r=>({id:r.id,href:`/membership/${r.id}`,values:[r.member_name,r.membership_type,r.organization_name,r.start_date,r.renewal_date,r.status,r.fee,r.payment_status,r.last_engagement].map(text)}));
  metrics=[['Recorded terms',records.length],...['Scheduled','Current term','Renewal overdue'].map(s=>[s,records.filter(r=>r.status===s).length] as [string,number])];
  pending='Retention, growth, Events Attended, Engagement Score and Renewal Risk: Definition pending. Terms are records, not deduplicated member counts. Fees are metadata, not revenue.';
 }else if(category==='mentorship'){
  const records=(await pairs(client)).filter(r=>(!scope.organization||r.organization_id===scope.organization)&&(!program||r.program_id===program)&&(!cohort||r.cohort_id===cohort)&&(!status||r.status===status)&&match([r.mentor_name,r.mentee_name,r.program_name,r.cohort_label]));
  columns=['Mentor','Mentee','Program','Cohort','Status','Last Check-In','Completed Check-Ins','Mentor Satisfaction (raw)','Mentee Satisfaction (raw)','Next Action','Action Due'];
  rows=records.map(r=>({id:r.id,href:`/mentorship/${r.id}`,values:[r.mentor_name,r.mentee_name,r.program_name,r.cohort_label,r.status,r.last_checkin,r.checkins_completed,r.mentor_satisfaction,r.mentee_satisfaction,r.next_action,r.action_due_date].map(text)}));
  metrics=[['Pairings',records.length],['Recorded check-ins',records.reduce((n,r)=>n+Number(r.checkins_completed),0)]];pending='Pair Health and at-risk relationships: Definition pending. Satisfaction is latest recorded check-in feedback, not a score.';
 }else if(category==='scholarship'){
  const records=(await readAll<Enrollment>((a,b)=>client.from('program_enrollment_details').select('*',{count:'exact'}).order('id').range(a,b))).filter(r=>(!scope.organization||r.organization_id===scope.organization)&&(!program||r.program_id===program)&&(!cohort||r.cohort_id===cohort)&&match([r.recipient_name,r.program_name,r.cohort_label,r.institution]));
  columns=['Recipient','Program','Cohort','Declared Support CAD','Graduation (manual)','Employment (manual)','Field of Study','Employment Field'];
  rows=records.map(r=>({id:r.id,href:`/programs/enrollments/${r.id}`,values:[r.recipient_name,r.program_name,r.cohort_label,r.support_amount,r.graduation_status,r.employment_status,r.field_of_study,r.employment_field].map(text)}));
  const known=records.filter(r=>r.support_amount!==null);const cents=sumMoney(known.map(r=>r.support_amount!));
  metrics=[['Participants (distinct recipient IDs)',new Set(records.map(r=>r.recipient_id)).size],['Enrollments',records.length],['Known support records',known.length],['Unknown support records',records.length-known.length],['Declared support CAD',known.length?`${cents/100n}.${String(cents%100n).padStart(2,'0')}`:'Unknown — no amounts recorded']];pending='Scholarship counts, graduation rates, employment alignment and alumni program attribution: Definition pending. Declared support is separate from Giving cash.';
 }else if(category==='executive'){
  const organizations=(await readAll<{id:string;name:string;relationship_status:string}>((a,b)=>client.from('organizations').select('id,name,relationship_status',{count:'exact'}).order('id').range(a,b))).filter(r=>!scope.organization||r.id===scope.organization);
  const contacts=(await readAll<{id:string;organization_id:string|null}>((a,b)=>client.from('contacts').select('id,organization_id',{count:'exact'}).order('id').range(a,b))).filter(r=>!scope.organization||r.organization_id===scope.organization);
  const selected=organizations.filter(r=>match([r.name,r.relationship_status]));columns=['Organization','Relationship Status'];rows=selected.map(r=>({id:r.id,href:`/organizations/${r.id}`,values:[r.name,r.relationship_status]}));metrics=[['Organizations in scope',organizations.length],['Contacts in scope',contacts.length],['Matching organizations',selected.length]];pending='Organization and contact counts use the organization scope. Search narrows organization rows only. Financial, membership, mentorship and program summaries use their linked reports below; unsupported performance scores remain Definition pending.';
 }else throw new ReportFilterError('Unsupported report category.');
 return {...scope,programs,cohorts,columns,rows,metrics,pending,program,cohort,status,q:String(filters.q||'')};
}
