import Link from "next/link";
import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { FinancialSummary,GivingTable } from "../../components/giving";
import { contributions,financeContext } from "../../lib/giving-data";
export default async function Giving({searchParams}:{searchParams:Promise<{q?:string;year?:string;balance?:string}>}) {
 const {q="",year,balance}=await searchParams,{client,financialWriter}=await financeContext();
 const unpaid=balance==="outstanding";
 const records=(await contributions(client,undefined,true)).filter(c=>{
  const haystack=`${c.organization_name} ${c.contact_name} ${c.sponsorship_level} ${c.program_name} ${c.event_name} ${c.funding_status} ${c.payment_status} ${c.outstanding}`.toLowerCase();
  if(q && !haystack.includes(q.toLowerCase())) return false;
  if(unpaid) return c.contribution_type==="Cash" && ["Committed","Invoiced"].includes(c.funding_status) && Number(c.outstanding)>0;
  return true;
 });
 const selected=year&&/^\d{4}$/.test(year)&&Number(year)>=2?Number(year):undefined;
 return <Shell><PageHeader title="Sponsorship & Giving" subtitle="A commitment is a promise. Cash received is money that arrived. Outstanding is the unpaid balance on open cash commitments." action={financialWriter&&<Link href="/giving/new">+ Add contribution</Link>}/><form className="my-5 flex gap-3"><input name="q" aria-label="Search giving" defaultValue={q} placeholder="Organization, contact, level or status"/><input name="year" aria-label="Reporting year" defaultValue={year} placeholder="Calendar year"/><select name="balance" aria-label="Balance" defaultValue={unpaid?"outstanding":""}><option value="">All balances</option><option value="outstanding">Outstanding cash</option></select><button>Apply</button></form>{unpaid&&<p className="pending-note">Showing open cash commitments that still have an unpaid balance. Fully received gifts and in-kind support are hidden. These amounts are not revenue.</p>}<FinancialSummary year={selected}/><div className="card"><GivingTable searchable={false} records={records}/></div><p className="my-3 text-sm">Search filters the listing, including payment status. Summary covers all contributions for the selected reporting year; pledge balances are all-time.</p></Shell>;
}
