import Link from "next/link";
import { Shell } from "../../components/shell";
import { Card,PageHeader } from "../../components/ui";
import { crmContext } from "../../lib/crm-context";
import { followUps,businessToday,displayTime,type Activity,requestTime } from "../../lib/activity-data";
import { ActionQueue } from "../../components/action-queue";
export default async function Activities({searchParams}:{searchParams:Promise<{q?:string;status?:string}>}) {
  const {q="",status=""}=await searchParams,{client,canWrite}=await crmContext();
  const [result,tasks,today,orgs]=await Promise.all([client.from("activities").select("*").order("occurred_at",{ascending:false}).order("id"),followUps(client),businessToday(client),client.from("organizations").select("id,name")]);
  if(result.error||orgs.error) throw new Error("Unable to load activities.");
  const names=new Map((orgs.data??[]).map(o=>[String(o.id),String(o.name)]));
  const now=requestTime();
  const activities=((result.data??[]) as Activity[]).filter(a=>(`${a.purpose??""} ${a.activity_type} ${names.get(a.organization_id??"")??""}`).toLowerCase().includes(q.toLowerCase())&&(!status||tasks.some(t=>t.activity_id===a.id&&t.status===status)));
  const start=new Date(today+"T00:00:00Z"),day=start.getUTCDay();start.setUTCDate(start.getUTCDate()-((day+6)%7));const weekStart=start.toISOString().slice(0,10);start.setUTCDate(start.getUTCDate()+6);const weekEnd=start.toISOString().slice(0,10);
  return <Shell><PageHeader title="Activities & Follow-Ups" subtitle="Log interactions and manage clear next actions." action={canWrite&&<Link href="/activities/new">+ Add activity</Link>}/>
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><Card><p>Due this week</p><b>{tasks.filter(t=>t.status!=="Complete"&&t.due_date&&t.due_date>=weekStart&&t.due_date<=weekEnd).length}</b><p className="text-xs">Monday–Sunday, Calgary</p></Card><Card><p>Overdue</p><b>{tasks.filter(t=>t.status==="Overdue").length}</b></Card><Card><p>Upcoming meetings</p><b>{((result.data??[]) as Activity[]).filter(a=>a.activity_type.toLowerCase()==="meeting"&&Date.parse(a.occurred_at)>now).length}</b><p className="text-xs">Future activities with type Meeting</p></Card></div>
    <form className="mb-5 flex flex-wrap gap-3"><input className="max-w-sm" name="q" defaultValue={q} aria-label="Search activities" placeholder="Search purpose, type or organization…"/><select className="max-w-xs" name="status" defaultValue={status} aria-label="Follow-up status"><option value="">All statuses</option>{["Open","Overdue","Complete"].map(s=><option key={s}>{s}</option>)}</select><button>Search</button></form>
    <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Date","Type","Organization","Purpose","Next Action","Owner"].map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{activities.map(a=>{const next=tasks.find(t=>t.activity_id===a.id&&t.status!=="Complete");return <tr className="border-t" key={a.id}><td className="p-3">{displayTime(a.occurred_at)}</td><td>{a.activity_type}</td><td>{names.get(a.organization_id??"")??"Not linked"}</td><td><Link className="underline" href={`/activities/${a.id}`}>{a.purpose||"View activity"}</Link></td><td>{next?.description??"No open action"}</td><td>{next?.owner_id?(next.owner_name??"Assigned staff member (restricted or inactive)"):"Unassigned"}</td></tr>;})}</tbody></table>{!activities.length&&<p className="p-5">No activities found.</p>}</div><ActionQueue/>
  </Shell>;
}
