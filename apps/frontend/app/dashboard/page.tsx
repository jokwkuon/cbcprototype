import {StatusBadge} from '../../components/data-table';
import Link from 'next/link';
import {Shell} from '../../components/shell';
import {PageHeader} from '../../components/ui';
import {Icon} from '../../components/icons';
import {GivingTrend,RelationshipBreakdown} from '../../components/dashboard-charts';
import {BoardSummaries,UpcomingRenewals} from '../../components/board-summaries';
import {FinancialSummary} from '../../components/giving';
import {ActionQueue} from '../../components/action-queue';
import {readAll} from '../../lib/read-all';
import {crmContext} from '../../lib/crm-context';
import {localDate} from '../../lib/presentation';
export default async function Dashboard({searchParams}:{searchParams:Promise<{work?:string;workPage?:string}>}){
 const {work,workPage}=await searchParams;
 const scope=work==='team'||work==='unassigned'?work:'mine';
 const {client:c,canWrite}=await crmContext();
 const [orgResult,contactResult,statusResult,recentResult]=await Promise.all([
 c.from('organizations').select('id',{count:'exact',head:true}),c.from('contacts').select('id',{count:'exact',head:true}),
 readAll<{id:string;relationship_status:string}>((from,to)=>c.from('organizations').select('id,relationship_status',{count:'exact'}).order('id').range(from,to)).then(data=>({data,error:null}),()=>({data:null,error:true})),
 c.from('organizations').select('id,name,created_at,relationship_status').order('created_at',{ascending:false}).limit(5)]);
 const failed=[orgResult,contactResult,statusResult,recentResult].some(r=>r.error)||orgResult.count===null||contactResult.count===null;
 const counts=(statusResult.data||[]).reduce((a,r)=>({...a,[r.relationship_status]:(a[r.relationship_status]||0)+1}),{}as Record<string,number>);
 const kpis=[{label:'Total organizations',value:orgResult.count,icon:'organizations',href:'/organizations',context:'Companies & community partners'},{label:'Total contacts',value:contactResult.count,icon:'contacts',href:'/contacts',context:'People in your relationship network'},{label:'Active relationships',value:counts.Active||0,icon:'interests',href:'/organizations?status=Active',context:'Relationships marked Active'},{label:'Prospects',value:counts.Prospect||0,icon:'activities',href:'/organizations?status=Prospect',context:'Potential community partners'}];
 return <Shell><PageHeader title="Executive Dashboard" subtitle="Your relationships, commitments and next actions — in one place." action={<Link className="button button-secondary" href="/reports/executive"><Icon name="reports" size={14}/>Executive report</Link>}/>
 {canWrite&&<div className="dashboard-quick"><Link className="button button-primary" href="/activities/new"><Icon name="plus" size={13}/>Log an interaction</Link><Link className="button" href="/organizations/new">Add organization</Link><Link className="button" href="/membership/new">Start a membership</Link><Link className="button" href="/mentorship/new">Create mentor pairing</Link></div>}

 {failed?<section className="card p-6 mb-5" role="alert"><h2>Relationship dashboard unavailable</h2><p>Unable to load organization/contact counts, statuses or recent records. Reload to retry. No zero counts are implied.</p></section>:<div className="metric-grid">{kpis.map(k=><Link href={k.href} key={k.label} className="card metric-card"><div className="metric-top"><span>{k.label}</span><span className="metric-icon"><Icon name={k.icon} size={15}/></span></div><p className="metric-number">{k.value}</p><span className="metric-context">{k.context}<Icon name="arrow" size={11}/></span></Link>)}</div>}
 <ActionQueue compact scope={scope} requestedPage={workPage}/>
 {!failed&&<div className="dashboard-grid"><GivingTrend client={c}/><div><RelationshipBreakdown counts={counts}/><UpcomingRenewals/></div></div>}
 <BoardSummaries/>
 {!failed&&<section className="card my-5"><div className="section-title px-5 pt-5"><h2>Recently created organizations</h2><Link href="/organizations">View all organizations</Link></div><div className="table-scroll"><table><thead><tr><th>Organization</th><th>Status</th><th>Added</th></tr></thead><tbody>{recentResult.data?.map(r=><tr key={r.id}><td><Link href={`/organizations/${r.id}`}>{r.name}</Link></td><td><StatusBadge domain="relationship" value={r.relationship_status}/></td><td>{localDate(r.created_at)}</td></tr>)}</tbody></table>{!recentResult.data?.length&&<p className="p-5">No organizations yet.</p>}</div></section>}
 <FinancialSummary/>
 </Shell>;
}
