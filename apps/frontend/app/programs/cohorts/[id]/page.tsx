import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../../components/shell";
import { DetailFields } from "../../../../components/fields";
import { EnrollmentTable, ProgramMetrics } from "../../../../components/programs";
import { crmContext } from "../../../../lib/crm-context";
import { enrollments, programSummary } from "../../../../lib/program-data";
import { validId } from "../../../../lib/crm-validation";
export default async function CohortDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, { client, canWrite } = await crmContext(); if (!validId(id)) notFound();
  const { data: c, error } = await client.from("program_cohorts").select("*").eq("id", id).maybeSingle(); if (error) throw new Error("Cohort unavailable."); if (!c) notFound();
  const [p, records, summary] = await Promise.all([client.from("programs").select("name").eq("id", c.program_id).single(), enrollments(client, { cohort: id }), programSummary(client, c.program_id, id)]); if (p.error) throw new Error("Program unavailable.");
  return <Shell><Link href="/programs/cohorts">← Cohorts</Link><div className="my-5 flex justify-between"><h1 className="text-3xl font-bold">{c.label} · {p.data.name}</h1>{canWrite && <Link href={`/programs/cohorts/${id}/edit`}>Edit cohort</Link>}</div><section className="card p-5"><DetailFields fields={[["Program", <Link key="program" href={`/programs/${c.program_id}`}>{p.data.name}</Link>], ["Cohort / Year", c.label], ["Calendar year", c.year]]}/></section><ProgramMetrics summary={summary}/><EnrollmentTable records={records}/></Shell>;
}
