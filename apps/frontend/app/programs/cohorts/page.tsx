import Link from "next/link";
import { Shell } from "../../../components/shell";
import { PageHeader } from "../../../components/ui";
import { crmContext } from "../../../lib/crm-context";
export default async function Cohorts() {
  const { client, canWrite } = await crmContext();
  const [cohorts, programs] = await Promise.all([client.from("program_cohorts").select("id,label,year,program_id").order("label"), client.from("programs").select("id,name")]); if (cohorts.error || programs.error) throw new Error("Cohorts unavailable.");
  const names = new Map((programs.data ?? []).map(p => [p.id, p.name]));
  return <Shell><Link href="/programs">← Programs &amp; Recipients</Link><PageHeader title="Cohorts" action={canWrite && <Link href="/programs/cohorts/new">+ Add cohort</Link>}/><section className="card p-5">{(cohorts.data ?? []).map(c => <p key={c.id}><Link href={`/programs/cohorts/${c.id}`}>{c.label} · {names.get(c.program_id)}</Link>{c.year ? ` (${c.year})` : ""}</p>)}{!cohorts.data?.length && <p>No cohorts recorded.</p>}</section></Shell>;
}
