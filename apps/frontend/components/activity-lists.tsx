import Link from "next/link";
import { displayTime } from "../lib/activity-data";
import { DetailFields } from "./fields";
import { HistorySectionFeed } from "./relationship-history-feed";
export {FollowUpList} from "./follow-up-list";
export function RelatedActivities({history,kind,id,canWrite}:{history:Awaited<ReturnType<typeof import('../lib/relationship-history').relationshipHistory>>;kind:'organization'|'contact';id:string;canWrite:boolean}) {
  const next=history.open.rows[0];
  return <section id="activities" className="card mt-5 p-6"><h2 className="mb-4 font-bold">Activities &amp; Follow-Ups</h2><DetailFields fields={[["Last Contact",displayTime(history.last)],["Next Action",next?<Link href={`/activities/${next.activity_id}`}>{next.description}</Link>:"No open action"],["Next Action Date",next?.due_date??"No due date"]]}/><HistorySectionFeed kind={kind} id={id} section="open" initial={history.open} canWrite={canWrite}/>{history.completed.total>0&&<details><summary>Completed follow-ups ({history.completed.total})</summary><HistorySectionFeed kind={kind} id={id} section="completed" initial={history.completed} canWrite={canWrite}/></details>}<HistorySectionFeed kind={kind} id={id} section="activities" initial={history.activities}/></section>;
}
