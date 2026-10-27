import Link from "next/link";
import { crmContext } from "../lib/crm-context";
import { businessToday } from "../lib/activity-data";
import { contributions,givingSummary,type Contribution } from "../lib/giving-data";
import { money } from "../lib/giving-validation";
export function GivingTable({records}:{records:Contribution[]}) {
 return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Date","Organization / Contact","Amount / Type","Level","Program / Event","Funding / Payment","Cash received","Outstanding"].map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{records.map(c=><tr key={c.id} className="border-t"><td className="p-3"><Link className="underline" href={`/giving/${c.id}`}>{c.contribution_date}</Link></td><td>{c.organization_name||c.contact_name||"Not linked"}</td><td>{money(c.amount)}<br/>{c.contribution_type}</td><td>{c.sponsorship_level||"—"}</td><td>{[c.program_name,c.event_name].filter(Boolean).join(" / ")||"—"}</td><td>{c.funding_status}<br/>{c.contribution_type==="Cash"?c.payment_status:"Not cash"}</td><td>{money(c.cash_received)}</td><td>{money(c.outstanding)}</td></tr>)}</tbody></table>{!records.length&&<p className="p-4">No contributions recorded.</p>}</div>;
}
export async function FinancialSummary({year,organization,contact}:{year?:number;organization?:string;contact?:string}) {
 const {client}=await crmContext();
 let summary;
 try {const today=await businessToday(client);summary=await givingSummary(client,year??Number(today.slice(0,4)),{organization,contact});}
 catch {return <section className="card my-5 p-5" role="status">Financial summary unavailable. Apply reviewed migrations locally and check access. No totals can be verified.</section>;}
 const s=summary;
 return <section className="card my-5 p-5" aria-label="Financial summary"><h2 className="text-xl font-bold">Giving summary · {s.year} · CAD</h2><p className="my-2 text-sm">{s.comparison_basis}; through {s.period_end}. Cash receipts only, excluding voids. Pledges are not received revenue.</p><dl className="grid gap-4 sm:grid-cols-3">{[["Current-Year Giving / annual cash received",money(s.annual_cash)],["Lifetime Giving / cash received",money(s.lifetime_cash)],["Prior comparable cash",money(s.prior_cash)],["Pledged (all-time active cash commitments)",money(s.pledged)],["Outstanding Commitment (all-time)",money(s.outstanding)],["In-kind declared value (separate)",money(s.in_kind_declared)],["YoY Change",`${money(s.yoy_delta)} / ${s.yoy_percent===null?"Percentage unavailable: no prior baseline or period not started":s.yoy_percent+"%"}`]].map(([label,value])=><div key={label}><dt className="text-sm text-[var(--cbc-muted)]">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl></section>;
}
export async function GivingHistory({organization,contact}:{organization?:string;contact?:string}) {
 const {client}=await crmContext();let records;
 try {records=await contributions(client,{organization,contact});}catch{return <section id="giving-history" className="card mt-5 p-5">Giving history unavailable. No cash totals inferred.</section>;}
 return <section id="giving-history" className="mt-5"><h2 className="text-xl font-bold">Giving History</h2><FinancialSummary organization={organization} contact={contact}/><div className="card p-4"><p className="mb-3">Current Contribution: active cash commitments and receipt balances below. Renewal Date is manually scheduled per agreement.</p><GivingTable records={records}/>{records.filter(c=>c.renewal_date).map(c=><p key={c.id}><Link href={`/giving/${c.id}`}>Renewal Date · {c.organization_name||c.contact_name||c.contribution_date}</Link>: {c.renewal_date}</p>)}</div></section>;
}
