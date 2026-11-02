import Link from "next/link";
import { financialReport } from "../lib/report-data";
import type { crmContext } from "../lib/crm-context";
import { ReportFilterError } from "../lib/report-validation";
import { FinancialSummaryValues, GivingTable } from "./giving";
import { money } from "../lib/giving-validation";
export function ReportLoading() { return <section className="card my-5 p-5" role="status" aria-busy="true">Loading report… No totals are available yet.</section>; }
export async function FinancialReport({client,filters}:{client:Awaited<ReturnType<typeof crmContext>>["client"];filters:{year?:string|string[];organization?:string|string[]}}) {
  let report;
  try { report=await financialReport(client,filters); }
  catch(error) { return <section className="card my-5 p-5" role="alert"><h2 className="text-xl font-bold">Financial report unavailable</h2>
    <p>{error instanceof ReportFilterError?error.message:"Unable to verify the financial summary and all underlying records. No totals are implied. Reload to retry."}</p>
    <Link className="mt-3 inline-block underline" href="/reports/financial">Reset report filters and retry</Link></section>; }
  const {summary,records,periodReceipts,byId,organizations,organization,year}=report;
  return <>
    <form className="my-5 flex flex-wrap items-end gap-3" action="/reports/financial">
      <label>Reporting year<input name="year" aria-label="Reporting year" inputMode="numeric" pattern="[0-9]{4}" defaultValue={String(year).padStart(4,"0")} required/></label>
      <label>Organization<select name="organization" aria-label="Report organization" defaultValue={organization}><option value="">All organizations</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
      <button>Apply report filters</button>
    </form>
    <p>Receipt period: {String(year).padStart(4,"0")}-01-01 through {summary.period_end} ({summary.comparison_basis}). The year filter applies to cash received and the prior comparable period only. Pledged, outstanding, lifetime cash and in-kind totals below are all-time current balances as of {summary.as_of}; they are not historical year-end balances.</p>
    {!records.length&&<p role="status" className="my-4">No contributions recorded in this scope. Verified totals are zero.</p>}
    <FinancialSummaryValues summary={summary} cashLabel="Selected-period cash received"/>
    <section className="card my-5 p-5" aria-label="Received payments in period"><h2 className="mb-3 text-xl font-bold">Received payments in period</h2>
      <p>Actual non-void cash receipts only; pledges and in-kind support are not received cash.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Received on","Giving record","Receipt reference","Received cash"].map(label=><th className="p-3" key={label}>{label}</th>)}</tr></thead>
        <tbody>{periodReceipts.map(r=><tr key={r.id} className="border-t"><td className="p-3">{r.received_on}</td><td><Link className="underline" href={`/giving/${r.contribution_id}`}>{byId.get(r.contribution_id)?.organization_name||byId.get(r.contribution_id)?.contact_name||"Unlinked contribution"} · {r.contribution_id}</Link></td><td>{r.reference||"—"}</td><td>{money(r.amount)}</td></tr>)}</tbody>
        <tfoot><tr><th className="p-3" colSpan={3}>Period cash received</th><td>{money(summary.annual_cash)}</td></tr></tfoot></table></div>
      {!periodReceipts.length&&<p role="status" className="my-3">No received payments in this period.</p>}
    </section>
    <section aria-label="All-time contribution balances"><h2 className="mb-3 text-xl font-bold">All-time contribution balances and giving history</h2><p className="mb-3">Active Cash commitments count as pledged. Prospect/cancelled stages create no outstanding debt; their actual cash receipts remain received cash. In-kind is separate. Each row links to its Giving record.</p><GivingTable records={records} showPledged/></section>
    <section className="card my-5 p-5"><h2 className="text-xl font-bold">Event ROI — Definition pending</h2><p>Approved event revenue/cost allocation and ROI formula are not available. No ROI or profit is calculated. Export and accounting reconciliation/refunds remain pending.</p></section>
  </>;
}
