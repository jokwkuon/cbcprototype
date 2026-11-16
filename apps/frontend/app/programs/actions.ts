"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crmContext } from "../../lib/crm-context";
import { parseProgramForm, type ProgramKind } from "../../lib/program-validation";
import { programTables, programRoutes } from "../../lib/program-data";
import { formValues, recordId, ValidationError, type FormState } from "../../lib/crm-validation";
export async function saveProgramRecord(kind: ProgramKind, editing: boolean, _state: FormState, form: FormData): Promise<FormState> {
  let id: string;
  try {
    if (!Object.hasOwn(programTables, kind)) throw new Error("Invalid program record type.");
    const { client, canWrite } = await crmContext(); if (!canWrite) throw new Error("Your role cannot change programs or recipients.");
    const values = parseProgramForm(kind, form);
    if (kind === "enrollment") {
      const { data, error } = await client.from("program_cohorts").select("id").eq("id", values.cohort_id!).eq("program_id", values.program_id!).maybeSingle();
      if (error || !data) throw new ValidationError({ cohort_id: "Select a cohort belonging to this program." });
    }
    if (kind === "recipient") {
      if (values.alumni_since) {
        const { data, error } = await client.rpc("activity_today");
        if (error) throw new Error("Unable to check alumni effective date.");
        if (values.alumni_since > data) throw new ValidationError({ alumni_since: "Alumni effective date must not be future." });
      }
      if (values.contact_id && values.organization_id) {
        const { data, error } = await client.from("contacts").select("id").eq("id", values.contact_id).eq("organization_id", values.organization_id).maybeSingle();
        if (error || !data) throw new ValidationError({ organization_id: "Select the contact's organization, or leave Organization unlinked to inherit it." });
      }
    }
    const query = editing ? client.from(programTables[kind]).update(values).eq("id", recordId(form)) : client.from(programTables[kind]).insert(values);
    const { data, error } = await query.select("id").single();
    if (error || !data) throw new Error(error?.code === "23505" ? "This contact already has a recipient record, cohort label already exists, or recipient is already enrolled in this cohort. Edit the existing record or choose a different link." : "Unable to save. Check required values, linked records and access.");
    id = String(data.id);
  } catch (error) { return { values: formValues(form), errors: error instanceof ValidationError ? error.errors : undefined, message: error instanceof Error ? error.message : "Unable to save program record." }; }
  for (const path of ["/programs", "/organizations", "/contacts"]) revalidatePath(path, "layout");
  redirect(`${programRoutes[kind]}/${id}`);
}
