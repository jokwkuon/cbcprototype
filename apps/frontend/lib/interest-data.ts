import { readAll } from "./read-all";
import { localDate } from "./presentation";
import { crmContext } from "./crm-context";
import type { FieldDefinition } from "./crm-fields";
import { validId } from "./crm-validation";
export type Interest = {
  id: string; organization_id: string; organization_name: string; primary_contact_id: string | null; primary_contact_name: string | null;
  category: string; strength: string | null; notes: string | null; archived_at: string | null; created_at: string; updated_at: string;
  opportunity_id: string | null; opportunity_name: string | null; opportunity_amount: string | null;
  relationship_owner: string | null; owner_name: string; programs: { id: string; name: string }[];
  last_discussion_id: string | null; last_discussed: string | null; last_discussion_name: string | null;
  next_task_id: string | null; next_activity_id: string | null; next_action: string | null; next_due_date: string | null;
};
type Client = Awaited<ReturnType<typeof crmContext>>["client"];
export async function interests(client: Client, filters: { id?: string; organization?: string; archived?: boolean } = {}) {
  if (filters.id && !validId(filters.id)) return [];
  let query = client.from("interest_details").select("*",{count:"exact"}).order("category").order("id");
  if (filters.id) query = query.eq("id", filters.id);
  if (filters.organization) query = query.eq("organization_id", filters.organization);
  if (!filters.id && !filters.archived) query = query.is("archived_at", null);
  return readAll<Interest>((from,to)=>query.range(from,to));
}
export async function interestFormData(id?: string, organization?: string) {
  const { client, canWrite } = await crmContext();
  if (!canWrite) throw new Error("Your role has read-only access to interests.");
  const [orgs, contacts, programs, opportunities, activities, tasks, records, programLinks, activityLinks, taskLinks] = await Promise.all([
    client.from("organizations").select("id,name").order("name"),
    client.from("contacts").select("id,organization_id,first_name,last_name").order("last_name"),
    client.from("funding_initiatives").select("id,name").eq("kind", "Program").order("name"),
    client.from("opportunities").select("id,name,organization_id").order("name"),
    client.from("activities").select("id,purpose,activity_type,occurred_at").order("occurred_at", { ascending: false }),
    client.from("tasks").select("id,description").order("description"),
    id ? interests(client, { id }) : [],
    id ? client.from("interest_programs").select("program_id").eq("interest_id", id) : { data: [], error: null },
    id ? client.from("interest_activities").select("activity_id").eq("interest_id", id) : { data: [], error: null },
    id ? client.from("interest_tasks").select("task_id").eq("interest_id", id) : { data: [], error: null },
  ]);
  if ([orgs, contacts, programs, opportunities, activities, tasks, programLinks, activityLinks, taskLinks].some(r => r.error)) throw new Error("Unable to load interest selections.");
  if (id && !records.length) return null;
  const names = new Map((orgs.data ?? []).map(o => [o.id, o.name]));
  const blank = { id: "", name: "Not linked" };
  const fields: FieldDefinition[] = [
    { name: "organization_id", label: "Organization", type: "select", required: true, options: [{ id: "", name: "Select organization" }, ...(orgs.data ?? [])] },
    { name: "primary_contact_id", parentField:"organization_id", label: "Primary Contact", type: "select", options: [blank, ...(contacts.data ?? []).filter(c => c.organization_id).map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name} · ${names.get(c.organization_id)}`,parentId:c.organization_id }))], hint: "Optional; must belong to the selected organization." },
    { name: "category", label: "Interest Category", required: true, hint: "Manual label; taxonomy remains provisional." },
    { name: "strength", label: "Interest Strength", hint: "Manually entered; no automatic scoring or matching." },
    { name: "program_ids", label: "Program Alignment", type: "multiselect", options: programs.data ?? [], hint: "Optional Program references shared with Giving; no automatic alignment." },
    { name: "activity_ids", label: "Linked discussions", type: "multiselect", options: (activities.data ?? []).map(a => ({ id: a.id, name: `${a.purpose || a.activity_type} · ${localDate(a.occurred_at,true)}` })), hint: "Last Discussed / Last Discussion use the latest selected past discussion." },
    { name: "opportunity_id", parentField:"organization_id", label: "Related Opportunity", type: "select", options: [blank, ...(opportunities.data ?? []).map(o => ({ id: o.id, name: `${o.name} · ${names.get(o.organization_id)}`,parentId:o.organization_id }))], hint: "Optional; must belong to the selected organization. This is not a contribution." },
    { name: "task_ids", label: "Linked follow-ups", type: "multiselect", options: (tasks.data ?? []).map(t => ({ id: t.id, name: t.description })), hint: "Next Action uses selected open follow-ups: earliest due, undated last. Manage follow-ups in Activities." },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  const row = records[0];
  const values: Record<string, string | string[] | null> = row ? { id: row.id, organization_id: row.organization_id, primary_contact_id: row.primary_contact_id, category: row.category, strength: row.strength, opportunity_id: row.opportunity_id, notes: row.notes } : { organization_id: organization && validId(organization) ? organization : "" };
  values.program_ids = (programLinks.data ?? []).map(p => p.program_id);
  values.activity_ids = (activityLinks.data ?? []).map(a => a.activity_id);
  values.task_ids = (taskLinks.data ?? []).map(t => t.task_id);
  return { fields, values };
}
