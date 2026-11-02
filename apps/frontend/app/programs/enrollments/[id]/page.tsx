import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../../components/shell";
import { DetailFields } from "../../../../components/fields";
import { RecipientEvidence } from "../../../../components/programs";
import { crmContext } from "../../../../lib/crm-context";
import { enrollments } from "../../../../lib/program-data";
import { money } from "../../../../lib/giving-validation";
export default async function EnrollmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, { client, canWrite } = await crmContext(), [e] = await enrollments(client, { id }); if (!e) notFound();
  return <Shell><Link href="/programs">← Programs &amp; Recipients</Link><div className="my-5 flex justify-between"><h1 className="text-3xl font-bold">{e.recipient_name} · {e.program_name}</h1>{canWrite && <Link href={`/programs/enrollments/${id}/edit`}>Edit enrollment</Link>}</div><section className="card p-6"><DetailFields fields={[
    ["Program", <Link key="program" href={`/programs/${e.program_id}`}>{e.program_name}</Link>], ["Recipient / Participant", <Link key="recipient" href={`/programs/recipients/${e.recipient_id}`}>{e.recipient_name}</Link>], ["Cohort / Year", <Link key="cohort" href={`/programs/cohorts/${e.cohort_id}`}>{e.cohort_label}{e.cohort_year ? ` (${e.cohort_year})` : ""}</Link>],
    ["Award / Support Amount", e.support_amount === null ? "Unknown" : money(e.support_amount)], ["Education Level", e.education_level], ["Institution", e.institution], ["Field of Study", e.field_of_study], ["Graduation Status", e.graduation_status || "Unknown"], ["Graduation Date", e.graduation_date], ["Employment Status", e.employment_status || "Unknown"], ["Employment Field", e.employment_field], ["Notes", e.notes], ["Created", e.created_at], ["Updated", e.updated_at],
  ]}/></section><section className="card mt-5 p-6"><h2 className="mb-4 text-xl font-bold">Related outcomes and engagement</h2><RecipientEvidence contactId={e.contact_id} interactions={e.recorded_interactions} alumniCash={e.alumni_cash} alumniSince={e.alumni_since} lastContact={e.last_contact}/><p className="mt-4 text-sm">Contact history and alumni giving belong to the recipient across enrollments. They are not added to program support totals.</p></section></Shell>;
}
