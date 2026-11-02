'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {crmContext} from '../../lib/crm-context';
import {parseMentorship} from '../../lib/mentorship-validation';
import {formValues,recordId,ValidationError,type FormState} from '../../lib/crm-validation';
export async function saveMentorship(kind:'pair'|'checkin',editing:boolean,_state:FormState,form:FormData):Promise<FormState>{
 let destination:string;
 try{
  if(!['pair','checkin'].includes(kind))throw new Error('Invalid record type.');
  const {client,canWrite}=await crmContext();if(!canWrite)throw new Error('Your role cannot change mentorship records.');
  const values=parseMentorship(kind,form);
  if(kind==='pair'){
   const [{data:contacts,error:ce},{data:cohort,error:pe}]=await Promise.all([client.from('contacts').select('id').eq('organization_id',values.organization_id!).in('id',[values.mentor_id!,values.mentee_id!]),client.from('program_cohorts').select('id').eq('program_id',values.program_id!).eq('id',values.cohort_id!).maybeSingle()]);
   if(ce||contacts?.length!==2)throw new ValidationError({mentor_id:'Both contacts must belong to the selected organization.'});if(pe||!cohort)throw new ValidationError({cohort_id:'Select a cohort belonging to the selected program.'});
  }else{const {data:today,error}=await client.rpc('activity_today');if(error)throw new Error('Date validation unavailable.');if(values.checked_in_on!>today)throw new ValidationError({checked_in_on:'Completed check-ins cannot be future.'});}
  const table=kind==='pair'?'mentorship_pairs':'mentorship_checkins';
  const query=editing?client.from(table).update(values).eq('id',recordId(form)):client.from(table).insert(values);
  const {data,error}=await query.select('id').single();if(error||!data)throw new Error('Unable to save mentorship. Check values, linked records and permissions.');destination=kind==='pair'?data.id:values.pair_id!;
 }catch(e){return {values:formValues(form),message:e instanceof Error?e.message:'Unable to save.',errors:e instanceof ValidationError?e.errors:undefined};}
 revalidatePath('/mentorship','layout');revalidatePath('/dashboard');redirect(`/mentorship/${destination}`);
}
