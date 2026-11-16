'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {crmContext} from '../../lib/crm-context';
import {parseDocument} from '../../lib/document-validation';
import {formValues,recordId,ValidationError,type FormState} from '../../lib/crm-validation';
export async function saveDocument(editing:boolean,_state:FormState,form:FormData):Promise<FormState>{let id:string;try{const {client,canWrite}=await crmContext();if(!canWrite)throw new Error('Your role cannot edit document metadata.');const values=parseDocument(form);const query=editing?client.from('documents').update(values).eq('id',recordId(form)):client.from('documents').insert(values);const {data,error}=await query.select('id').single();if(error||!data)throw new Error('Unable to save document metadata. Check links, dates and access classification.');id=data.id;}catch(e){return {values:formValues(form),message:e instanceof Error?e.message:'Unable to save.',errors:e instanceof ValidationError?e.errors:undefined};}revalidatePath('/documents','layout');redirect(`/documents/${id}`);}
