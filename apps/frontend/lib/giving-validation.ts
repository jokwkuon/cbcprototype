import { formValues, validId, ValidationError } from "./crm-validation.ts";
import { validDate } from "./activity-validation.ts";
export const contributionTypes=["Cash","In-Kind"];
export const fundingStatuses=["Prospect","Committed","Invoiced","Cancelled"];
export function money(value:string) {
 const [whole,fraction=""]=value.split(".");
 return `CAD ${whole.replace(/\B(?=(\d{3})+(?!\d))/g,",")}.${fraction.padEnd(2,"0")}`;
}
export function parseGiving(form:FormData,kind:"contribution"|"receipt"|"initiative"|"document",today?:string) {
 const v=formValues(form),errors:Record<string,string>={},out:Record<string,string|boolean|null>={};
 const fields=kind==="contribution"?["organization_id","contact_id","contribution_date","amount","contribution_type","sponsorship_level","funding_status","program_id","event_id","agreement_start","agreement_end","renewal_date","notes"]:kind==="receipt"?["received_on","amount","reference","void_reason"]:kind==="initiative"?["name","kind"]:["label","url"];
 for(const field of fields) out[field]=v[field]?.trim()||null;
 for(const field of kind==="contribution"?["contribution_date","amount","contribution_type","funding_status"]:kind==="receipt"?["received_on","amount"]:fields) {
  if(!out[field]) errors[field]="This field is required.";
 }
 for(const field of ["organization_id","contact_id","program_id","event_id"]) if(out[field]&&!validId(String(out[field]))) errors[field]="Select an existing record.";
 for(const field of ["contribution_date","received_on","agreement_start","agreement_end","renewal_date"]) if(out[field]&&!validDate(String(out[field]))) errors[field]="Enter a valid calendar date.";
 if(kind==="contribution"||kind==="receipt") {
  const amount=String(out.amount??"");
  if(!/^\d+(\.\d{1,2})?$/.test(amount)||(kind==="receipt"&&!/[1-9]/.test(amount))) errors.amount="Enter a positive CAD amount with at most two decimals (pledges may be zero).";
 }
 if(kind==="contribution") {
  if(!contributionTypes.includes(String(out.contribution_type))) errors.contribution_type="Choose Cash or In-Kind.";
  if(!fundingStatuses.includes(String(out.funding_status))) errors.funding_status="Choose a listed planning stage.";
  if(out.agreement_start&&out.agreement_end&&out.agreement_end<out.agreement_start) errors.agreement_end="End must be on or after start.";
 }
 if(kind==="receipt") {
  if(today&&String(out.received_on)>today) errors.received_on="Future amounts are pledges, not received cash.";
  if(!["active","void"].includes(v.disposition??"active")) errors.disposition="Choose Active or Void.";
  out.is_void=v.disposition==="void";
  if(out.is_void&&!out.void_reason) errors.void_reason="A void reason is required.";
 }
 if(kind==="initiative"&&!["Program","Event"].includes(String(out.kind))) errors.kind="Choose Program or Event.";
 if(kind==="document") {
  try {const url=new URL(String(out.url));if(!["http:","https:"].includes(url.protocol)||url.username||url.password||/\s/.test(String(out.url))) throw new Error();}
  catch {errors.url="Enter an HTTP(S) link without embedded credentials.";}
 }
 if(Object.keys(errors).length) throw new ValidationError(errors);
 return out;
}
