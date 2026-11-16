import {localDate} from '../lib/presentation';
import Link from 'next/link';
import type {FollowUp} from '../lib/activity-data';
import {Pill} from './ui';
export function FollowUpList({tasks,canWrite=false}:{tasks:FollowUp[];canWrite?:boolean}) {
  return <div className="space-y-3">{tasks.map(task=><article key={task.id} className="follow-up-row"><div className="flex flex-wrap items-center gap-3"><Link className="font-semibold" href={`/activities/${task.activity_id}`}>{task.description}</Link><Pill tone={task.status==="Overdue"?"danger":task.status==="Complete"?"success":"info"}>{task.status}</Pill></div><p className="text-sm">Due: {task.due_date?localDate(task.due_date):"No due date"} · Owner: {task.owner_id?(task.owner_name??"Assigned staff member (restricted or inactive)"):"Unassigned"}{task.organization_name?` · ${task.organization_name}`:""}</p>{canWrite&&<Link className="text-sm underline" href={`/activities/${task.activity_id}/follow-ups/${task.id}/edit`}>Edit follow-up</Link>}</article>)}{!tasks.length&&<p>Nothing needs your attention right now.</p>}</div>;
}
