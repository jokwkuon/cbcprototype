import { notFound } from "next/navigation";
import { Shell } from "../../../../../../components/shell";
import { CrmForm } from "../../../../../../components/crm-form";
import { crmContext } from "../../../../../../lib/crm-context";
import { followUps,followUpFormData,activityById } from "../../../../../../lib/activity-data";
import { saveFollowUp } from "../../../../actions";
export default async function EditFollowUp({params}:{params:Promise<{id:string;taskId:string}>}) {
  const {id,taskId}=await params,{client,canWrite}=await crmContext();if(!canWrite) throw new Error("Your role has read-only access.");
  if(!await activityById(client,id)) notFound();
  const task=(await followUps(client,[id])).find(row=>row.id===taskId);if(!task) notFound();
  const data=await followUpFormData(client,task);
  return <Shell><h1 className="text-3xl font-bold">Edit follow-up</h1><CrmForm action={saveFollowUp.bind(null,id)} {...data} cancelHref={`/activities/${id}`}/></Shell>;
}
