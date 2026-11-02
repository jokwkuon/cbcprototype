import Link from 'next/link';
import { Shell } from '../../components/shell';
import { PageHeader } from '../../components/ui';
import { crmContext } from '../../lib/crm-context';
import { memberships } from '../../lib/membership-data';
export default async function MembershipPage({searchParams}:{searchParams:Promise<{q?:string;renewals?:string}>}){
 const {client,canWrite}=await crmContext(),s=await searchParams;let rows;
 try{rows=await memberships(client);}catch{return <Shell><PageHeader title="Membership"/><p role="alert">Membership unavailable. <Link href="/membership">Retry</Link></p></Shell>;}
 const {data:today,error}=await client.rpc('activity_today');
 if(error)return <Shell><p role="alert">Membership date scope unavailable. Retry.</p></Shell>;
 const end=new Date(`${today}T12:00:00Z`);end.setUTCDate(end.getUTCDate()+30);
 const filtered=rows.filter(r=>(!s.q||`${r.member_name} ${r.organization_name??''} ${r.membership_type} ${r.industry??''}`.toLowerCase().includes(s.q.toLowerCase()))&&(!s.renewals||(r.renewal_date!==null&&r.renewal_date>=today&&r.renewal_date<=end.toISOString().slice(0,10))));
 return <Shell><PageHeader title="Membership" subtitle="Synthetic MVP — provisional date status; manual payment labels" action={canWrite?<Link href="/membership/new">Create membership</Link>:undefined}/>
 <form className="mb-5 flex flex-wrap gap-3"><label>Search<input name="q" defaultValue={s.q}/></label><label><input type="checkbox" name="renewals" value="1" defaultChecked={Boolean(s.renewals)}/>Renewals in next 30 days (inclusive)</label><button>Apply filters</button></form>
 <p>{filtered.length} matching membership records. Repeated terms are separate records.</p><div className="card overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Member','Type','Organization','Status','Renewal','Payment'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td className="p-3"><Link className="underline" href={`/membership/${r.id}`}>{r.member_name}</Link></td><td>{r.membership_type}</td><td>{r.organization_name||'Unlinked'}</td><td>{r.status}</td><td>{r.renewal_date||'Unknown'}</td><td>{r.payment_status||'Unknown'}</td></tr>)}</tbody></table>{!filtered.length&&<p className="p-5">No memberships found.</p>}</div></Shell>;
}
