import { notFound } from "next/navigation";
import { Shell } from "../../../../../../components/shell";
import { CrmForm } from "../../../../../../components/crm-form";
import { financeContext,receiptFields,type Receipt } from "../../../../../../lib/giving-data";
import { validId } from "../../../../../../lib/crm-validation";
import { saveReceipt } from "../../../../actions";
export default async function EditReceipt({params}:{params:Promise<{id:string;receiptId:string}>}) {
 const {id,receiptId}=await params,{client,financialWriter}=await financeContext();if(!financialWriter) throw new Error("Admin or Finance access required.");
 if(!validId(id)||!validId(receiptId)) notFound();
 const {data,error}=await client.from("giving_receipts").select("*").eq("id",receiptId).eq("contribution_id",id).maybeSingle();if(error) throw new Error("Unable to load receipt.");if(!data) notFound();const r=data as Receipt;
 return <Shell><h1 className="text-3xl font-bold">Edit cash receipt</h1><CrmForm action={saveReceipt.bind(null,id,true)} fields={receiptFields} values={{...r,is_void:r.is_void?"true":"false",disposition:r.is_void?"void":"active"}} cancelHref={`/giving/${id}`}/></Shell>;
}
