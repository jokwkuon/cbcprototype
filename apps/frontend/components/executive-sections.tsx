import Link from "next/link";
import { crmContext } from "../lib/crm-context";
import { memberships } from "../lib/membership-data";
import { pairs } from "../lib/mentorship-data";
import { programSummary } from "../lib/program-data";
import { readAll } from "../lib/read-all";
import { businessToday } from "../lib/activity-data";
import { localDate } from "../lib/presentation";
import { money } from "../lib/giving-validation";

function unavailable(name: string) {
  return <p role="alert">{name} unavailable. Reload to retry; no zero implied.</p>;
}
function tally(values: Array<string | null>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value?.trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()];
}

export async function AgreementRenewals() {
  const { client } = await crmContext();
  let upcoming: { id: string; organization_name: string | null; renewal_date: string | null; sponsorship_level: string | null }[] | null = null;
  try {
    const [today, rows] = await Promise.all([
      businessToday(client),
      readAll<{ id: string; organization_name: string | null; renewal_date: string | null; sponsorship_level: string | null; funding_status: string }>((from, to) => client.from("contribution_details").select("id,organization_name,renewal_date,sponsorship_level,funding_status", { count: "exact" }).not("renewal_date", "is", null).order("renewal_date").order("id").range(from, to)),
    ]);
    upcoming = rows.filter(row => row.renewal_date && row.renewal_date >= today && ["Committed", "Invoiced"].includes(row.funding_status)).slice(0, 5);
  } catch { upcoming = null; }
  if (!upcoming) return <p role="status">Agreement renewals unavailable. No renewal rate is inferred.</p>;
  return <div className="my-4"><h3>Upcoming agreement renewals</h3>{upcoming.length ? <ul>{upcoming.map(row => <li key={row.id}><Link href={`/giving/${row.id}`}>{row.organization_name || "Unlinked contribution"}</Link> — {localDate(row.renewal_date)}{row.sponsorship_level ? ` · ${row.sponsorship_level}` : ""}</li>)}</ul> : <p>No future agreement renewal dates recorded.</p>}<p>These dates are typed on each agreement. They are not a renewal rate.</p></div>;
}

