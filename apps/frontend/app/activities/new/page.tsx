import { Shell } from "../../../components/shell";
import { CrmForm } from "../../../components/crm-form";
import { activityFormData } from "../../../lib/activity-data";
import { createActivity } from "../actions";
export default async function NewActivity() {
  const data=await activityFormData();
  return <Shell><h1 className="text-3xl font-bold">Add activity</h1><p>Log the interaction and participants, then add one or more follow-up actions on its detail page.</p><CrmForm action={createActivity} {...data!} cancelHref="/activities"/></Shell>;
}
