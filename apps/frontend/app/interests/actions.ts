"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crmContext } from "../../lib/crm-context";
import { interestValues, parseInterest, parseOpportunity } from "../../lib/interest-validation";
import { formValues, recordId, ValidationError, type FormState } from "../../lib/crm-validation";
function refresh() {
  revalidatePath("/interests", "layout");
  revalidatePath("/organizations", "layout");
  revalidatePath("/reports", "layout");
}
async function saveInterest(editing: boolean, form: FormData): Promise<FormState> {
  let id: string;
  try {
    const { client, canWrite } = await crmContext();
    if (!canWrite) throw new Error("Your role cannot change interests.");
    const parsed = parseInterest(form);
    // Give field-specific feedback; composite database FKs enforce this independently.
    for (const [field, table] of [["primary_contact_id", "contacts"], ["opportunity_id", "opportunities"]] as const) {
      if (parsed.values[field]) {
        const { data, error } = await client.from(table).select("id").eq("id", parsed.values[field]).eq("organization_id", parsed.values.organization_id!).maybeSingle();
        if (error || !data) throw new ValidationError({ [field]: "Select a record belonging to this organization, or clear the link." });
      }
    }
    const { data, error } = await client.rpc("save_interest", { p_id: editing ? recordId(form) : null, p_values: parsed.values, p_programs: parsed.programs, p_activities: parsed.activities, p_tasks: parsed.tasks });
    if (error || !data) throw new Error("Unable to save interest. Check linked records and your access.");
    id = String(data);
  } catch (error) {
    return { values: interestValues(form), errors: error instanceof ValidationError ? error.errors : undefined, message: error instanceof Error ? error.message : "Unable to save interest." };
  }
  refresh(); redirect(`/interests/${id}`);
}
export async function createInterest(_state: FormState, form: FormData) { return saveInterest(false, form); }
export async function updateInterest(_state: FormState, form: FormData) { return saveInterest(true, form); }
export async function archiveInterest(_state: FormState, form: FormData): Promise<FormState> {
  let id: string;
  try {
    const { client, profile } = await crmContext();
    if (profile.role !== "admin") throw new Error("Only Admin can archive or restore interests.");
    id = recordId(form);
    const disposition = form.get("disposition");
    if (disposition !== "archive" && disposition !== "restore") throw new Error("Choose Archive or Restore.");
    const { error, data } = await client.from("sponsor_interests").update({ archived_at: disposition === "archive" ? new Date().toISOString() : null }).eq("id", id).select("id").single();
    if (error || !data) throw new Error("Unable to change archive status.");
  } catch (error) { return { message: error instanceof Error ? error.message : "Unable to archive interest." }; }
  refresh(); redirect(`/interests/${id}`);
}
export async function createOpportunity(_state: FormState, form: FormData): Promise<FormState> {
  let id: string;
  try {
    const { client, canWrite } = await crmContext();
    if (!canWrite) throw new Error("Your role cannot create opportunity references.");
    const values = parseOpportunity(form);
    const { data, error } = await client.from("opportunities").insert(values).select("id").single();
    if (error || !data) throw new Error("Unable to create opportunity reference.");
    id = String(data.id);
  } catch (error) { return { values: formValues(form), errors: error instanceof ValidationError ? error.errors : undefined, message: error instanceof Error ? error.message : "Unable to save opportunity." }; }
  refresh(); redirect(`/interests/opportunities/${id}`);
}
