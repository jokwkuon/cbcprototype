import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../components/shell";
import { CrmForm } from "../../../components/crm-form";
import { DetailFields } from "../../../components/fields";
import { FollowUpList } from "../../../components/activity-lists";
import { crmContext } from "../../../lib/crm-context";
import { activityById,followUps,followUpFormData,lastContact,displayTime } from "../../../lib/activity-data";
import { saveFollowUp } from "../actions";
export default async function ActivityDetail({params}:{params:Promise<{id:string}>}) {
  const {id}=await params,{client,canWrite}=await crmContext(),activity=await activityById(client,id);if(!activity) notFound();
  const [links,tasks,last,org]=await Promise.all([
    client.from("activity_contacts").select("contact_id,contact:contacts(id,first_name,last_name)").eq("activity_id",id),
    followUps(client,[id]),lastContact(client,{p_activity_id:id}),
    activity.organization_id?client.from("organizations").select("id,name").eq("id",activity.organization_id).single():{data:null,error:null},
  ]);
  if(links.error||org.error) throw new Error("Unable to load related activity records.");
  const form=canWrite?await followUpFormData(client):null;
  return <Shell><Link href="/activities">← Activities &amp; Follow-Ups</Link><div className="my-5 flex justify-between gap-4"><h1 className="text-3xl font-bold">{activity.purpose||activity.activity_type}</h1>{canWrite&&<Link href={`/activities/${id}/edit`}>Edit activity</Link>}</div>
    <section className="card p-6"><DetailFields fields={[
      ["Date / Time",displayTime(activity.occurred_at)],["Activity Type",activity.activity_type],
      ["Organization",org.data?<Link href={`/organizations/${org.data.id}`}>{org.data.name}</Link>:"Not linked"],
      ["Contact(s)",<div key="contacts">{(links.data??[]).map(link=>{const c=link.contact as unknown as {id:string;first_name:string;last_name:string}|null;return c?<p key={c.id}><Link href={`/contacts/${c.id}`}>{c.first_name} {c.last_name}</Link></p>:null;})}{!links.data?.length&&"No participants"}</div>],
      ["Location",activity.location],["Purpose",activity.purpose],["Key Discussion",activity.key_discussion],["Sponsor Needs",activity.sponsor_needs],
      ["CBC Opportunity",activity.cbc_opportunity],["Outcome",activity.outcome],["Last Contact",displayTime(last)],
    ]}/></section><section className="card mt-5 p-6"><h2 className="mb-4 text-xl font-bold">Follow-up actions</h2><p className="mb-4 text-sm">Status is calculated: Complete, Open or Overdue. Due today stays Open through the Calgary day.</p><FollowUpList tasks={tasks} canWrite={canWrite}/></section>
    {canWrite&&<section className="mt-5"><h2 className="text-xl font-bold">Add follow-up</h2><CrmForm action={saveFollowUp.bind(null,id)} {...form!} cancelHref={`/activities/${id}`}/></section>}
  </Shell>;
}
