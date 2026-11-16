import { validId, ValidationError, formValues } from "./crm-validation.ts";
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
}
export function activityValues(form: FormData) {
  return { ...formValues(form), contact_ids: form.getAll("contact_ids").map(String) };
}
export function parseActivity(form: FormData) {
  const values = formValues(form), errors: Record<string,string> = {};
  const occurred = values.occurred_at?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(occurred) || !Number.isFinite(Date.parse(occurred+"Z")) || new Date(occurred+"Z").toISOString().slice(0,16)!==occurred) errors.occurred_at="Enter a valid UTC date and time.";
  if (!values.activity_type?.trim()) errors.activity_type="Activity Type is required.";
  if (values.organization_id && !validId(values.organization_id)) errors.organization_id="Select an existing organization.";
  const contacts=[...new Set(form.getAll("contact_ids").map(String))];
  if (contacts.some(id=>!validId(id))) errors.contact_ids="Select existing contacts.";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { values: {
    organization_id:values.organization_id?.trim()||null, occurred_at:occurred+":00.000Z",activity_type:values.activity_type.trim(),
    location:values.location?.trim()||null,purpose:values.purpose?.trim()||null,key_discussion:values.key_discussion?.trim()||null,
    sponsor_needs:values.sponsor_needs?.trim()||null,cbc_opportunity:values.cbc_opportunity?.trim()||null,outcome:values.outcome?.trim()||null,
  }, contacts };
}
export function parseFollowUp(form: FormData) {
  const values=formValues(form), errors:Record<string,string>={};
  if (!values.description?.trim()) errors.description="Next Action is required.";
  if (values.owner_id && !validId(values.owner_id)) errors.owner_id="Select a permitted staff member.";
  if (values.due_date && !validDate(values.due_date)) errors.due_date="Enter a valid due date.";
  if (values.completion && !["open","complete"].includes(values.completion)) errors.completion="Choose Open or Complete.";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { description:values.description.trim(),owner_id:values.owner_id?.trim()||null,due_date:values.due_date||null,complete:values.completion==="complete" };
}

export function utcInputValue(timestamp:string) { return new Date(timestamp).toISOString().slice(0,16); }
