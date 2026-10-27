import type { FieldDefinition } from "./crm-fields";
import { organizationFields, contactFields } from "./crm-fields";
import { crmContext, ownerOptions } from "./crm-context";
export async function organizationFormData(id?: string) {
  const { client, profile, canWrite } = await crmContext();
  if (!canWrite) throw new Error("Your role has read-only access.");
  const { data: organization, error } = id ? await client.from("organizations").select("*").eq("id", id).single() : { data: null, error: null };
  if (error) throw new Error("Unable to load organization.");
  const owners = await ownerOptions(client);
  const fields: FieldDefinition[] = [...organizationFields];
  if (!id || profile.role === "admin") {
    const currentOwner = organization?.relationship_owner;
    if (currentOwner && !owners.some(owner => owner.id === currentOwner)) owners.push({ id: currentOwner, name: "Current owner (inactive or no longer Staff) — preserve or reassign" });
    fields.splice(5, 0, { name: "relationship_owner", label: "Relationship Owner", type: "select", options: [{ id: "", name: "Unassigned" }, ...owners], hint: profile.role === "admin" ? "Assign an active Staff member." : "You may assign yourself on creation. Only Admin may reassign afterward." });
  }
  if (id) {
    const { data: contacts, error: contactError } = await client.from("contacts").select("id,first_name,last_name").eq("organization_id", id).order("last_name");
    if (contactError) throw new Error("Unable to load affiliated contacts.");
    fields.push({ name: "primary_contact_id", label: "Primary Contact", type: "select", options: [{ id: "", name: "Not selected" }, ...(contacts ?? []).map(contact => ({ id: contact.id, name: `${contact.first_name} ${contact.last_name}` }))], hint: "Select a contact linked to this organization." });
  }
  return { fields, values: organization ?? { relationship_status: "Prospect", relationship_strength: "Medium", priority_level: "Medium", potential: "Medium" } };
}
export async function contactFormData(id?: string) {
  const { client, canWrite } = await crmContext();
  if (!canWrite) throw new Error("Your role has read-only access.");
  const [{ data: orgs, error: orgError }, result] = await Promise.all([
    client.from("organizations").select("id,name").order("name"),
    id ? client.from("contacts").select("*").eq("id", id).single() : Promise.resolve({ data: null, error: null }),
  ]);
  if (orgError || result.error) throw new Error("Unable to load contact or organizations.");
  const fields: FieldDefinition[] = [...contactFields, { name: "organization_id", label: "Organization", type: "select", options: [{ id: "", name: "Not linked" }, ...(orgs ?? [])] }];
  return { fields, values: result.data ?? {} };
}
