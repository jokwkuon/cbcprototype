import Link from 'next/link';
import {crmContext} from '../lib/crm-context';
import {memberships} from '../lib/membership-data';
import {pairs} from '../lib/mentorship-data';
import {documents} from '../lib/document-data';
import {localDate} from '../lib/presentation';
export async function RelationshipContext({contact,organization}:{contact?:string;organization?:string}){
 const {client}=await crmContext();const [m,p,d]=await Promise.allSettled([memberships(client),pairs(client),documents(client)]);
 const matchM=m.status==='fulfilled'?m.value.filter(x=>contact?x.contact_id===contact:x.linked_organization_id===organization):null;
 const matchP=p.status==='fulfilled'?p.value.filter(x=>contact?[x.mentor_id,x.mentee_id].includes(contact):x.organization_id===organization):null;
 const matchD=d.status==='fulfilled'?d.value.filter(x=>contact?x.contact_id===contact:x.organization_id===organization):null;
 return <div className="grid gap-5 md:grid-cols-3 mt-5"><section id="membership" className="card p-5"><div className="section-title"><h2>Membership terms</h2><Link href="/membership">View all</Link></div>{matchM===null?<p role="status">Membership unavailable.</p>:matchM.length?matchM.map(x=><p className="mb-3 text-xs" key={x.id}><Link href={`/membership/${x.id}`}>{x.membership_type} · {localDate(x.start_date)}</Link><small className="block">{x.status}</small></p>):<p className="text-xs">No linked membership terms.</p>}</section><section id="mentorship" className="card p-5"><div className="section-title"><h2>Mentorship</h2><Link href="/mentorship">View all</Link></div>{matchP===null?<p role="status">Mentorship unavailable.</p>:matchP.length?matchP.map(x=><p className="mb-3 text-xs" key={x.id}><Link href={`/mentorship/${x.id}`}>{x.mentor_name} / {x.mentee_name}</Link><small className="block">{x.program_name} · {x.status}</small></p>):<p className="text-xs">No linked mentor pairings.</p>}</section><section id="documents" className="card p-5"><div className="section-title"><h2>Documents</h2><Link href="/documents">View all</Link></div>{matchD===null?<p role="status">Documents unavailable.</p>:matchD.length?matchD.map(x=><p className="mb-3 text-xs" key={x.id}><Link href={`/documents/${x.id}`}>{x.name}</Link><small className="block">{x.document_type||'Metadata'} · {x.version||'Version not recorded'}</small></p>):<p className="text-xs">No accessible metadata linked.</p>}</section></div>;
}
