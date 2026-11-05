import { RelationshipQuickEdit } from "../../../components/relationship-quick-edit";
import { RecordHeader } from "../../../components/record-header";
import { RelationshipContext } from "../../../components/relationship-context";
import { RelatedPrograms } from "../../../components/programs";
import { GivingHistory } from "../../../components/giving";
import { relationshipHistory } from "../../../lib/relationship-history";
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
  const { data: contact, error } = await client.from("contacts").select("*, organization:organizations!contacts_organization_id_fkey(id,name,relationship_owner)").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load contact.");
  if (!contact) notFound();
  const owner = await ownerLabel(client, contact.organization?.relationship_owner ?? null);
  const history=await relationshipHistory(client,"contact",id);
  return <Shell><RecordHeader name={`${contact.first_name} ${contact.last_name}`} subtitle={[contact.title,contact.organization?.name].filter(Boolean).join(' · ')} status={contact.contact_type||undefined} back="/contacts" backLabel="Contacts" editHref={canWrite?`/contacts/${id}/edit`:undefined} editLabel="Edit contact" actions={<>{canWrite&&<><Link className="button" href={`/activities/new?contact=${id}`}>Log an interaction</Link><RelationshipQuickEdit kind="contact" id={id} updatedAt={contact.updated_at} values={contact}/></>}{contact.email&&<a className="button" href={`mailto:${contact.email}`}>Send email</a>}</>}/><nav className="record-subnav mb-5 flex gap-5" aria-label="Contact sections"><a href="#profile">Overview</a><a href="#activities">Activity timeline</a><a href="#giving-history">Giving</a><a href="#programs">Programs</a><a href="#documents">Documents</a></nav>
    <section id="profile" className="card p-6"><DetailFields fields={[
      ["First Name", contact.first_name], ["Last Name", contact.last_name], ["Title", contact.title],
      ["Organization", contact.organization ? <Link href={`/organizations/${contact.organization.id}`}>{contact.organization.name}</Link> : "Not linked"],
      ["Email", contact.email], ["Phone", contact.phone], ["Contact Type", contact.contact_type], ["Influence Level", contact.influence_level], ["Relationship Owner", owner], ["Interests", contact.interests], ["Notes", contact.notes],
    ]}/></section><RelatedActivities history={history} kind="contact" id={id} canWrite={canWrite}/><GivingHistory contact={id}/><PendingFields labels={contactPending.filter(label=>!["Last Contact","Next Action","Giving History"].includes(label))}/>
    <RelatedPrograms contact={id}/><RelationshipContext contact={id}/>
  </Shell>;
}
