import { DataTable } from "./data-table";
import Link from "next/link";
import { crmContext } from "../lib/crm-context";
import { businessToday } from "../lib/activity-data";
import { contributions,givingSummary,type Contribution,type GivingSummary } from "../lib/giving-data";
import { money } from "../lib/giving-validation";
export function GivingTable({records,showPledged=false,searchable=true}:{records:Contribution[];showPledged?:boolean;searchable?:boolean}) {
 return <DataTable searchable={searchable} label="Contributions" emptyMessage="No contributions recorded." columns={[{key:'donor',label:'Organization / Contact'},{key:'date',label:'Date'},{key:'amount',label:'Amount / Type',align:'right'},...(showPledged?[{key:'pledged',label:'Active cash pledged',align:'right' as const}]:[]),{key:'level',label:'Level'},{key:'program',label:'Program / Event'},{key:'stage',label:'Funding stage'},{key:'payment',label:'Payment'},{key:'received',label:'Cash received',align:'right'},{key:'outstanding',label:'Outstanding',align:'right'}]} rows={records.map(c=>({id:c.id,href:`/giving/${c.id}`,cells:{donor:{text:c.organization_name||c.contact_name||'Unlinked contribution',href:`/giving/${c.id}`,kind:'identity',hint:c.sponsorship_level||`Ref ${c.id.slice(-6)}`},date:{text:c.contribution_date,kind:'date'},amount:{text:money(c.amount),sortValue:c.amount,hint:c.contribution_type},pledged:{text:money(c.pledged),sortValue:c.pledged},level:{text:c.sponsorship_level},program:{text:[c.program_name,c.event_name].filter(Boolean).join(' / ')||'Not linked'},stage:{text:c.funding_status,kind:'status',statusDomain:'funding'},payment:{text:c.contribution_type==='Cash'?c.payment_status:'Not cash',kind:'status',statusDomain:'payment'},received:{text:money(c.cash_received),sortValue:c.cash_received},outstanding:{text:money(c.outstanding),sortValue:c.outstanding}}}))}/>;
}
export async function FinancialSummary({year,organization,contact}:{year?:number;organization?:string;contact?:string}) {
 const {client}=await crmContext();
 let summary;
 try {const today=await businessToday(client);summary=await givingSummary(client,year??Number(today.slice(0,4)),{organization,contact});}
 catch {return <section className="card my-5 p-5" role="status">Financial summary unavailable. Apply reviewed migrations locally and check access. No totals can be verified.</section>;}
 return <FinancialSummaryValues summary={summary}/>;
}
export function FinancialSummaryValues({summary:s,cashLabel="Cash received this year"}:{summary:GivingSummary;cashLabel?:string}) {
 return <section className="financial-summary my-5" aria-label="Financial summary"><h2 className="text-xl font-bold">Giving summary · {s.year} · CAD</h2><p className="my-2 text-sm">{s.comparison_basis}; through {s.period_end}. Cash receipts only, excluding voids. Pledges are not received revenue.</p><dl className="report-summary-grid">{[[cashLabel,money(s.annual_cash)],["Lifetime cash received",money(s.lifetime_cash)],["Prior comparable cash",money(s.prior_cash)],["Active cash commitments",money(s.pledged)],["Outstanding cash balance",money(s.outstanding)],["In-kind declared value (separate)",money(s.in_kind_declared)],["YoY Change",`${money(s.yoy_delta)} / ${s.yoy_percent===null?"Percentage unavailable: no prior baseline or period not started":s.yoy_percent+"%"}`]].map(([label,value])=><div className="summary-value" key={label}><dt className="text-sm text-[var(--cbc-muted)]">{label}</dt><dd className={label==='YoY Change'||value.length>24?'summary-explanation':undefined}>{value}</dd></div>)}</dl></section>;
}
export async function GivingHistory({organization,contact}:{organization?:string;contact?:string}) {
 const {client}=await crmContext();let records;
 try {records=await contributions(client,{organization,contact},true);}catch{return <section id="giving-history" className="card mt-5 p-5">Giving history unavailable. No cash totals inferred.</section>;}
 return <section id="giving-history" className="mt-5"><h2 className="text-xl font-bold">Giving History</h2><FinancialSummary organization={organization} contact={contact}/><div className="card p-4"><p className="mb-3">Current Contribution: active cash commitments and receipt balances below. Renewal Date is manually scheduled per agreement.</p><GivingTable records={records}/>{records.filter(c=>c.renewal_date).map(c=><p key={c.id}><Link href={`/giving/${c.id}`}>Renewal Date · {c.organization_name||c.contact_name||c.contribution_date}</Link>: {c.renewal_date}</p>)}</div></section>;
}
