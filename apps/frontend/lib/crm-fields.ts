import { levels, relationshipStatuses } from "./crm-validation";
export type FieldDefinition = { name: string; label: string; type?: "text" | "email" | "number" | "textarea" | "select"; required?: boolean; options?: { id: string; name: string }[]; hint?: string };
const options = (values: string[]) => values.map(value => ({ id: value, name: value }));
export const organizationFields: FieldDefinition[] = [
  { name: "name", label: "Organization Name", required: true },
  { name: "organization_type", label: "Organization Type" },
  { name: "industry", label: "Industry" },
  { name: "website", label: "Website", hint: "HTTP or HTTPS; a bare hostname gains https://." },
  { name: "location", label: "Location" },
  { name: "relationship_status", label: "Relationship Status", type: "select", options: options(relationshipStatuses) },
  { name: "relationship_strength", label: "Relationship Strength", type: "select", options: options(levels) },
  { name: "priority_level", label: "Priority Level", type: "select", options: options(levels) },
  { name: "potential", label: "Potential", type: "select", options: options(levels) },
  { name: "estimated_opportunity", label: "Estimated Opportunity", type: "number", hint: "Manual estimate; currency and reporting rules await Finance definition." },
  { name: "notes", label: "Notes", type: "textarea" },
];
export const contactFields: FieldDefinition[] = [
  { name: "first_name", label: "First Name", required: true }, { name: "last_name", label: "Last Name", required: true },
  { name: "title", label: "Title" }, { name: "email", label: "Email", type: "email" }, { name: "phone", label: "Phone" },
  { name: "contact_type", label: "Contact Type", hint: "Free text until CBC approves controlled categories." },
  { name: "influence_level", label: "Influence Level", type: "select", options: [{ id: "", name: "Not specified" }, ...options(levels)] },
  { name: "interests", label: "Interests", type: "textarea" }, { name: "notes", label: "Notes", type: "textarea" },
];
export const organizationPending = ["Current Contribution", "Lifetime Giving", "Last Contact", "Next Action", "Next Action Date", "Renewal Date"];
export const contactPending = ["Last Contact", "Next Action", "Events Attended", "Giving History"];
