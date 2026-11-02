import Link from "next/link";
import { Shell } from "../../../components/shell";
import { PageHeader } from "../../../components/ui";
import { crmContext } from "../../../lib/crm-context";
export default async function Recipients() {
  const { client, canWrite } = await crmContext(), { data, error } = await client.from("program_recipient_details").select("id,display_name,organization_name").order("display_name"); if (error) throw new Error("Recipients unavailable.");
  return <Shell><Link href="/programs">← Programs &amp; Recipients</Link><PageHeader title="Recipients" action={canWrite && <Link href="/programs/recipients/new">+ Add recipient</Link>}/><section className="card p-5">{(data ?? []).map(r => <p key={r.id}><Link href={`/programs/recipients/${r.id}`}>{r.display_name}</Link> · {r.organization_name || "No organization linked"}</p>)}{!data?.length && <p>No recipients recorded.</p>}</section></Shell>;
}
