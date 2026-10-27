import { relatedHistory } from "../../../lib/activity-data";
import { RelatedActivities } from "../../../components/activity-lists";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../components/shell";
import { DetailFields, PendingFields } from "../../../components/fields";
import { contactPending } from "../../../lib/crm-fields";
import { crmContext, ownerLabel } from "../../../lib/crm-context";
export default async function Contact({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client, canWrite } = await crmContext();
  const { data: contact, error } = await client.from("contacts").select("*, organization:organizations(id,name,relationship_owner)").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load contact.");
  if (!contact) notFound();
  const owner = await ownerLabel(client, contact.organization?.relationship_owner ?? null);
  const history=await relatedHistory(client,"contact",id);
  return <Shell><Link href="/contacts">← Contacts</Link><div className="my-5 flex justify-between gap-4"><h1 className="text-3xl font-bold">{contact.first_name} {contact.last_name}</h1>{canWrite && <Link href={`/contacts/${id}/edit`}>Edit contact</Link>}</div>
    <section className="card p-6"><DetailFields fields={[
      ["First Name", contact.first_name], ["Last Name", contact.last_name], ["Title", contact.title],
      ["Organization", contact.organization ? <Link href={`/organizations/${contact.organization.id}`}>{contact.organization.name}</Link> : "Not linked"],
      ["Email", contact.email], ["Phone", contact.phone], ["Contact Type", contact.contact_type], ["Influence Level", contact.influence_level], ["Relationship Owner", owner], ["Interests", contact.interests], ["Notes", contact.notes],
    ]}/></section><RelatedActivities history={history}/><PendingFields labels={contactPending.filter(label=>!["Last Contact","Next Action"].includes(label))}/>
  </Shell>;
}