export async function ExecutiveSections({ contactCount }: { contactCount: number | null }) {
  const { client } = await crmContext();
  const results = await Promise.allSettled([
    memberships(client),
    pairs(client),
    readAll<{ id: string; archived_at: string | null }>((from, to) => client.from("sponsor_interests").select("id,archived_at", { count: "exact" }).order("id").range(from, to)),
    readAll<{ id: string; name: string }>((from, to) => client.from("programs").select("id,name", { count: "exact" }).order("id").range(from, to)),
    readAll<{ id: string; recipient_id: string; graduation_status: string | null; employment_status: string | null }>((from, to) => client.from("program_enrollments").select("id,recipient_id,graduation_status,employment_status", { count: "exact" }).order("id").range(from, to)),
    readAll<{ id: string; purpose: string | null; occurred_at: string; activity_type: string }>((from, to) => client.from("activities").select("id,purpose,occurred_at,activity_type", { count: "exact" }).order("id").range(from, to)),
    readAll<{ id: string; alumni_cash: string | null }>((from, to) => client.from("program_recipient_details").select("id,alumni_cash", { count: "exact" }).order("id").range(from, to)),
    businessToday(client),
    programSummary(client).then(summary => summary, () => null),
  ]);
  const [members, pairRows, interests, programs, enrollments, activities, recipients, today, summary] = results;
  const graduation = enrollments.status === "fulfilled" ? tally(enrollments.value.map(row => row.graduation_status)) : [];
  const employment = enrollments.status === "fulfilled" ? tally(enrollments.value.map(row => row.employment_status)) : [];
  const recordedGraduation = graduation.reduce((total, [, count]) => total + count, 0);
  const recordedEmployment = employment.reduce((total, [, count]) => total + count, 0);
  const alumniAmounts = recipients.status === "fulfilled" ? recipients.value.map(row => row.alumni_cash).filter((value): value is string => value != null && value !== "") : [];
  const alumniCash = alumniAmounts.length ? alumniAmounts.reduce((total, value) => total + Number(value), 0).toFixed(2) : null;
  const programSummaryValue = summary.status === "fulfilled" ? summary.value : null;
  const upcomingMembers = members.status === "fulfilled" && today.status === "fulfilled"
    ? members.value.filter(row => row.renewal_date && row.renewal_date >= today.value).sort((a, b) => a.renewal_date!.localeCompare(b.renewal_date!)).slice(0, 4)
    : [];

  return <>
    <section className="card p-6 my-5" aria-label="Scholarship and education impact">
      <div className="section-title"><h2>Scholarship &amp; education impact</h2><Link href="/reports/scholarship">Scholarship report</Link></div>
      {programs.status === "rejected" || enrollments.status === "rejected" ? unavailable("Programs") : <>
        {programSummaryValue ? <div className="exec-stats">
          <div><span>Participants</span><b>{programSummaryValue.participants}</b><small>Distinct recipients</small></div>
          <div><span>Enrollments</span><b>{programSummaryValue.enrollments}</b><small>Not a scholarship-award count</small></div>
          <div><span>Funds recorded</span><b>{programSummaryValue.known_support == null ? "None recorded" : money(programSummaryValue.known_support)}</b><small>{programSummaryValue.unknown_support_count} enrollment{programSummaryValue.unknown_support_count === 1 ? "" : "s"} without an amount</small></div>
          <div><span>Programs</span><b>{programs.value.length}</b><small>Named programs on file</small></div>
        </div> : <p role="status">Program summary unavailable. Participant and support totals are not shown as zero.</p>}
        <p>{recordedGraduation} of {enrollments.value.length} enrollments have a graduation status recorded. {recordedEmployment} have an employment status recorded.</p>
        {(graduation.length > 0 || employment.length > 0) && <ul className="exec-outcome-list">
          {graduation.map(([label, count]) => <li key={`g-${label}`}>Graduation status · {label}: {count}</li>)}
          {employment.map(([label, count]) => <li key={`e-${label}`}>Employment status · {label}: {count}</li>)}
        </ul>}
        <p className="pending-note">Graduation rate, employment rate and field alignment are not calculated. CBC has not approved the denominator or the alignment rule. Recorded statuses above are counts of what staff entered.</p>
      </>}
    </section>
    <div className="exec-split">
      <section className="card p-6" aria-label="Mentorship and membership">
        <div className="section-title"><h2>Mentorship &amp; membership</h2><Link href="/reports/mentorship">Mentorship report</Link></div>
        <h3>Mentorship</h3>
        {pairRows.status === "rejected" ? unavailable("Mentorship") : <>
          <div className="exec-stats">
            <div><span>Active pairs</span><b>{pairRows.value.filter(row => row.status === "Active").length}</b><small>Manual status Active</small></div>
            <div><span>Completed check-ins</span><b>{pairRows.value.reduce((total, row) => total + Number(row.checkins_completed), 0)}</b><small>Recorded check-ins</small></div>
            <div><span>Pair health</span><b>Pending</b><small>No approved formula</small></div>
          </div>
          <p>{pairRows.value.length} pairings on file. <Link href="/mentorship">Open mentorship</Link></p>
        </>}
        <h3>Membership</h3>
        {members.status === "rejected" || today.status === "rejected" ? unavailable("Membership") : <>
          <div className="exec-stats">
            <div><span>Active members</span><b>{members.value.filter(row => row.status === "Current term").length}</b><small>Current term</small></div>
            <div><span>Renewal overdue</span><b>{members.value.filter(row => row.status === "Renewal overdue").length}</b><small>Renewal date before today</small></div>
            <div><span>Retention</span><b>Pending</b><small>No approved formula</small></div>
          </div>
          <h3>Next membership renewals</h3>
          {upcomingMembers.length ? <ul>{upcomingMembers.map(row => <li key={row.id}><Link href={`/membership/${row.id}`}>{row.member_name}</Link> — {localDate(row.renewal_date)}</li>)}</ul> : <p>No future membership renewal dates recorded.</p>}
          <p><Link href="/membership?renewals=1">Membership renewals in the next 30 days</Link></p>
          <p className="pending-note">Renewal risk and engagement score are not calculated.</p>
        </>}
      </section>
      <section className="card p-6" aria-label="CBC community impact">
        <div className="section-title"><h2>CBC community impact</h2><Link href="/reports/executive">Executive report</Link></div>
        <div className="exec-stats">
          <div><span>People in programs</span><b>{programSummaryValue && programs.status === "fulfilled" && enrollments.status === "fulfilled" ? programSummaryValue.participants : "Unavailable"}</b><small>Distinct recipients, not every contact</small></div>
          <div><span>Contacts on file</span><b>{contactCount == null ? "Unavailable" : contactCount}</b><small>People records, not a service count</small></div>
          <div><span>Alumni contributions</span><b>{recipients.status === "rejected" ? "Unavailable" : alumniCash == null ? "None recorded" : money(alumniCash)}</b><small>Cash after each alumni date</small></div>
          <div><span>Volunteer hours</span><b>Pending</b><small>Not recorded in this system</small></div>
        </div>
        <p className="pending-note">Alumni cash sums contact-linked receipts on or after an explicit alumni date. When that person is also the sponsor contact, the same receipt is listed here and in sponsorship cash. It is not a second gift. Volunteer hours have no source record.</p>
        <h3>Sponsor interests</h3>
        {interests.status === "rejected" ? unavailable("Sponsor interests") : <p>{interests.value.filter(row => !row.archived_at).length} current interests · {interests.value.length} including archived. <Link href="/interests">Open sponsor interests</Link></p>}
      </section>
    </div>
    <section className="card p-6 my-5 recent-interactions">
      <div className="section-title"><h2>Recent interactions</h2><Link href="/activities">View activities</Link></div>
      {activities.status === "rejected" ? unavailable("Recent interactions") : <ul>{activities.value.filter(row => row.occurred_at <= new Date().toISOString()).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || a.id.localeCompare(b.id)).slice(0, 5).map(row => <li key={row.id} className="timeline-item"><Link href={`/activities/${row.id}`}><time>{localDate(row.occurred_at, true)}</time><span>{row.activity_type} · {row.purpose || "No purpose recorded"}</span></Link></li>)}{!activities.value.length && <li>No interactions recorded.</li>}</ul>}
    </section>
  </>;
}
