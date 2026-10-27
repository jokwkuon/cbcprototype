"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crmContext } from "../../lib/crm-context";
import { activityValues, parseActivity, parseFollowUp } from "../../lib/activity-validation";
import { formValues, recordId, validId, ValidationError, type FormState } from "../../lib/crm-validation";
function refreshActivity() {
  for(const path of ["/activities","/organizations","/contacts"]) revalidatePath(path,"layout");
  revalidatePath("/dashboard");
}
function saveError(error:unknown,form:FormData,activity=false):FormState {
  return {values:activity?activityValues(form):formValues(form),errors:error instanceof ValidationError?error.errors:undefined,message:error instanceof Error?error.message:"Unable to save. Please try again."};
}
async function saveActivity(editing:boolean,form:FormData):Promise<FormState> {
  let id:string;
  try {
    const {client,canWrite}=await crmContext();if(!canWrite) throw new Error("Your role cannot change activities.");
    const parsed=parseActivity(form);
    const {data,error}=await client.rpc("save_activity",{p_id:editing?recordId(form):null,p_values:parsed.values,p_contacts:parsed.contacts});
    if(error||!data) throw new Error("Unable to save activity. Check linked records and your access, then try again.");
    id=String(data);
  } catch(error) {return saveError(error,form,true);}
  refreshActivity();redirect(`/activities/${id}`);
}
export async function createActivity(_state:FormState,form:FormData) { return saveActivity(false,form); }
export async function updateActivity(_state:FormState,form:FormData) { return saveActivity(true,form); }
export async function saveFollowUp(activityId:string,_state:FormState,form:FormData):Promise<FormState> {
  try {
    const {client,canWrite}=await crmContext();if(!canWrite) throw new Error("Your role cannot change follow-ups.");
    if(!validId(activityId)) throw new Error("Invalid activity identifier.");
    const parsed=parseFollowUp(form), id=form.has("id")?recordId(form):null;
    let completedAt:string|null=null;
    if(id) {
      const {data,error}=await client.from("tasks").select("completed_at").eq("id",id).eq("activity_id",activityId).single();
      if(error||!data) throw new Error("Follow-up unavailable.");
      completedAt=data.completed_at;
    }
    const payload={description:parsed.description,owner_id:parsed.owner_id,due_date:parsed.due_date,completed_at:parsed.complete?(completedAt??new Date().toISOString()):null};
    const query=id?client.from("tasks").update(payload).eq("id",id).eq("activity_id",activityId):client.from("tasks").insert({...payload,activity_id:activityId});
    const {data,error}=await query.select("id").single();
    if(error||!data) throw new Error("Unable to save follow-up. Select a permitted active Staff owner and an existing activity.");
  } catch(error) {return saveError(error,form);}
  refreshActivity();redirect(`/activities/${activityId}`);
}
