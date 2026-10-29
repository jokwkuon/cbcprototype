import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../components/shell";
import { DetailFields } from "../../../components/fields";
import { CrmForm } from "../../../components/crm-form";
import { crmContext } from "../../../lib/crm-context";
import { interests } from "../../../lib/interest-data";
import { FollowUpList } from "../../../components/activity-lists";
import type { FollowUp } from "../../../lib/activity-data";
import { displayTime } from "../../../lib/activity-data";
import { archiveInterest } from "../actions";
export default async function InterestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, { client, canWrite, profile } = await crmContext();
  const [i] = await interests(client, { id }); if (!i) notFound();
  const [discussions, tasks] = await Promise.all([
    client.from("interest_activities").select("activity_id,activity:activities(id,purpose,activity_type,occurred_at)").eq("interest_id", id),
    client.from("interest_tasks").select("task_id").eq("interest_id", id),
  ]);
  if (discussions.error || tasks.error) throw new Error("Unable to load interest links.");
  const taskIds = (tasks.data ?? []).map(t => t.task_id);
  const linkedTasks = taskIds.length ? await client.from("follow_ups").select("*").in("id", taskIds).order("due_date", { ascending: true, nullsFirst: false }).order("id") : { data: [], error: null };
  if (linkedTasks.error) throw new Error("Unable to load linked follow-ups.");
  return <Shell><Link href="/interests">← Sponsor Interests</Link><div className="my-5 flex justify-between"><h1 className="text-3xl font-bold">{i.category}</h1>{canWrite && <Link href={`/interests/${id}/edit`}>Edit interest</Link>}</div>
    <section className="card p-6"><DetailFields fields={[
      ["Organization", <Link key="org" href={`/organizations/${i.organization_id}`}>{i.organization_name}</Link>],
      ["Primary Contact", i.primary_contact_id ? <Link href={`/contacts/${i.primary_contact_id}`}>{i.primary_contact_name}</Link> : "Not linked"],
      ["Interest Category", i.category], ["Interest Strength", i.strength], ["Program Alignment", i.programs.map(p => p.name).join(", ") || "Not linked"],
      ["Last Discussed", i.last_discussed ? displayTime(i.last_discussed) : "No linked past discussion"],
      ["Last Discussion", i.last_discussion_id ? <Link href={`/activities/${i.last_discussion_id}`}>{i.last_discussion_name}</Link> : "No linked past discussion"],
      ["Related Opportunity", i.opportunity_id ? <Link href={`/interests/opportunities/${i.opportunity_id}`}>{i.opportunity_name}</Link> : "Not linked"],
      ["Relationship Owner", i.owner_name],
      ["Next Action", i.next_task_id ? <Link href={`/activities/${i.next_activity_id}`}>{i.next_action} · {i.next_due_date || "Undated"}</Link> : "No linked open action"],
      ["Notes", i.notes], ["Status", i.archived_at ? "Archived" : "Active"], ["Created", displayTime(i.created_at)], ["Updated", displayTime(i.updated_at)],
    ]}/></section>
    <section className="card mt-5 p-6"><h2 className="mb-3 font-bold">Linked discussions and follow-ups</h2><p className="mb-3 text-sm">Last Discussion shows the latest selected past discussion. Next Action shows the earliest due selected open follow-up, with undated actions last. Provisional conventions pending CBC approval.</p>{(discussions.data ?? []).map(d => { const a = d.activity as unknown as { purpose: string | null; activity_type: string; occurred_at: string }; return <p key={d.activity_id}><Link href={`/activities/${d.activity_id}`}>{a.purpose || a.activity_type}</Link> · {displayTime(a.occurred_at)}</p>; })}<FollowUpList tasks={(linkedTasks.data ?? []) as FollowUp[]} canWrite={canWrite}/>{!discussions.data?.length && !tasks.data?.length && <p>No discussions or follow-ups linked.</p>}<Link className="mt-3 inline-block" href="/activities">Manage activities and follow-ups</Link></section>
    {profile.role === "admin" && <section className="mt-5"><h2 className="font-bold">Archive status</h2><p>Archived interests remain available through Include archived. No record is deleted.</p><CrmForm action={archiveInterest} values={{ id }} fields={[{ name: "disposition", label: "Archive action", type: "select", options: [{ id: i.archived_at ? "restore" : "archive", name: i.archived_at ? "Restore interest" : "Archive interest" }] }]} cancelHref="/interests"/></section>}
  </Shell>;
}
