import { localDate } from "../lib/presentation";
import Link from "next/link";
import { businessToday,type FollowUp } from "../lib/activity-data";
import { crmContext } from "../lib/crm-context";
import { FollowUpList } from "./activity-lists";
export async function ActionQueue({compact=false,scope='team',requestedPage}:{compact?:boolean;scope?:'mine'|'team'|'unassigned';requestedPage?:string}={}) {
  const {client,user,canWrite}=await crmContext();
  const requested=Number(requestedPage),page=Number.isSafeInteger(requested)&&requested>0?Math.min(requested,1000000):1,size=compact?5:20;
  let result:{today:string;until:string;tasks:FollowUp[];count:number}|null=null;
  try {
    const today=await businessToday(client),end=new Date(today+'T00:00:00Z');
    end.setUTCDate(end.getUTCDate()+6);
    const until=end.toISOString().slice(0,10);
    let query=client.from('follow_ups').select('*',{count:'exact'}).is('completed_at',null)
      .or(`due_date.lte.${until},due_date.is.null`).order('due_date',{ascending:true,nullsFirst:false}).order('id');
    if(scope==='mine') query=query.eq('owner_id',user.id);
    if(scope==='unassigned') query=query.is('owner_id',null);
    const {data,error,count}=await query.range((page-1)*size,page*size-1);
    if(error || count===null) throw new Error('Queue query failed');
    result={today,until,tasks:(data || []) as FollowUp[],count};
  } catch { /* Query failure is displayed explicitly below. */ }
  if(!result) return <section className="card my-5 p-6" role="alert"><h2 className="font-bold">Action Queue unavailable</h2><p>Unable to load follow-ups. No zero count is implied.</p><Link className="underline" href={`/dashboard?work=${scope}`}>Retry action queue</Link></section>;
  const {today,until,tasks,count}=result;
    return <section className="card my-5 p-6"><h2 className="mb-2 font-bold">Action Queue — overdue and next 7 days</h2>
      <p className="mb-4 text-sm">Calgary dates: {localDate(today)} to {localDate(until)}. Includes undated open actions; completed actions are excluded.</p>
      <nav className="flex flex-wrap gap-4 mb-4" aria-label="Action queue scope">{(['mine','team','unassigned'] as const).map(value=><Link key={value} aria-current={scope===value?'page':undefined} className="underline" href={`/dashboard?work=${value}`}>{value==='mine'?'Assigned to me':value==='team'?'Team actions':'Unassigned'}</Link>)}</nav>
      <div className="flex items-center justify-between mb-4"><span className="text-xs text-slate-500">Showing {tasks.length} of {count} actionable follow-ups</span><Link className="text-xs text-purple" href="/activities">View all activities →</Link></div>
      <FollowUpList tasks={tasks} canWrite={canWrite}/>
      <nav className="flex flex-wrap gap-4 mt-3" aria-label="Action queue pages">{page>1&&<Link className="underline" href={`/dashboard?work=${scope}&workPage=${page-1}`}>Previous actions</Link>}{page*size<count&&<Link className="underline" href={`/dashboard?work=${scope}&workPage=${page+1}`}>Next actions</Link>}</nav>
    </section>;
}
