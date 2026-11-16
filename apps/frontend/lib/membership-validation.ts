import { formValues, validId, ValidationError } from './crm-validation.ts';
import { validDate } from './activity-validation.ts';
export const membershipFields = ['contact_id','member_organization_id','organization_id','membership_type','industry','start_date','renewal_date','fee','payment_status','notes'];
export function parseMembership(form: FormData) {
 const v=formValues(form), errors: Record<string,string>={};
 const out: Record<string,string|null>=Object.fromEntries(membershipFields.map(k=>[k,v[k]?.trim()||null]));
 if(Boolean(out.contact_id)===Boolean(out.member_organization_id)) errors.contact_id='Select exactly one member: a contact or an organization.';
 for(const k of ['contact_id','member_organization_id','organization_id']) if(out[k]&&!validId(out[k]!)) errors[k]='Select an existing record.';
 for(const k of ['membership_type','start_date']) if(!out[k]) errors[k]='This field is required.';
 for(const k of ['start_date','renewal_date']) if(out[k]&&!validDate(out[k]!)) errors[k]='Enter a valid calendar date.';
 if(out.start_date&&out.renewal_date&&out.renewal_date<out.start_date) errors.renewal_date='Renewal must be on or after the start date.';
 if(out.fee&&!/^\d+(\.\d{1,2})?$/.test(out.fee)) errors.fee='Enter a nonnegative CAD decimal with at most two decimal places.';
 if(out.member_organization_id&&out.organization_id&&out.member_organization_id!==out.organization_id) errors.organization_id='An organization member must use its own organization.';
 if(Object.keys(errors).length) throw new ValidationError(errors);
 return out;
}
