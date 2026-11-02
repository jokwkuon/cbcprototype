import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../../components/shell";
import { DetailFields } from "../../../../components/fields";
import { EnrollmentTable, RecipientEvidence } from "../../../../components/programs";
import { crmContext } from "../../../../lib/crm-context";
import { enrollments, type Recipient } from "../../../../lib/program-data";
import { validId } from "../../../../lib/crm-validation";
export default async function RecipientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, { client, canWrite } = await crmContext(); if (!validId(id)) notFound();
  const { data, error } = await client.from("program_recipient_details").select("*").eq("id", id).maybeSingle(); if (error) throw new Error("Recipient unavailable."); if (!data) notFound(); const r = data as Recipient;
  const records = await enrollments(client, { recipient: id });
  return <Shell><Link href="/programs/recipients">← Recipients</Link><div className="my-5 flex justify-between"><h1 className="text-3xl font-bold">{r.display_name}</h1>{canWrite && <Link href={`/programs/recipients/${id}/edit`}>Edit recipient</Link>}</div><section className="card p-6"><DetailFields fields={[["Recipient / Participant", r.display_name], ["Contact", r.contact_id ? <Link href={`/contacts/${r.contact_id}`}>View contact</Link> : "Not linked"], ["Organization", r.linked_organization_id ? <Link href={`/organizations/${r.linked_organization_id}`}>{r.organization_name}</Link> : "Not linked"], ["Alumni effective date", r.alumni_since], ["Notes", r.notes]]}/></section><section className="card my-5 p-6"><RecipientEvidence contactId={r.contact_id} interactions={r.recorded_interactions} alumniCash={r.alumni_cash} alumniSince={r.alumni_since} lastContact={r.last_contact}/></section><EnrollmentTable records={records}/>{canWrite && <Link className="mt-4 inline-block" href="/programs/enrollments/new">+ Add enrollment</Link>}</Shell>;
}
