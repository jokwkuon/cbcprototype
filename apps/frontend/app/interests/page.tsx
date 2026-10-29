import Link from "next/link";
import { Shell } from "../../components/shell";
import { PageHeader } from "../../components/ui";
import { InterestTable } from "../../components/interests";
import { crmContext } from "../../lib/crm-context";
import { interests } from "../../lib/interest-data";
export default async function Interests({ searchParams }: { searchParams: Promise<{ q?: string; archived?: string }> }) {
  const { q = "", archived = "" } = await searchParams, { client, canWrite } = await crmContext();
  const records = (await interests(client, { archived: archived === "all" })).filter(i => `${i.organization_name} ${i.category} ${i.strength ?? ""} ${i.programs.map(p => p.name).join(" ")} ${i.owner_name} ${i.opportunity_name ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return <Shell><PageHeader title="Sponsor Interests" subtitle="Sponsor priorities and explicit relationship links. Provisional MVP conventions pending CBC approval." action={canWrite && <Link href="/interests/new">+ Add interest</Link>}/><form className="mb-5 flex flex-wrap gap-3"><input name="q" defaultValue={q} aria-label="Search interests" placeholder="Search interests…" className="max-w-sm"/><select name="archived" defaultValue={archived} aria-label="Archive filter" className="max-w-xs"><option value="">Active interests</option><option value="all">Include archived</option></select><button>Search</button></form><InterestTable records={records}/>{canWrite && <Link className="mt-5 inline-block" href="/interests/opportunities/new">+ Add opportunity reference</Link>}</Shell>;
}
