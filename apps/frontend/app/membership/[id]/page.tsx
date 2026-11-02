import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shell } from '../../../components/shell';
import { DetailFields } from '../../../components/fields';
import { RelatedPrograms } from '../../../components/programs';
import { crmContext,ownerLabel } from '../../../lib/crm-context';
import { memberships } from '../../../lib/membership-data';
export default async function MembershipDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params,{client,canWrite}=await crmContext();const rows=await memberships(client),r=rows.find(x=>x.id===id);if(!r)notFound();
 const history=rows.filter(x=>r.contact_id?x.contact_id===r.contact_id:x.member_organization_id===r.member_organization_id).sort((a,b)=>b.start_date.localeCompare(a.start_date));
 return <Shell><h1 className="text-2xl font-bold">{r.member_name}</h1>{canWrite&&<Link href={`/membership/${id}/edit`}>Edit membership</Link>}
 <section className="card my-5 p-5"><DetailFields fields={[
 ['Member',<Link key="member" href={r.contact_id?`/contacts/${r.contact_id}`:`/organizations/${r.member_organization_id}`}>{r.member_name}</Link>],['Membership Type',r.membership_type],['Organization',r.linked_organization_id?<Link href={`/organizations/${r.linked_organization_id}`}>{r.organization_name}</Link>:'Unlinked'],['Industry',r.industry],['Start Date',r.start_date],['Renewal Date',r.renewal_date],['Membership Fee',r.fee===null?'Unknown':`${r.fee} CAD (planning metadata)`],['Payment Status',r.payment_status||'Unknown — manual label'],['Status',`${r.status} — provisional date convention; payment independent`],['Events Attended','Definition pending — event attendance workflow unavailable'],['Last Engagement',r.last_engagement||'No linked past interaction'],['Engagement Score','Definition pending'],['Renewal Risk','Definition pending'],['Relationship Owner',await ownerLabel(client,r.relationship_owner)],['Notes',r.notes],['Created',r.created_at],['Updated',r.updated_at]]}/></section>
 <h2>Program Participation</h2><RelatedPrograms {...(r.contact_id?{contact:r.contact_id}:{organization:r.member_organization_id!})}/>
 <h2 className="mt-5 font-bold">Membership history (recorded terms)</h2><ul>{history.map(x=><li key={x.id}><Link href={`/membership/${x.id}`}>{x.start_date} — {x.membership_type} — {x.status}</Link></li>)}</ul><p>Organization participation includes explicitly affiliated recipients. No automatic renewal or payment recognition.</p></Shell>;
}
