import {formValues,validId,ValidationError} from './crm-validation.ts';
import {validDate} from './activity-validation.ts';
export const pairFields=['organization_id','mentor_id','mentee_id','program_id','cohort_id','start_date','target_end_date','status','checkin_frequency','issues','next_action','action_due_date'];
export const checkinFields=['pair_id','checked_in_on','mentor_satisfaction','mentee_satisfaction','feedback','issues'];
export function parseMentorship(kind:'pair'|'checkin',form:FormData){
 const v=formValues(form),errors:Record<string,string>={},out:Record<string,string|null>=Object.fromEntries((kind==='pair'?pairFields:checkinFields).map(k=>[k,v[k]?.trim()||null]));
 for(const k of kind==='pair'?['organization_id','mentor_id','mentee_id','program_id','cohort_id','start_date','status']:['pair_id','checked_in_on'])if(!out[k])errors[k]='This field is required.';
 for(const [k,v]of Object.entries(out)){if(v&&k.endsWith('_id')&&!validId(v))errors[k]='Select an existing record.';if(v&&(k.endsWith('_date')||k==='checked_in_on')&&!validDate(v))errors[k]='Enter a valid calendar date.';}
 if(kind==='pair'&&out.mentor_id&&out.mentor_id===out.mentee_id)errors.mentee_id='Mentor and mentee must differ.';
 if(out.target_end_date&&out.start_date&&out.target_end_date<out.start_date)errors.target_end_date='End date must be on or after start.';
 if(Object.keys(errors).length)throw new ValidationError(errors);return out;
}
