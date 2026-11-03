import { localDate } from "../../../lib/presentation";
import { RecordHeader } from "../../../components/record-header";
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Shell} from '../../../components/shell';
import {DetailFields} from '../../../components/fields';
import {crmContext} from '../../../lib/crm-context';
import {pairs} from '../../../lib/mentorship-data';
import {readAll} from '../../../lib/read-all';
export default async function PairDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params,{client,canWrite}=await crmContext(),rows=await pairs(client),r=rows.find(x=>x.id===id);if(!r)notFound();
 const checkins=await readAll<{id:string;checked_in_on:string;mentor_satisfaction:string|null;mentee_satisfaction:string|null;feedback:string|null;issues:string|null}>((a,b)=>client.from('mentorship_checkins').select('*',{count:'exact'}).eq('pair_id',id).order('id').range(a,b));checkins.sort((a,b)=>b.checked_in_on.localeCompare(a.checked_in_on)||a.id.localeCompare(b.id));
 return <Shell><RecordHeader name={`${r.mentor_name} / ${r.mentee_name}`} subtitle={`${r.program_name} · ${r.cohort_label}`} status={r.status} back="/mentorship" backLabel="Mentorship" editHref={canWrite?`/mentorship/${id}/edit`:undefined} editLabel="Edit pairing" actions={canWrite?<Link className="button" href={`/mentorship/${id}/checkins/new`}>Record check-in</Link>:undefined}/>
 <div className="card my-5 p-5"><DetailFields fields={[
 ['Mentor',<Link key="mentor" href={`/contacts/${r.mentor_id}`}>{r.mentor_name}</Link>],['Mentee',<Link key="mentee" href={`/contacts/${r.mentee_id}`}>{r.mentee_name}</Link>],['Organization',<Link key="org" href={`/organizations/${r.organization_id}`}>{r.organization_name}</Link>],['Program / Cohort',<Link key="cohort" href={`/programs/cohorts/${r.cohort_id}`}>{r.program_name} / {r.cohort_label}</Link>],['Start Date',r.start_date],['Target End Date',r.target_end_date],['Status',r.status],['Check-In Frequency',r.checkin_frequency],['Last Check-In',r.last_checkin||'None recorded'],['Check-Ins Completed',r.checkins_completed],['Pair Health','Definition pending'],['Mentor Satisfaction',r.mentor_satisfaction||'Unknown — latest recorded check-in'],['Mentee Satisfaction',r.mentee_satisfaction||'Unknown — latest recorded check-in'],['Issues / Flags',r.issues],['Next Action',r.next_action],['Action Due Date',r.action_due_date]]}/></div>
 <h2 className="font-bold">Check-in history</h2>{!checkins.length&&<p>No check-ins recorded.</p>}{checkins.map(c=><section className="card my-3 p-4" key={c.id}><h3>{localDate(c.checked_in_on)}</h3><DetailFields fields={[["Mentor feedback",c.mentor_satisfaction],["Mentee feedback",c.mentee_satisfaction],["Feedback",c.feedback],["Issues",c.issues]]}/>{canWrite&&<Link href={`/mentorship/${id}/checkins/${c.id}/edit`}>Edit check-in</Link>}</section>)}
 <h2 className="mt-5 font-bold">Related pairing history (shared mentor or mentee)</h2><ul>{rows.filter(x=>x.id!==id&&[x.mentor_id,x.mentee_id].some(c=>[r.mentor_id,r.mentee_id].includes(c))).map(x=><li key={x.id}><Link href={`/mentorship/${x.id}`}>{x.mentor_name} / {x.mentee_name} — {x.start_date}</Link></li>)}</ul></Shell>;
}
