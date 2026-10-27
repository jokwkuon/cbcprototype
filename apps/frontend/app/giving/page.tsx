import Link from "next/link";
import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { FinancialSummary,GivingTable } from "../../components/giving";
import { contributions,financeContext } from "../../lib/giving-data";
export default async function Giving({searchParams}:{searchParams:Promise<{q?:string;year?:string}>}) {
 const {q="",year}=await searchParams,{client,financialWriter}=await financeContext();
 const records=(await contributions(client)).filter(c=>`${c.organization_name} ${c.contact_name} ${c.sponsorship_level} ${c.program_name} ${c.event_name} ${c.funding_status}`.toLowerCase().includes(q.toLowerCase()));
 const selected=year&&/^\d{4}$/.test(year)&&Number(year)>=2?Number(year):undefined;
 return <Shell><PageHeader title="Sponsorship & Giving" subtitle="Synthetic CAD commitments and actual cash receipts." action={financialWriter&&<Link href="/giving/new">+ Add contribution</Link>}/><form className="my-5 flex gap-3"><input name="q" aria-label="Search giving" defaultValue={q} placeholder="Organization, contact, level or status"/><input name="year" aria-label="Reporting year" defaultValue={year} placeholder="Calendar year"/><button>Apply</button></form><FinancialSummary year={selected}/><div className="card"><GivingTable records={records}/></div><p className="my-3 text-sm">Search filters the listing. Summary covers all contributions for the selected reporting year; pledge balances are all-time.</p></Shell>;
}
