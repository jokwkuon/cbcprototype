import { RecordHeader } from "../../../../components/record-header";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../../components/shell";
import { DetailFields } from "../../../../components/fields";
import { crmContext } from "../../../../lib/crm-context";
import { validId } from "../../../../lib/crm-validation";
export default async function Opportunity({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, { client } = await crmContext(); if (!validId(id)) notFound();
  const { data: o, error } = await client.from("opportunities").select("id,name,organization_id,estimated_amount::text").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load opportunity reference."); if (!o) notFound();
  return <Shell><RecordHeader name={o.name} subtitle="Opportunity reference · Manual estimate" back="/interests" backLabel="Sponsor Interests"/><section className="card p-6"><DetailFields fields={[["Organization", <Link key="org" href={`/organizations/${o.organization_id}`}>View organization</Link>], ["Manual estimate", o.estimated_amount], ["Currency", "Definition pending"]]}/><p className="mt-4">Reference only; pipeline stages and financial recognition are outside this slice.</p></section></Shell>;
}
