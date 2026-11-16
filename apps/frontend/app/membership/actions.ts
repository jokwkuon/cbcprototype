'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { crmContext } from '../../lib/crm-context';
import { parseMembership } from '../../lib/membership-validation';
import { formValues, recordId, ValidationError, type FormState } from '../../lib/crm-validation';
export async function saveMembership(editing:boolean,_state:FormState,form:FormData):Promise<FormState>{
 let id:string;
 try{
  const {client,canWrite}=await crmContext();if(!canWrite)throw new Error('Your role cannot change memberships.');
  const values=parseMembership(form);
  if(values.contact_id&&values.organization_id){
   const {data,error}=await client.from('contacts').select('id').eq('id',values.contact_id).eq('organization_id',values.organization_id).maybeSingle();
   if(error||!data)throw new ValidationError({organization_id:"Select the contact's organization or leave it blank to inherit affiliation."});
  }
  const query=editing?client.from('memberships').update(values).eq('id',recordId(form)):client.from('memberships').insert(values);
  const {data,error}=await query.select('id').single();if(error||!data)throw new Error('Unable to save membership. Check values, relationships and permissions.');id=data.id;
 }catch(error){return {values:formValues(form),errors:error instanceof ValidationError?error.errors:undefined,message:error instanceof Error?error.message:'Unable to save membership.'};}
 revalidatePath('/membership','layout');revalidatePath('/dashboard');redirect(`/membership/${id}`);
}
