import Link from "next/link";
import type { Activity,FollowUp } from "../lib/activity-data";
import { displayTime } from "../lib/activity-data";
import { DetailFields } from "./fields";
import { Pill } from "./ui";
export function FollowUpList({tasks,canWrite=false}:{tasks:FollowUp[];canWrite?:boolean}) {
  return <div className="space-y-3">{tasks.map(task=><article key={task.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-center gap-3"><Link className="font-semibold" href={`/activities/${task.activity_id}`}>{task.description}</Link><Pill tone={task.status==="Overdue"?"danger":task.status==="Complete"?"success":"neutral"}>{task.status}</Pill></div><p className="text-sm">Due: {task.due_date??"No due date"} · Owner: {task.owner_id?(task.owner_name??"Assigned staff member (restricted or inactive)"):"Unassigned"}{task.organization_name?` · ${task.organization_name}`:""}</p>{canWrite&&<Link className="text-sm underline" href={`/activities/${task.activity_id}/follow-ups/${task.id}/edit`}>Edit follow-up</Link>}</article>)}{!tasks.length&&<p>No follow-ups.</p>}</div>;
}
export function RelatedActivities({history}:{history:{activities:Activity[];tasks:FollowUp[];last:string|null}}) {
  const next=history.tasks.find(task=>task.status!=="Complete");
  return <section id="activities" className="card mt-5 p-6"><h2 className="mb-4 font-bold">Activities &amp; Follow-Ups</h2><DetailFields fields={[["Last Contact",displayTime(history.last)],["Next Action",next?<Link href={`/activities/${next.activity_id}`}>{next.description}</Link>:"No open action"],["Next Action Date",next?.due_date??"No due date"]]}/><div className="mt-5 space-y-3">{history.activities.map(activity=><p key={activity.id}><Link className="underline" href={`/activities/${activity.id}`}>{activity.purpose||activity.activity_type}</Link> · {activity.activity_type} · {displayTime(activity.occurred_at)}</p>)}{!history.activities.length&&<p>No related activities.</p>}</div></section>;
}
