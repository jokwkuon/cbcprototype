import { RelationshipQuickEdit } from "../../../components/relationship-quick-edit";
import { RecordHeader } from "../../../components/record-header";
import { RelationshipContext } from "../../../components/relationship-context";
import { RelatedPrograms } from "../../../components/programs";
import { OrganizationInterests } from "../../../components/interests";
import { GivingHistory } from "../../../components/giving";
import { relatedHistory } from "../../../lib/activity-data";
import { RelatedActivities } from "../../../components/activity-lists";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../components/shell";
import { DetailFields } from "../../../components/fields";
import { crmContext, ownerLabel } from "../../../lib/crm-context";
export default async function Organization({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client, canWrite } = await crmContext();
  const { data: org, error } = await client.from("organizations").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load organization.");
  if (!org) notFound();
  const { data: contacts, error: contactError } = await client.from("contacts").select("*").eq("organization_id", id).order("last_name");
  if (contactError) throw new Error("Unable to load linked contacts.");
  const owner = await ownerLabel(client, org.relationship_owner);
  const primary = contacts?.find(contact => contact.id === org.primary_contact_id);
  const history=await relatedHistory(client,"organization",id);
  return <Shell><RecordHeader statusDomain="relationship" name={org.name} subtitle={[org.organization_type,org.industry].filter(Boolean).join(' · ')} status={org.relationship_status} back="/organizations" backLabel="Organizations" editHref={canWrite?`/organizations/${id}/edit`:undefined} editLabel="Edit organization" actions={canWrite?<><Link className="button" href={`/activities/new?organization=${id}`}>Log an interaction</Link><RelationshipQuickEdit kind="organization" id={id} updatedAt={org.updated_at} values={org}/></>:undefined}/ >
    <nav aria-label="Organization sections" className="record-subnav mt-6 flex flex-wrap gap-4">{["Overview","Contacts","Giving History","Activities","Interests","Documents"].map(label=><a key={label} href={`#${label.toLowerCase().replaceAll(" ","-")}`}>{label}</a>)}</nav><div className="mt-6 grid gap-5 lg:grid-cols-3"><section id="overview" className="card p-6 lg:col-span-2"><h2 className="mb-5 font-bold">Relationship profile</h2><DetailFields fields={[
      ["Organization Name", org.name], ["Organization Type", org.organization_type], ["Industry", org.industry], ["Website", org.website], ["Location", org.location],
      ["Primary Contact", primary ? <Link href={`/contacts/${primary.id}`}>{primary.first_name} {primary.last_name}</Link> : "Not selected"],
      ["Relationship Owner", owner], ["Relationship Status", org.relationship_status], ["Relationship Strength", org.relationship_strength], ["Priority Level", org.priority_level], ["Potential", org.potential], ["Estimated Opportunity", org.estimated_opportunity], ["Notes", org.notes],
    ]}/></section><section id="contacts" className="card p-6"><h2 className="mb-4 font-bold">Contacts</h2>{contacts?.map(contact => <div className="person-row" key={contact.id}><Link href={`/contacts/${contact.id}`}>{contact.first_name} {contact.last_name}</Link><small>{contact.title||contact.email||'Contact'} · Ref {contact.id.slice(-6)}</small></div>)}{!contacts?.length && <p>No linked contacts.</p>}{canWrite && <Link className="mt-5 inline-block" href={`/contacts/new?organization=${id}`}>+ Add contact</Link>}</section></div>
    <RelatedActivities history={history}/><GivingHistory organization={id}/><OrganizationInterests organization={id}/><RelationshipContext organization={id}/>
    <RelatedPrograms organization={id}/>
  </Shell>;
}
