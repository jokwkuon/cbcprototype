export const levels = ["High", "Medium", "Low"];
export const relationshipStatuses = ["Prospect", "Cultivate", "Proposal", "Committed", "Active", "Lapsed"];
export type FormState = { errors?: Record<string, string>; message?: string; values?: Record<string, string> };
export class ValidationError extends Error {
  errors: Record<string, string>;
  constructor(errors: Record<string, string>) { super("Please correct the highlighted fields."); this.errors = errors; }
}
export function formValues(form: FormData) {
  return Object.fromEntries([...form.entries()].filter(([key, value]) => !key.startsWith("$") && typeof value === "string")) as Record<string, string>;
}
export function validId(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
export function recordId(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!validId(id)) throw new ValidationError({ id: "Invalid record identifier." });
  return id;
}
export function parseCrmForm(kind: "organization" | "contact", form: FormData) {
  const values = formValues(form), errors: Record<string, string> = {};
  const output: Record<string, string | number | null> = {};
  const fields = kind === "organization"
    ? ["name", "organization_type", "industry", "website", "relationship_status", "relationship_strength", "priority_level", "potential", "notes", "location", "estimated_opportunity", "primary_contact_id"]
    : ["first_name", "last_name", "title", "email", "phone", "organization_id", "contact_type", "influence_level", "interests", "notes"];
  for (const field of fields) output[field] = values[field]?.trim() || null;
  for (const name of kind === "organization" ? ["name"] : ["first_name", "last_name"]) {
    if (!output[name]) errors[name] = "This field is required.";
  }
  for (const name of ["organization_id", "primary_contact_id"]) {
    if (output[name] && !validId(String(output[name]))) errors[name] = "Select a valid linked record.";
  }
  if (kind === "organization") {
    for (const field of ["relationship_strength", "priority_level", "potential"]) {
      output[field] ??= "Medium";
      if (!levels.includes(String(output[field]))) errors[field] = "Choose High, Medium or Low.";
    }
    output.relationship_status ??= "Prospect";
    if (!relationshipStatuses.includes(String(output.relationship_status))) errors.relationship_status = "Choose a listed status.";
    if (output.estimated_opportunity !== null) {
      const number = Number(output.estimated_opportunity);
      if (!Number.isFinite(number)) errors.estimated_opportunity = "Enter a finite number.";
      else output.estimated_opportunity = number;
    }
    if (output.website) {
      try {
        const raw = String(output.website);
        const website = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
        if (!["http:", "https:"].includes(website.protocol) || !website.hostname || website.username || website.password || /\s/.test(raw)) throw new Error();
        output.website = website.toString();
      } catch { errors.website = "Enter an HTTP or HTTPS website without embedded credentials."; }
    }
    // Absence means preserve existing owner during updates. DB enforces all actor rules.
    if (Object.hasOwn(values, "relationship_owner")) {
      output.relationship_owner = values.relationship_owner.trim() || null;
      if (output.relationship_owner && !validId(String(output.relationship_owner))) errors.relationship_owner = "Select a valid staff member.";
    }
  } else {
    if (output.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(output.email))) errors.email = "Enter a valid email address.";
    if (output.influence_level && !levels.includes(String(output.influence_level))) errors.influence_level = "Choose High, Medium or Low.";
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return output;
}
