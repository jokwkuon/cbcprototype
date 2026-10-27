import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../components/shell";
import { DetailFields } from "../../../components/fields";
import { CrmForm } from "../../../components/crm-form";
import { FinancialSummary } from "../../../components/giving";
import { contributions,financeContext,receiptFields,documentFields,type Receipt } from "../../../lib/giving-data";
import { money } from "../../../lib/giving-validation";
import { saveReceipt,addDocument } from "../actions";
export default async function GivingDetail({params}:{params:Promise<{id:string}>}) {
 const {id}=await params,{client,financialWriter}=await financeContext(),[c]=await contributions(client,{id});if(!c) notFound();
 const [receipts,documents]=await Promise.all([client.from("giving_receipts").select("*").eq("contribution_id",id).order("received_on",{ascending:false}),client.from("giving_document_links").select("*").eq("contribution_id",id)]);
 if(receipts.error||documents.error) throw new Error("Unable to load receipts or documents.");
 return <Shell><Link href="/giving">← Sponsorship &amp; Giving</Link><div className="my-5 flex justify-between"><h1 className="text-3xl font-bold">Contribution · {c.contribution_date}</h1>{financialWriter&&<Link href={`/giving/${id}/edit`}>Edit contribution</Link>}</div><section className="card p-5"><DetailFields fields={[
 ["Organization",c.organization_id?<Link href={`/organizations/${c.organization_id}`}>{c.organization_name}</Link>:"Not linked"],["Contact",c.contact_id?<Link href={`/contacts/${c.contact_id}`}>{c.contact_name}</Link>:"Not linked"],["Contribution Date",c.contribution_date],["Amount",money(c.amount)],["Contribution Type",c.contribution_type],["Sponsorship Level",c.sponsorship_level],["Program / Event",[c.program_name,c.event_name].filter(Boolean).join(" / ")],["Funding Status",c.funding_status],["Payment Status",c.contribution_type==="Cash"?c.payment_status:"Not cash"],["Agreement Start",c.agreement_start],["Agreement End",c.agreement_end],["Renewal Date (manual)",c.renewal_date],["Pledged",money(c.pledged)],["Cash received",money(c.cash_received)],["Outstanding Commitment",money(c.outstanding)],["Notes",c.notes]]}/></section>
 {(c.organization_id||c.contact_id)&&<><h2 className="mt-6 text-xl font-bold">Linked donor giving</h2><FinancialSummary organization={c.organization_id??undefined} contact={c.organization_id?undefined:c.contact_id??undefined}/></>}
 {!c.organization_id&&!c.contact_id&&<p className="my-4">Current-Year Giving, Lifetime Giving and YoY Change: link an organization or contact to calculate donor totals.</p>}
 <section className="card my-5 p-5"><h2 className="text-xl font-bold">Cash receipts</h2><p>Only dated, non-void receipts count as received cash. Partial payments are supported.</p>{(receipts.data as Receipt[]).map(r=><div key={r.id} className="my-3 border-t pt-3"><p>{r.received_on} · {money(r.amount)} · {r.is_void?`Voided: ${r.void_reason}`:"Active"} · {r.reference}</p>{financialWriter&&<Link href={`/giving/${id}/receipts/${r.id}/edit`}>Edit receipt</Link>}</div>)}{!receipts.data.length&&<p>No cash receipts.</p>}</section>
 {financialWriter&&c.contribution_type==="Cash"&&<section><h2 className="text-xl font-bold">Add cash receipt</h2><CrmForm action={saveReceipt.bind(null,id,false)} fields={receiptFields} values={{disposition:"active"}} cancelHref={`/giving/${id}`}/></section>}
 <section className="card mt-5 p-5"><h2 className="text-xl font-bold">Documents</h2><p>Reference links only; external access is managed separately.</p>{documents.data.map(d=><p key={d.id}><a href={d.url} target="_blank" rel="noopener noreferrer">{d.label}</a></p>)}{!documents.data.length&&<p>No document references.</p>}</section>
 {financialWriter&&<CrmForm action={addDocument.bind(null,id)} fields={documentFields} cancelHref={`/giving/${id}`}/>}</Shell>;
}
