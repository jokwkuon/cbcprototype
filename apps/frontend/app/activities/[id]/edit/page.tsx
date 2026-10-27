import { notFound } from "next/navigation";
import { Shell } from "../../../../components/shell";
import { CrmForm } from "../../../../components/crm-form";
import { activityFormData } from "../../../../lib/activity-data";
import { updateActivity } from "../../actions";
export default async function EditActivity({params}:{params:Promise<{id:string}>}) {
  const {id}=await params,data=await activityFormData(id);if(!data) notFound();
  return <Shell><h1 className="text-3xl font-bold">Edit activity</h1><CrmForm action={updateActivity} {...data} cancelHref={`/activities/${id}`}/></Shell>;
}
