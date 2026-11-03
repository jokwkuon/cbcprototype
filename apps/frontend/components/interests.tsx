import { DataTable } from "./data-table";
import Link from "next/link";
import { crmContext } from "../lib/crm-context";
import { interests, type Interest } from "../lib/interest-data";
export function InterestTable({ records }: { records: Interest[] }) {
  return <DataTable label="Sponsor interests" emptyMessage="No interests found." columns={[{key:'organization',label:'Organization'},{key:'interest',label:'Interest'},{key:'strength',label:'Strength'},{key:'program',label:'Program Alignment'},{key:'owner',label:'Owner'},{key:'opportunity',label:'Opportunity (amount)'}]} rows={records.map(i=>({id:i.id,href:`/interests/${i.id}`,cells:{organization:{text:i.organization_name,href:`/organizations/${i.organization_id}`,kind:'identity'},interest:{text:i.category,href:`/interests/${i.id}`,hint:i.archived_at?'Archived':undefined},strength:{text:i.strength},program:{text:i.programs.map(p=>p.name).join(', ')||'Not linked'},owner:{text:i.owner_name},opportunity:{text:i.opportunity_id?`${i.opportunity_name} · ${i.opportunity_amount===null?'Estimate not specified':`${i.opportunity_amount} (manual estimate; currency definition pending)`}`:'Not linked',href:i.opportunity_id?`/interests/opportunities/${i.opportunity_id}`:undefined}}}))}/>;
}
export async function OrganizationInterests({ organization }: { organization: string }) {
  const { client, canWrite } = await crmContext();
  let records;
  try { records = await interests(client, { organization, archived: true }); }
  catch { return <section id="interests" className="card mt-5 p-5" role="status">Sponsor Interests unavailable. No history inferred.</section>; }
  return <section id="interests" className="mt-5"><div className="mb-3 flex justify-between"><h2 className="text-xl font-bold">Sponsor Interests</h2>{canWrite && <Link href={`/interests/new?organization=${organization}`}>+ Add interest</Link>}</div><InterestTable records={records}/></section>;
}
