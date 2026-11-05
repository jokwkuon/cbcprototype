import { DataTable } from "../../components/data-table";
import Link from "next/link";
import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { EnrollmentTable, ProgramMetrics } from "../../components/programs";
import { crmContext } from "../../lib/crm-context";
import { enrollments, programSummary } from "../../lib/program-data";
import { ProgramFilters } from "../../components/program-filters";
import { redirect } from "next/navigation";
export default async function Programs({ searchParams }: { searchParams: Promise<{ q?: string; program?: string; cohort?: string }> }) {
  const params = await searchParams, { client, canWrite } = await crmContext();
  const q = typeof params.q === "string" ? params.q : "";
  const [programs, cohorts] = await Promise.all([client.from("programs").select("id,name").order("name"), client.from("program_cohorts").select("id,label,program_id").order("label")]);
  if (programs.error || cohorts.error) throw new Error("Programs unavailable.");
  const program = (programs.data ?? []).some(p => p.id === params.program) ? params.program! : "";
  const cohort = (cohorts.data ?? []).some(c => c.id === params.cohort && (!program || c.program_id === program)) ? params.cohort! : "";
  if ((params.program ?? "") !== program || (params.cohort ?? "") !== cohort) {
    const normalized = new URLSearchParams();
    if (q) normalized.set("q", q);
    if (program) normalized.set("program", program);
    if (cohort) normalized.set("cohort", cohort);
    redirect(`/programs${normalized.size ? `?${normalized}` : ""}`);
  }
  const [records, summary] = await Promise.all([enrollments(client, { program, cohort }), programSummary(client, program, cohort)]);
  const visible = records.filter(e => `${e.recipient_name} ${e.program_name} ${e.cohort_label} ${e.education_level ?? ""} ${e.field_of_study ?? ""} ${e.graduation_status ?? ""} ${e.employment_status ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return <Shell><PageHeader title="Programs & Recipients" subtitle="Programs, education and recorded outcomes. Provisional MVP conventions pending CBC approval." action={canWrite && <Link href="/programs/enrollments/new">+ Add enrollment</Link>}/>
    <nav aria-label="Program records" className="mb-5 flex flex-wrap gap-4"><Link href="/programs/recipients">Recipients</Link><Link href="/programs/cohorts">Cohorts</Link>{canWrite && <><Link href="/programs/new">+ Add program</Link><Link href="/programs/recipients/new">+ Add recipient</Link><Link href="/programs/cohorts/new">+ Add cohort</Link></>}</nav>
    <details className="program-catalog card mb-5"><summary className="flex items-center justify-between p-4"><span className="font-semibold text-sm">Program directory <span className="text-slate-400 text-xs ml-2">{programs.data?.length||0} programs</span></span><span className="text-xs text-purple">Browse programs ↓</span></summary><DataTable label="Programs" columns={[{key:'name',label:'Program'}]} rows={(programs.data||[]).map(p=>({id:p.id,href:`/programs/${p.id}`,cells:{name:{text:p.name,href:`/programs/${p.id}`,kind:'identity'}}}))}/></details>
    <ProgramFilters key={`${program}:${cohort}:${q}`} q={q} program={program} cohort={cohort} programs={programs.data ?? []} cohorts={cohorts.data ?? []}/ ><p className="text-sm">Summary follows program/cohort filters. Search narrows the enrollment directory.</p>
    <ProgramMetrics summary={summary}/><h2 className="mb-3 text-xl font-bold">Recipient enrollments</h2><EnrollmentTable searchable={false} records={visible}/>
  </Shell>;
}
