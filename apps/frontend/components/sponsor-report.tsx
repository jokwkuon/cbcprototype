import Link from "next/link";
import type { crmContext } from "../lib/crm-context";
import { sponsorReport } from "../lib/report-data";
import { ReportFilterError } from "../lib/report-validation";
import { displayTime } from "../lib/activity-data";
export async function SponsorReport({client,organization:rawOrganization}:{client:Awaited<ReturnType<typeof crmContext>>["client"];organization?:string|string[]}) {
  let report;
  try {report=await sponsorReport(client,rawOrganization);}
  catch(error){return <section className="card my-5 p-5" role="alert"><h2 className="text-xl font-bold">Sponsor report unavailable</h2><p>{error instanceof ReportFilterError?error.message:"Unable to load complete relationship records. No missing history is inferred."}</p><Link href="/reports/sponsor">Reset filters and retry</Link></section>;}
  const {organizations,organization,records,activities,opportunities}=report;
  return <>
    <form className="my-5 flex flex-wrap gap-3" action="/reports/sponsor"><label>Organization<select name="organization" aria-label="Report organization" defaultValue={organization} required><option value="">Select organization</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label><button>Apply report filters</button></form>
    <p>Recorded organization evidence only. Selection does not classify an organization as a sponsor. All recorded dates are shown; no period performance, renewal rate or risk score is inferred.</p>
    {!organization?<p className="my-4" role="status">Select an organization to view its recorded relationship evidence.</p>:<>
      <Link className="underline" href={`/reports/sponsor/export?organization=${organization}`}>Export agreement dates CSV</Link>
      <p className="my-4"><Link className="underline" href={`/organizations/${organization}`}>View organization details</Link></p>
      <section className="card my-5 p-5" aria-label="Recorded agreements and renewals"><h2 className="text-xl font-bold">Recorded agreements and renewals</h2><p>Dates are manually recorded per contribution, including future planning dates. No automatic renewal schedule or eligible sponsor population is defined.</p>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Giving record","Type / planning stage","Agreement start","Agreement end","Renewal date (manual)"].map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{records.map(c=><tr className="border-t" key={c.id}><td className="p-3"><Link className="underline" href={`/giving/${c.id}`}>{c.contribution_date} · {c.sponsorship_level||"Contribution"}</Link></td><td>{c.contribution_type} / {c.funding_status}</td><td>{c.agreement_start||"Not recorded"}</td><td>{c.agreement_end||"Not recorded"}</td><td>{c.renewal_date||"Not recorded"}</td></tr>)}</tbody></table></div>{!records.length&&<p role="status">No contributions or agreement dates recorded for this organization.</p>}
      </section>
      <section className="card my-5 p-5" aria-label="Recorded interactions"><h2 className="text-xl font-bold">Recorded interactions</h2><p>Explicit organization links; dates may include planned future interactions. No automatic sponsor engagement classification.</p>{activities.map(a=><p className="my-3" key={a.id}><Link className="underline" href={`/activities/${a.id}`}>{a.purpose||a.activity_type}</Link> · {displayTime(a.occurred_at)}</p>)}{!activities.length&&<p role="status">No organization-linked interactions recorded.</p>}</section>
      <section className="card my-5 p-5" aria-label="Opportunity references"><h2 className="text-xl font-bold">Opportunity references</h2><p>Explicit organization-bound references, not pipeline stages or received cash. Estimate currency definition remains pending; estimates are not totaled.</p>{opportunities.map(o=><p className="my-3" key={o.id}><Link className="underline" href={`/interests/opportunities/${o.id}`}>{o.name}</Link></p>)}{!opportunities.length&&<p role="status">No opportunity references recorded.</p>}</section>
    </>}
    <section className="card my-5 p-5"><h2 className="text-xl font-bold">Pipeline and renewal performance — Definition pending</h2><p>Approved pipeline stages/totals, sponsor eligibility, renewal rate, automatic scheduling and risk rules are not defined. No performance totals are calculated.</p></section>
  </>;
}
