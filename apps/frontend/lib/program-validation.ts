import { formValues, validId, ValidationError } from "./crm-validation.ts";
import { validDate } from "./activity-validation.ts";
export type ProgramKind = "program" | "cohort" | "recipient" | "enrollment";
export function parseProgramForm(kind: ProgramKind, form: FormData) {
  const v = formValues(form), errors: Record<string, string> = {};
  const names = kind === "program" ? ["name", "description", "funding_program_id"] : kind === "cohort" ? ["program_id", "label", "year"] : kind === "recipient" ? ["name", "contact_id", "organization_id", "alumni_since", "notes"] : ["program_id", "cohort_id", "recipient_id", "support_amount", "education_level", "institution", "field_of_study", "graduation_status", "graduation_date", "employment_status", "employment_field", "notes"];
  const out: Record<string, string | null> = Object.fromEntries(names.map(name => [name, v[name]?.trim() || null]));
  const required = kind === "program" ? ["name"] : kind === "cohort" ? ["program_id", "label"] : kind === "enrollment" ? ["program_id", "cohort_id", "recipient_id"] : [];
  for (const name of required) if (!out[name]) errors[name] = "This field is required.";
  if (kind === "recipient" && !out.name && !out.contact_id) errors.name = "Enter a recipient name or link an existing contact.";
  for (const name of ["funding_program_id", "program_id", "cohort_id", "recipient_id", "contact_id", "organization_id"]) if (out[name] && !validId(out[name]!)) errors[name] = "Select an existing record.";
  for (const name of ["alumni_since", "graduation_date"]) if (out[name] && !validDate(out[name]!)) errors[name] = "Enter a valid calendar date.";
  if (out.year && (!/^\d{1,4}$/.test(out.year) || Number(out.year) < 1)) errors.year = "Enter a year from 1 to 9999.";
  if (out.support_amount && !/^\d+(\.\d{1,2})?$/.test(out.support_amount)) errors.support_amount = "Enter a nonnegative CAD amount with at most two decimals, or leave unknown.";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return out;
}
