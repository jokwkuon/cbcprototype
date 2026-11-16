import { StatusBadge } from "../../components/data-table";
import Link from "next/link";
import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { Icon } from "../../components/icons";
import { GivingTrend, RelationshipBreakdown } from "../../components/dashboard-charts";
import { FinancialSummary } from "../../components/giving";
import { ActionQueue } from "../../components/action-queue";
import { AgreementRenewals, ExecutiveSections } from "../../components/executive-sections";
import { crmContext } from "../../lib/crm-context";
import { businessToday } from "../../lib/activity-data";
import { givingSummary, type GivingSummary } from "../../lib/giving-data";
import { memberships } from "../../lib/membership-data";
import { money } from "../../lib/giving-validation";
import { localDate } from "../../lib/presentation";

function KpiCard({ label, value, context, href, icon, pending = false }: { label: string; value: string; context: string; href?: string; icon: string; pending?: boolean }) {
  const body = <><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon name={icon} size={15} /></span></div><p className="metric-number">{value}</p><span className="metric-context">{context}</span></>;
  return href && !pending ? <Link href={href} className="card metric-card">{body}</Link> : <div className={`card metric-card${pending ? " is-pending" : ""}`}>{body}</div>;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ work?: string; workPage?: string }> }) {
  const { work, workPage } = await searchParams;
  const scope = work === "mine" || work === "unassigned" ? work : "team";
  const { client: c, canWrite } = await crmContext();
  const relationshipStatuses = ["Prospect", "Cultivate", "Proposal", "Committed", "Active", "Lapsed"];
  const [orgResult, contactResult, recentResult, ...statusResults] = await Promise.all([
    c.from("organizations").select("id", { count: "exact", head: true }),
    c.from("contacts").select("id", { count: "exact", head: true }),
    c.from("organizations").select("id,name,created_at,relationship_status").order("created_at", { ascending: false }).limit(5),
    ...relationshipStatuses.map(status => c.from("organizations").select("id", { count: "exact", head: true }).eq("relationship_status", status)),
  ]);
  const failed = [orgResult, contactResult, recentResult, ...statusResults].some(result => result.error) || orgResult.count === null || contactResult.count === null || statusResults.some(result => result.count === null);
  const counts = Object.fromEntries(relationshipStatuses.map((status, index) => [status, statusResults[index]?.count ?? 0]));
  let finance: GivingSummary | null = null;
  try {
    const today = await businessToday(c);
    finance = await givingSummary(c, Number(today.slice(0, 4)));
  } catch { finance = null; }
  let activeMembers: number | null = null;
  try { activeMembers = (await memberships(c)).filter(term => term.status === "Current term").length; } catch { activeMembers = null; }
  const revenueContext = finance ? `${finance.year} received cash · ${finance.comparison_basis}. Commitments are excluded.${finance.yoy_percent === null ? "" : ` Year-over-year change ${money(finance.yoy_delta)} (${finance.yoy_percent}%).`}` : "Received cash could not be loaded. No zero is assumed.";

  return <Shell>
    <PageHeader title="Executive Dashboard" subtitle="Live view of CBC funding, relationships, programs, membership and community impact." action={<Link className="button button-secondary" href="/reports/executive"><Icon name="reports" size={14} />Export report</Link>} />
    {canWrite && <div className="dashboard-quick"><Link className="button button-primary" href="/activities/new"><Icon name="plus" size={13} />Log an interaction</Link><Link className="button" href="/organizations/new">Add organization</Link><Link className="button" href="/giving/new">Record a contribution</Link><Link className="button" href="/membership/new">Start a membership</Link></div>}
    <section className="metric-grid exec-kpis" aria-label="Executive KPIs">
      <KpiCard label="Sponsorship revenue" value={finance ? money(finance.annual_cash) : "Unavailable"} context={revenueContext} href={finance ? `/reports/financial?year=${finance.year}` : "/reports/financial"} icon="giving" />
      <KpiCard label="Active sponsors" value={failed ? "Unavailable" : String(counts.Active || 0)} context="Organizations with relationship status Active. There is no separate sponsor category." href="/organizations?status=Active" icon="organizations" />
      <KpiCard label="Sponsor pipeline" value={finance ? money(finance.pledged) : "Unavailable"} context="Open cash commitments (Committed or Invoiced). This is not received revenue." href="/giving?balance=outstanding" icon="activities" />
      <KpiCard label="Renewal rate" value="Pending" context="No approved renewal-rate formula. Scheduled renewal dates are listed with funding and membership." icon="clock" pending />
      <KpiCard label="Active members" value={activeMembers === null ? "Unavailable" : String(activeMembers)} context="Membership terms that have started and are not past their renewal date." href="/membership" icon="membership" />
    </section>
    {failed ? <section className="card p-6 mb-5" role="alert"><h2>Relationship dashboard unavailable</h2><p>Unable to load organization and contact counts or statuses. Reload to retry. No zero counts are implied.</p></section> : <section className="card p-6 my-5" aria-label="Sponsor and donor relationships">
      <div className="section-title"><h2>Sponsor &amp; donor relationships</h2><Link href="/organizations">View organizations</Link></div>
      <div className="exec-stats">
        <div><span>Active</span><b>{counts.Active || 0}</b></div>
        <div><span>Prospects</span><b>{counts.Prospect || 0}</b></div>
        <div><span>Proposal</span><b>{counts.Proposal || 0}</b></div>
        <div><span>At risk</span><b>Pending</b></div>
      </div>
      <p className="pending-note">At risk is not counted. CBC has not approved a rule for it. Lapsed and other recorded statuses stay in the list below.</p>
      <p className="relationship-totals"><span>Total organizations</span> <b>{orgResult.count}</b> <span>Total contacts</span> <b>{contactResult.count}</b></p>
      <div className="exec-split">
        <RelationshipBreakdown counts={counts} />
        <div className="card">
          <div className="section-title px-5 pt-5"><h2>Recently added</h2><Link href="/organizations">View all</Link></div>
          <div className="table-scroll"><table><thead><tr><th>Organization</th><th>Status</th><th>Added</th></tr></thead><tbody>{recentResult.data?.map(row => <tr key={row.id}><td><Link href={`/organizations/${row.id}`}>{row.name}</Link></td><td><StatusBadge domain="relationship" value={row.relationship_status} /></td><td>{localDate(row.created_at)}</td></tr>)}</tbody></table>{!recentResult.data?.length && <p className="p-5">No organizations yet.</p>}</div>
        </div>
      </div>
    </section>}
    <section className="card p-6 my-5" aria-label="Funding and financial health">
      <div className="section-title"><h2>Funding &amp; financial health</h2><Link href="/reports/financial">Financial report</Link></div>
      <p className="pending-note">No annual fundraising target is stored, so percent of goal is not shown. Event ROI is not shown because event cost is not recorded and no formula is approved.</p>
      {finance && <div className="report-bars exec-money-bars" aria-label="Received cash and outstanding commitments">
        <div><span>Received this year</span><div><i style={{ width: `${Number(finance.annual_cash) / Math.max(Number(finance.annual_cash), Number(finance.outstanding), 1) * 100}%` }} /></div><b>{money(finance.annual_cash)}</b></div>
        <div><Link href="/giving?balance=outstanding">Outstanding now</Link><div><i style={{ width: `${Number(finance.outstanding) / Math.max(Number(finance.annual_cash), Number(finance.outstanding), 1) * 100}%` }} /></div><b>{money(finance.outstanding)}</b></div>
      </div>}
      {finance && <p className="chart-caption">Received cash is this calendar period only. Outstanding is the current balance on open commitments. The bars are not a percent of a goal, and commitments are not treated as cash.</p>}
      <AgreementRenewals />
      <FinancialSummary />
      <GivingTrend client={c} />
    </section>
    <ActionQueue compact scope={scope} requestedPage={workPage} />
    <ExecutiveSections contactCount={failed || contactResult.count === null ? null : contactResult.count} />
  </Shell>;
}
