import { formValues, validId, ValidationError } from "./crm-validation.ts";
export const interestMultiFields = ["program_ids", "activity_ids", "task_ids"] as const;
export function interestValues(form: FormData) {
  return { ...formValues(form), ...Object.fromEntries(interestMultiFields.map(name => [name, form.getAll(name).map(String)])) };
}
export function parseInterest(form: FormData) {
  const v = formValues(form), errors: Record<string, string> = {};
  const values = Object.fromEntries(["organization_id", "primary_contact_id", "opportunity_id", "category", "strength", "notes"].map(name => [name, v[name]?.trim() || null]));
  if (!values.organization_id) errors.organization_id = "Organization is required.";
  if (!values.category) errors.category = "Interest Category is required.";
  for (const name of ["organization_id", "primary_contact_id", "opportunity_id"]) {
    if (values[name] && !validId(values[name]!)) errors[name] = "Select an existing record.";
  }
  const links = Object.fromEntries(interestMultiFields.map(name => {
    const ids = [...new Set(form.getAll(name).map(String))];
    if (ids.some(id => !validId(id))) errors[name] = "Select existing linked records.";
    return [name, ids];
  }));
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { values, programs: links.program_ids, activities: links.activity_ids, tasks: links.task_ids };
}
export function parseOpportunity(form: FormData) {
  const v = formValues(form), errors: Record<string, string> = {};
  if (!validId(v.organization_id ?? "")) errors.organization_id = "Select an organization.";
  if (!v.name?.trim()) errors.name = "Opportunity name is required.";
  const amount = v.estimated_amount?.trim() || null;
  if (amount && !/^\d+(\.\d{1,2})?$/.test(amount)) errors.estimated_amount = "Enter a nonnegative estimate with at most two decimals.";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { organization_id: v.organization_id, name: v.name.trim(), estimated_amount: amount };
}
