import { RecordHeader } from "../../../components/record-header";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../components/shell";
import { DetailFields } from "../../../components/fields";
import { EnrollmentTable, ProgramMetrics } from "../../../components/programs";
import { crmContext } from "../../../lib/crm-context";
import { enrollments, programSummary } from "../../../lib/program-data";
import { validId } from "../../../lib/crm-validation";
export default async function ProgramDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, { client, canWrite } = await crmContext(); if (!validId(id)) notFound();
  const { data: p, error } = await client.from("programs").select("*").eq("id", id).maybeSingle(); if (error) throw new Error("Unable to load program."); if (!p) notFound();
  const [cohorts, records, summary, funding] = await Promise.all([client.from("program_cohorts").select("id,label,year").eq("program_id", id).order("label"), enrollments(client, { program: id }), programSummary(client, id), p.funding_program_id ? client.from("funding_initiatives").select("name").eq("id", p.funding_program_id).single() : { data: null, error: null }]);
  if (cohorts.error || funding.error) throw new Error("Unable to load program relationships.");
  return <Shell><RecordHeader name={p.name} subtitle={p.description||'Program overview'} back="/programs" backLabel="Programs & Recipients" editHref={canWrite?`/programs/${id}/edit`:undefined} editLabel="Edit program"/><section className="card p-6"><DetailFields fields={[["Program", p.name], ["Description", p.description], ["Program Alignment", funding.data?.name || "Not linked"], ["Created", p.created_at], ["Updated", p.updated_at]]}/><p className="mt-3 text-sm">Program Alignment is an explicit shared Program reference used by Giving and Sponsor Interests.</p></section><ProgramMetrics summary={summary}/>
    <section className="card mb-5 p-5"><h2 className="mb-3 text-xl font-bold">Cohorts</h2>{(cohorts.data ?? []).map(c => <p key={c.id}><Link href={`/programs/cohorts/${c.id}`}>{c.label}{c.year ? ` (${c.year})` : ""}</Link></p>)}{!cohorts.data?.length && <p>No cohorts recorded.</p>}{canWrite && <Link className="mt-3 inline-block" href={`/programs/cohorts/new?program=${id}`}>+ Add cohort</Link>}</section><EnrollmentTable records={records}/>{canWrite && <Link className="mt-5 inline-block" href={`/programs/enrollments/new?program=${id}`}>+ Add enrollment</Link>}
  </Shell>;
}
