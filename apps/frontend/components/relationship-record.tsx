import Link from 'next/link';
import {Suspense} from 'react';
import {crmContext,ownerLabel} from '../lib/crm-context';
import {validId} from '../lib/crm-validation';
import {relationshipHistory} from '../lib/relationship-history';
import type {RelationshipKind} from '../lib/relationship-directory';
import {readAll} from '../lib/read-all';
import {displayTime} from '../lib/activity-data';
import {localDate,recordReference} from '../lib/presentation';
import {contributions} from '../lib/giving-data';
import {enrollments} from '../lib/program-data';
import type {Membership} from '../lib/membership-data';
import type {Pair} from '../lib/mentorship-data';
import type {DocumentRecord} from '../lib/document-data';
import {DetailFields} from './fields';
import {FollowUpList} from './activity-lists';
import {RelationshipQuickEdit} from './relationship-quick-edit';
import {RelationshipPanels} from './relationship-panels';
import {StatusBadge} from './data-table-client';
import {Icon} from './icons';

export function RecordLoading(){return <div className="relationship-loading" role="status"><span className="skeleton skeleton-line"/><span className="skeleton skeleton-card"/>Loading relationship workspace…</div>;}

export async function RelationshipRecord({kind,id}:{kind:RelationshipKind;id:string}) {
  if (!validId(id)) return <div className="directory-empty"><h2>Invalid record reference</h2><p>Select a record from the results.</p></div>;
  const {client,canWrite} = await crmContext();
  const plural = kind === 'organization' ? 'organizations' : 'contacts', isOrg = kind === 'organization';
  const {data:record,error} = isOrg
    ? await client.from('organizations').select('*').eq('id',id).maybeSingle()
    : await client.from('contacts').select('*, organization:organizations!contacts_organization_id_fkey(id,name,relationship_owner)').eq('id',id).maybeSingle();
  if (error) return <RecordUnavailable/>;
  if (!record) return <div className="directory-empty"><h2>Record unavailable</h2><p>It may have been removed or your access may have changed. Select another record.</p></div>;
  const [ownerResult,contactsResult] = await Promise.allSettled([
    ownerLabel(client,isOrg ? record.relationship_owner : record.organization?.relationship_owner || null),
    isOrg ? readAll<{id:string;first_name:string;last_name:string;title:string|null}>((a,b) => client.from('contacts').select('id,first_name,last_name,title',{count:'exact'}).eq('organization_id',id).order('id').range(a,b)) : Promise.resolve([]),
  ]);
  const owner = ownerResult.status === 'fulfilled' ? ownerResult.value : 'Ownership unavailable';
  const contacts = contactsResult.status === 'fulfilled' ? contactsResult.value : null;
  const name = isOrg ? record.name : `${record.first_name} ${record.last_name}`;
  const full = `/${plural}/${id}`;
  const activityHref = `/activities/new?${isOrg ? 'organization' : 'contact'}=${id}`;
  const primary = contacts?.find(c => c.id === record.primary_contact_id);
  const fields:[string,React.ReactNode][] = isOrg ? [
    ['Organization Name',record.name],['Organization Type',record.organization_type],['Industry',record.industry],['Website',record.website ? <a href={record.website} target="_blank" rel="noreferrer">{record.website}</a> : null],['Location',record.location],
    ['Primary Contact',primary ? <Link href={`/contacts/${primary.id}`}>{primary.first_name} {primary.last_name}</Link> : 'Not selected'],
    ['Relationship Owner',owner],['Relationship Status',record.relationship_status],['Relationship Strength',record.relationship_strength],['Priority Level',record.priority_level],['Potential',record.potential],['Estimated Opportunity',record.estimated_opportunity === null ? 'Not recorded' : `${record.estimated_opportunity} · manual estimate; currency definition pending`],['Notes',record.notes],
  ] : [
    ['First Name',record.first_name],['Last Name',record.last_name],['Title',record.title],['Organization',record.organization ? <Link href={`/organizations/${record.organization.id}`}>{record.organization.name}</Link> : 'Not linked'],
    ['Email',record.email],['Phone',record.phone],['Contact Type',record.contact_type],['Influence Level',record.influence_level],['Relationship Owner',owner],['Interests',record.interests],['Notes',record.notes],['Events Attended','Definition pending'],
  ];
  return <article className="relationship-record-workspace" key={id}>
    <header className="relationship-record-header"><div className="record-type"><Icon name={plural} size={14}/>{isOrg ? 'Organization' : 'Contact'}<span>Ref {recordReference(id)}</span></div><h2>{name}</h2><p>{[record.title,record.organization?.name,record.organization_type,record.industry].filter(Boolean).join(' · ') || 'Relationship workspace'}</p><div className="relationship-record-meta"><StatusBadge value={isOrg ? record.relationship_status : record.contact_type || 'Type not recorded'}/><span>Owner · {owner}</span></div>
      <div className="relationship-actions">{canWrite && <><Link className="button button-primary" href={activityHref}><Icon name="plus" size={14}/>Log an interaction</Link><RelationshipQuickEdit kind={kind} id={id} updatedAt={record.updated_at} values={record}/></>}{!isOrg && record.email && <a className="button" href={`mailto:${record.email}`}>Email</a>}<Link className="record-full-link" href={full}>Open full record <Icon name="arrow" size={13}/></Link></div>
    </header>
    <RelationshipPanels key={id} activity={<div className="record-working-area"><Suspense fallback={<RecordLoading/>}><RecordActivity kind={kind} id={id} canWrite={canWrite}/></Suspense><aside className="record-context"><h3>Relationship context</h3><dl><dt>{isOrg ? 'Location' : 'Organization'}</dt><dd>{isOrg ? record.location || 'Not recorded' : record.organization ? <Link href={`/organizations/${record.organization.id}`}>{record.organization.name}</Link> : 'Not linked'}</dd><dt>{isOrg ? 'Priority' : 'Email'}</dt><dd>{isOrg ? record.priority_level : record.email || 'Not recorded'}</dd>{!isOrg && <><dt>Phone</dt><dd>{record.phone || 'Not recorded'}</dd></>}</dl>{isOrg && <><div className="record-context-heading"><h3>People</h3>{canWrite && <Link href={`/contacts/new?organization=${id}`}>+ Add contact</Link>}</div>{contacts === null ? <p role="status">Linked contacts unavailable.</p> : contacts.length ? contacts.map(c => <Link className="record-person" key={c.id} href={`/contacts?selected=${c.id}`}><strong>{c.first_name} {c.last_name}</strong><span>{c.title || 'Contact'}{c.id === record.primary_contact_id ? ' · Primary contact' : ''}</span></Link>) : <p>No linked contacts.</p>}</>}
      <h3>Notes</h3><p className="record-notes">{record.notes || 'No notes recorded.'}</p></aside></div>}
      profile={<div className="relationship-profile"><h3>Record details</h3><DetailFields fields={fields}/><p className="record-provenance">Added {localDate(record.created_at)} · Updated {localDate(record.updated_at)}</p><Link href={canWrite ? `${full}/edit` : full}>{canWrite ? 'Edit all record fields' : 'Open full record'}</Link></div>}
      related={<Suspense fallback={<RecordLoading/>}><RecordRelated kind={kind} id={id}/></Suspense>}/>
  </article>;
}
function RecordUnavailable(){return <div className="directory-empty" role="alert"><h2>Workspace unavailable</h2><p>The record could not be loaded. Your data has not been changed.</p><a href="">Reload workspace</a></div>;}
async function RecordActivity({kind,id,canWrite}:{kind:RelationshipKind;id:string;canWrite:boolean}) {
  const {client} = await crmContext();
  let history;
  try {history = await relationshipHistory(client,kind,id);} catch {return <div className="record-feed" role="alert"><h3>Activity unavailable</h3><p>Unable to load history or follow-ups. No activity totals were inferred.</p><a href="">Retry workspace</a></div>;}
  const open = history.tasks.filter(t => t.status !== 'Complete'), completed = history.tasks.filter(t => t.status === 'Complete');
  return <div className="record-feed"><div className="record-feed-heading"><h3>Next steps</h3><span>{open.length} open</span></div><p className="record-last-contact">Last Contact · {displayTime(history.last)}</p><FollowUpList tasks={open.slice(0,3)} canWrite={canWrite}/>{open.length > 3 && <details className="record-completed"><summary>More open follow-ups ({open.length-3})</summary><FollowUpList tasks={open.slice(3)} canWrite={canWrite}/></details>}{completed.length > 0 && <details className="record-completed"><summary>Completed follow-ups ({completed.length})</summary><FollowUpList tasks={completed} canWrite={canWrite}/></details>}<div className="record-feed-heading timeline-heading"><h3>Activity timeline</h3><span>{history.activities.length} recorded</span></div>
    <ol className="relationship-timeline">{history.activities.map(a => <li key={a.id}><span className="timeline-event-icon"><Icon name={a.activity_type.toLowerCase() === 'meeting' ? 'contacts' : 'activities'} size={15}/></span><div><div className="timeline-event-meta"><span>{a.activity_type}</span><time dateTime={a.occurred_at}>{displayTime(a.occurred_at)}</time></div><Link href={`/activities/${a.id}`}>{a.purpose || a.activity_type}</Link>{a.outcome && <p>{a.outcome}</p>}{a.key_discussion && <details><summary>Discussion notes</summary><p>{a.key_discussion}</p></details>}</div></li>)}</ol>{!history.activities.length && <div className="record-no-activity"><Icon name="activities" size={24}/><h3>No interactions recorded</h3><p>Log a conversation to keep its context and follow-ups together.</p></div>}
  </div>;
}
async function RecordRelated({kind,id}:{kind:RelationshipKind;id:string}) {
  const {client} = await crmContext(), isOrg = kind === 'organization', full = `/${isOrg ? 'organizations' : 'contacts'}/${id}`;
  const results = await Promise.allSettled([
    contributions(client,isOrg ? {organization:id} : {contact:id},true).then(rows => rows.map(r => ({id:r.id,name:r.organization_name || r.contact_name || r.contribution_date,context:`${r.contribution_type} · ${r.funding_status}`,href:`/giving/${r.id}`}))),
    enrollments(client,isOrg ? {organization:id} : {contact:id}).then(rows => rows.map(r => ({id:r.id,name:r.program_name,context:`${r.recipient_name} · ${r.cohort_label}`,href:`/programs/enrollments/${r.id}`}))),
    readAll<Membership>((a,b) => client.from('membership_details').select('*',{count:'exact'}).eq(isOrg ? 'linked_organization_id' : 'contact_id',id).order('id').range(a,b)).then(rows => rows.map(r => ({id:r.id,name:r.membership_type,context:`${localDate(r.start_date)} · ${r.status}`,href:`/membership/${r.id}`}))),
    readAll<Pair>((a,b) => {const q = client.from('mentorship_details').select('*',{count:'exact'}).order('id');return (isOrg ? q.eq('organization_id',id) : q.or(`mentor_id.eq.${id},mentee_id.eq.${id}`)).range(a,b);}).then(rows => rows.map(r => ({id:r.id,name:`${r.mentor_name} / ${r.mentee_name}`,context:r.program_name,href:`/mentorship/${r.id}`}))),
    readAll<DocumentRecord>((a,b) => client.from('documents').select('*',{count:'exact'}).eq(isOrg ? 'organization_id' : 'contact_id',id).order('id').range(a,b)).then(rows => rows.map(r => ({id:r.id,name:r.name,context:`${r.document_type || 'Metadata'} · ${r.version || 'Version not recorded'}`,href:`/documents/${r.id}`}))),
    isOrg ? readAll<{id:string;category:string;strength:string|null}>((a,b) => client.from('interest_details').select('id,category,strength',{count:'exact'}).eq('organization_id',id).is('archived_at',null).order('id').range(a,b)).then(rows => rows.map(r => ({id:r.id,name:r.category,context:r.strength || 'Strength not recorded',href:`/interests/${r.id}`}))) : Promise.resolve([]),
  ]);
  const labels = ['Sponsorship & Giving','Programs & Recipients','Membership terms','Mentorship','Documents','Sponsor Interests'];
  return <div className="record-related-grid">{results.map((result,index) => !isOrg && index === 5 ? null : <section key={labels[index]}><h3>{labels[index]}</h3>{result.status === 'rejected' ? <p role="status">Related records unavailable. <a href="">Retry</a></p> : result.value.length ? <><ul>{result.value.slice(0,4).map(r => <li key={r.id}><Link href={r.href}>{r.name}<Icon name="arrow" size={12}/></Link><span>{r.context} · Ref {recordReference(r.id)}</span></li>)}</ul>{result.value.length > 4 && <p>{result.value.length-4} more linked records</p>}</> : <p>No accessible linked records.</p>}<Link className="related-source-link" href={`${full}#${['giving-history','programs','membership','mentorship','documents','interests'][index]}`}>Open source history</Link></section>)}</div>;
}
