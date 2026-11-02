import { readAll } from "./read-all";
import { crmContext } from "./crm-context";
import { validId } from "./crm-validation";
import type { FieldDefinition } from "./crm-fields";
import type { ProgramKind } from "./program-validation";
export const programTables = { program: "programs", cohort: "program_cohorts", recipient: "program_recipients", enrollment: "program_enrollments" };
export const programRoutes = { program: "/programs", cohort: "/programs/cohorts", recipient: "/programs/recipients", enrollment: "/programs/enrollments" };
export type Program = { id: string; name: string; description: string | null; funding_program_id: string | null; created_at: string; updated_at: string };
export type Cohort = { id: string; program_id: string; label: string; year: number | null };
export type Recipient = { id: string; name: string | null; display_name: string; contact_id: string | null; organization_id: string | null; linked_organization_id: string | null; organization_name: string | null; alumni_since: string | null; notes: string | null; last_contact: string | null; recorded_interactions: number | null; alumni_cash: string | null };
export type Enrollment = { id: string; program_id: string; cohort_id: string; recipient_id: string; program_name: string; cohort_label: string; cohort_year: number | null; recipient_name: string; support_amount: string | null; currency: string; education_level: string | null; institution: string | null; field_of_study: string | null; graduation_status: string | null; graduation_date: string | null; employment_status: string | null; employment_field: string | null; notes: string | null; contact_id: string | null; organization_id: string | null; organization_name: string | null; alumni_since: string | null; alumni_cash: string | null; recorded_interactions: number | null; last_contact: string | null; created_at: string; updated_at: string };
export type ProgramSummary = { participants: number; enrollments: number; known_support: string | null; known_support_count: number; unknown_support_count: number; currency: string };
type Client = Awaited<ReturnType<typeof crmContext>>["client"];
export async function enrollments(client: Client, filters: { id?: string; program?: string; cohort?: string; recipient?: string; contact?: string; organization?: string } = {}) {
  if (Object.values(filters).some(id => id && !validId(id))) return [];
  return readAll<Enrollment>((from,to)=>{
    let query = client.from("program_enrollment_details").select("*",{count:"exact"}).order("id");
    for (const [key,value] of Object.entries(filters)) if(value) query=query.eq(key === "id" ? "id" : `${key}_id`,value);
    return query.range(from,to);
  });
}
export async function programSummary(client: Client, program?: string, cohort?: string) {
  const { data, error } = await client.rpc("program_summary", { p_program_id: program || null, p_cohort_id: cohort || null });
  if (error || !data) throw new Error("Program summary unavailable. No failed calculation is reported as zero.");
  return data as ProgramSummary;
}
export async function programFormData(kind: ProgramKind, id?: string, program?: string) {
  const { client, canWrite } = await crmContext(); if (!canWrite) throw new Error("Your role has read-only program access.");
  if (id && !validId(id)) return null;
  const blank = { id: "", name: "Not linked" };
  let fields: FieldDefinition[] = [];
  if (kind === "program") {
    const { data, error } = await client.from("funding_initiatives").select("id,name").eq("kind", "Program").order("name"); if (error) throw new Error("Unable to load Program references.");
    fields = [{ name: "name", label: "Program name", required: true }, { name: "description", label: "Description", type: "textarea" }, { name: "funding_program_id", label: "Program Alignment", type: "select", options: [blank, ...(data ?? [])], hint: "Optional explicit Program reference shared with Giving and Sponsor Interests. Financial reference permissions are unchanged." }];
  } else if (kind === "recipient") {
    const [contacts, orgs] = await Promise.all([client.from("contacts").select("id,first_name,last_name").order("last_name"), client.from("organizations").select("id,name").order("name")]);
    if (contacts.error || orgs.error) throw new Error("Unable to load recipient links.");
    fields = [{ name: "name", label: "Recipient name", hint: "Required unless linked to a contact. Linked contact names are displayed live." }, { name: "contact_id", label: "Contact", type: "select", options: [blank, ...(contacts.data ?? []).map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` }))], hint: "Optional existing identity; one recipient per linked contact." }, { name: "organization_id", label: "Organization", type: "select", options: [blank, ...(orgs.data ?? [])], hint: "Optional; when both links are selected, the contact must belong to this organization. Otherwise the contact's organization is inherited." }, { name: "alumni_since", label: "Alumni effective date", type: "date", hint: "Optional explicit designation, not inferred from graduation. Nonfuture date; contact-linked eligible cash from this date is displayed as person-wide alumni giving." }, { name: "notes", label: "Notes", type: "textarea" }];
  } else {
    const { data: programs, error } = await client.from("programs").select("id,name").order("name"); if (error) throw new Error("Unable to load programs.");
    fields = [{ name: "program_id", label: "Program", type: "select", required: true, options: [{ id: "", name: "Select program" }, ...(programs ?? [])] }];
    if (kind === "cohort") fields.push({ name: "label", label: "Cohort / Year", required: true }, { name: "year", label: "Calendar year", type: "number", hint: "Optional year, 1–9999. Cohort labels remain manual." });
    else {
      const [cohorts, recipients] = await Promise.all([client.from("program_cohorts").select("id,label,program_id").order("label"), client.from("program_recipient_details").select("id,display_name").order("display_name")]);
      if (cohorts.error || recipients.error) throw new Error("Unable to load cohorts/recipients.");
      const names = new Map((programs ?? []).map(p => [p.id, p.name]));
      fields.push({ name: "recipient_id", label: "Recipient / Participant", type: "select", required: true, options: [{ id: "", name: "Select recipient" }, ...(recipients.data ?? []).map(r => ({ id: r.id, name: r.display_name }))] }, { name: "cohort_id", label: "Cohort / Year", type: "select", required: true, options: [{ id: "", name: "Select cohort" }, ...(cohorts.data ?? []).map(c => ({ id: c.id, name: `${c.label} · ${names.get(c.program_id)}` }))], hint: "Must belong to the selected program; one enrollment per recipient per cohort." }, { name: "support_amount", label: "Award / Support Amount", hint: "CAD declared total support for this enrollment; unknown stays blank. Support records are separate from cash receipts." });
      for (const [name, label] of [["education_level", "Education Level"], ["institution", "Institution"], ["field_of_study", "Field of Study"], ["graduation_status", "Graduation Status"], ["employment_status", "Employment Status"], ["employment_field", "Employment Field"]]) fields.push({ name, label, hint: "Optional manual value; no automatic outcome classification." });
      fields.push({ name: "graduation_date", label: "Graduation Date", type: "date" }, { name: "notes", label: "Notes", type: "textarea" });
    }
  }
  let row: Record<string, string | number | null> = {};
  if (id) {
    const { data, error } = await client.from(kind === "enrollment" ? "program_enrollment_details" : programTables[kind]).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error("Unable to load program record."); if (!data) return null; row = data;
  }
  const values: Record<string, string | number | null> = id ? { id } : {};
  for (const field of fields) values[field.name] = row[field.name] ?? (field.name === "program_id" && program && validId(program) ? program : "");
  return { fields, values };
}
