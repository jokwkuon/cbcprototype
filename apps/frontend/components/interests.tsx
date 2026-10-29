import Link from "next/link";
import { crmContext } from "../lib/crm-context";
import { interests, type Interest } from "../lib/interest-data";
export function InterestTable({ records }: { records: Interest[] }) {
  return <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Organization", "Interest", "Strength", "Program Alignment", "Owner", "Opportunity (amount)"].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{records.map(i => <tr key={i.id} className="border-t"><td className="p-3"><Link href={`/organizations/${i.organization_id}`}>{i.organization_name}</Link></td><td><Link className="underline" href={`/interests/${i.id}`}>{i.category}</Link>{i.archived_at && <span> · Archived</span>}</td><td>{i.strength || "Not specified"}</td><td>{i.programs.map(p => p.name).join(", ") || "Not linked"}</td><td>{i.owner_name}</td><td>{i.opportunity_id ? <Link href={`/interests/opportunities/${i.opportunity_id}`}>{i.opportunity_name} · {i.opportunity_amount === null ? "Estimate not specified" : `${i.opportunity_amount} (manual estimate; currency definition pending)`}</Link> : "Not linked"}</td></tr>)}</tbody></table>{!records.length && <p className="p-5">No interests found.</p>}</div>;
}
export async function OrganizationInterests({ organization }: { organization: string }) {
  const { client, canWrite } = await crmContext();
  let records;
  try { records = await interests(client, { organization, archived: true }); }
  catch { return <section id="interests" className="card mt-5 p-5" role="status">Sponsor Interests unavailable. No history inferred.</section>; }
  return <section id="interests" className="mt-5"><div className="mb-3 flex justify-between"><h2 className="text-xl font-bold">Sponsor Interests</h2>{canWrite && <Link href={`/interests/new?organization=${organization}`}>+ Add interest</Link>}</div><InterestTable records={records}/></section>;
}
