"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { financeContext } from "../../lib/giving-data";
import { parseGiving } from "../../lib/giving-validation";
import { businessToday } from "../../lib/activity-data";
import { formValues,recordId,validId,ValidationError,type FormState } from "../../lib/crm-validation";
async function save(kind:"contribution"|"receipt"|"initiative"|"document",editing:boolean,parent:string|null,form:FormData):Promise<FormState> {
 let target="/giving";
 try {
  const {client,financialWriter}=await financeContext();if(!financialWriter) throw new Error("Admin or Finance access required.");
  if(parent&&!validId(parent)) throw new Error("Invalid contribution identifier.");
  const payload=parseGiving(form,kind,kind==="receipt"?await businessToday(client):undefined);
  const table={contribution:"contributions",receipt:"cash_receipts",initiative:"funding_initiatives",document:"giving_document_links"}[kind];
  let query=editing?client.from(table).update(payload).eq("id",recordId(form)):client.from(table).insert({...payload,...(parent?{contribution_id:parent}:{})});
  if(editing&&parent) query=query.eq("contribution_id",parent);
  const {data,error}=await query.select("id").single();
  if(error||!data) throw new Error("Unable to save. Check access, linked records, cash type, dates and amount, then try again.");
  target=parent?`/giving/${parent}`:kind==="contribution"?`/giving/${data.id}`:"/giving/new";
 } catch(error) {return {values:formValues(form),errors:error instanceof ValidationError?error.errors:undefined,message:error instanceof Error?error.message:"Unable to save giving record."};}
 for(const path of ["/giving","/organizations","/contacts"]) revalidatePath(path,"layout");revalidatePath("/dashboard");redirect(target);
}
export async function createContribution(_state:FormState,form:FormData){return save("contribution",false,null,form);}
export async function updateContribution(_state:FormState,form:FormData){return save("contribution",true,null,form);}
export async function saveReceipt(parent:string,editing:boolean,_state:FormState,form:FormData){return save("receipt",editing,parent,form);}
export async function addDocument(parent:string,_state:FormState,form:FormData){return save("document",false,parent,form);}
export async function createInitiative(_state:FormState,form:FormData){return save("initiative",false,null,form);}
