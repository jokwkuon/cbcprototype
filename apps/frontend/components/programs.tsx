import { DataTable } from "./data-table";
import Link from "next/link";
import { crmContext } from "../lib/crm-context";
import { enrollments, type Enrollment, type ProgramSummary } from "../lib/program-data";
import { money } from "../lib/giving-validation";
import { displayTime } from "../lib/activity-data";
import { DetailFields } from "./fields";
export function EnrollmentTable({ records }: { records: Enrollment[] }) {
  return <DataTable label="Enrollments" emptyMessage="No enrollments found." columns={[{key:'recipient',label:'Recipient'},{key:'program',label:'Program'},{key:'cohort',label:'Cohort'},{key:'level',label:'Level'},{key:'field',label:'Field'},{key:'outcome',label:'Outcome'}]} rows={records.map(e=>({id:e.id,href:`/programs/enrollments/${e.id}`,cells:{recipient:{text:e.recipient_name,href:`/programs/enrollments/${e.id}`,kind:'identity',hint:e.organization_name||'No organization linked'},program:{text:e.program_name,href:`/programs/${e.program_id}`},cohort:{text:e.cohort_label,hint:e.cohort_year?String(e.cohort_year):undefined},level:{text:e.education_level||'Unknown'},field:{text:e.field_of_study||'Unknown'},outcome:{text:e.graduation_status||'Graduation unknown',hint:e.employment_status||'Employment unknown',kind:'status'}}}))}/>;
}
export function ProgramMetrics({ summary }: { summary: ProgramSummary }) {
  return <section aria-label="Program summary" className="card my-5 p-5"><h2 className="mb-4 text-xl font-bold">Program summary</h2><DetailFields fields={[["Participants", summary.participants], ["Enrollments", summary.enrollments], ["Recorded support total", summary.known_support === null ? "No support amounts recorded" : money(summary.known_support)], ["Support completeness", `${summary.known_support_count} recorded; ${summary.unknown_support_count} unknown`], ["Scholarships", "Definition pending — award classification and counting basis"], ["Graduation Rate", "Definition pending — eligible cohort and denominator"], ["Employed in Field", "Definition pending — alignment rubric and denominator"]]}/><p className="mt-4 text-sm">Participants are distinct recipient identities within the selected scope. Recorded support sums declared enrollment support, with unknown amounts reported separately. Support totals are separate from Giving cash receipts. Outcomes remain manual; no outcome percentages are inferred.</p></section>;
}
export function RecipientEvidence({ contactId, interactions, alumniCash, alumniSince, lastContact }: { contactId: string | null; interactions: number | null; alumniCash: string | null; alumniSince: string | null; lastContact: string | null }) {
  return <DetailFields fields={[
    ["Field Alignment", "Definition pending — no automatic discipline matching"],
    ["CBC Engagement", contactId ? <span>Recorded past interactions: {interactions}. <Link href={`/contacts/${contactId}`}>View contact activity history</Link>. Membership, volunteer and mentorship classification: Definition pending.</span> : "Link an existing contact to show recorded interactions. Engagement classification: Definition pending."],
    ["Alumni Giving", alumniCash === null ? "Definition pending — link a contact and record an explicit alumni effective date" : `${money(alumniCash)} since ${alumniSince} (person-wide contact receipts; not allocated to a program)`],
    ["Last Contact", contactId ? (lastContact ? displayTime(lastContact) : "No linked past activity") : "Link a contact to show Last Contact"],
  ]}/>;
}
export async function RelatedPrograms({ contact, organization }: { contact?: string; organization?: string }) {
  const { client } = await crmContext(); let records;
  try { records = await enrollments(client, { contact, organization }); }
  catch { return <section id="programs" className="card mt-5 p-5" role="status">Programs unavailable. No participation inferred.</section>; }
  return <section id="programs" className="mt-5"><h2 className="mb-3 text-xl font-bold">Programs &amp; Recipients</h2><EnrollmentTable records={records}/></section>;
}
