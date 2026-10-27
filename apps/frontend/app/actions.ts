"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import { crmContext } from "../lib/crm-context";
import { formValues, parseCrmForm, recordId, ValidationError, type FormState } from "../lib/crm-validation";

async function saveRecord(kind: "organization" | "contact", editing: boolean, form: FormData): Promise<FormState> {
  let id: string;
  const plural = kind === "organization" ? "organizations" : "contacts";
  try {
    const { client, profile, canWrite } = await crmContext();
    if (!canWrite) throw new Error("Your role cannot create or edit these records.");
    const payload = parseCrmForm(kind, form);
    // Preserve staff ownership after creation, including forged form submissions.
    // The database independently enforces the same rule for direct API clients.
    if (kind === "organization" && editing && profile.role !== "admin" && Object.hasOwn(payload, "relationship_owner")) {
      throw new ValidationError({ relationship_owner: "Only Admin may change ownership after creation." });
    }
    const query = editing
      ? client.from(plural).update(payload).eq("id", recordId(form))
      : client.from(plural).insert(payload);
    const { data, error } = await query.select("id").single();
    if (error || !data) {
      const message = error?.code === "23503" ? "A linked record is invalid or the primary contact belongs to another organization. Clear the primary contact before moving that person."
        : error?.code === "42501" ? "This ownership assignment or operation is not permitted."
        : error?.code === "23514" ? "A value is invalid. Owners must be active Staff members."
        : "Unable to save the record. Check access, linked records and migration setup, then try again.";
      throw new Error(message);
    }
    id = data.id;
  } catch (error) {
    return { values: formValues(form), message: error instanceof Error ? error.message : "Unable to save record.", errors: error instanceof ValidationError ? error.errors : undefined };
  }
  revalidatePath("/organizations", "layout");
  revalidatePath("/contacts", "layout");
  revalidatePath("/dashboard");
  redirect(`/${plural}/${id}`);
}
export async function createOrganization(_state: FormState, form: FormData) { return saveRecord("organization", false, form); }
export async function updateOrganization(_state: FormState, form: FormData) { return saveRecord("organization", true, form); }
export async function createContact(_state: FormState, form: FormData) { return saveRecord("contact", false, form); }
export async function updateContact(_state: FormState, form: FormData) { return saveRecord("contact", true, form); }
export async function signOut() {
  const client = await createClient(); const { error } = await client.auth.signOut();
  if (error) throw new Error("Unable to sign out. Please try again.");
  redirect("/login");
}
