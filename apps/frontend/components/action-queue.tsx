import Link from "next/link";
import { followUps,businessToday,type FollowUp } from "../lib/activity-data";
import { createClient } from "../lib/supabase/server";
import { FollowUpList } from "./activity-lists";
export async function ActionQueue() {
  const client=await createClient();
  let data:{tasks:FollowUp[];today:string}|null=null;
  try {
    const [tasks,today]=await Promise.all([followUps(client),businessToday(client)]);
    data={tasks,today};
  } catch { /* Render an explicit failure below; never disguise a query failure as zero. */ }
  if(!data) return <section className="card my-5 p-6" role="alert"><h2 className="font-bold">Action Queue unavailable</h2><p>Unable to load follow-ups. Check access and local migration setup, then reload. No zero count is implied.</p></section>;
  const {tasks,today}=data,end=new Date(today+"T00:00:00Z");end.setUTCDate(end.getUTCDate()+6);
  const until=end.toISOString().slice(0,10),open=tasks.filter(task=>task.status!=="Complete");
  return <section className="card my-5 p-6"><h2 className="mb-2 font-bold">Action Queue — overdue and next 7 days</h2><p className="mb-4 text-sm">Calgary dates: {today} to {until}. Completed actions are excluded.</p><FollowUpList tasks={open.filter(task=>task.status==="Overdue"||task.due_date&&task.due_date<=until)}/>{open.some(task=>!task.due_date)&&<p className="mt-3">{open.filter(task=>!task.due_date).length} open follow-up(s) have no due date. <Link href="/activities">Review activities</Link></p>}</section>;
}
