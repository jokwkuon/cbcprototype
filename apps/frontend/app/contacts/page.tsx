import Link from 'next/link';
import {Shell} from '../../components/shell';
import {PageHeader} from '../../components/ui';
import {DataTable} from '../../components/data-table';
import {crmContext} from '../../lib/crm-context';
import {readAll} from '../../lib/read-all';
export default async function Contacts({searchParams}:{searchParams:Promise<{q?:string}>}){
 const {client,canWrite}=await crmContext(),params=await searchParams,q=typeof params.q==='string'?params.q:'';
 const contactRows=await readAll<{id:string;first_name:string;last_name:string;email:string|null;title:string|null;contact_type:string|null;influence_level:string|null;organization_id:string|null}>((a,b)=>client.from('contacts').select('id,first_name,last_name,email,title,contact_type,influence_level,organization_id',{count:'exact'}).order('id').range(a,b));
 const organizations=await readAll<{id:string;name:string}>((a,b)=>client.from('organizations').select('id,name',{count:'exact'}).order('id').range(a,b));
 const rows=contactRows.map(c=>({...c,organization:organizations.find(o=>o.id===c.organization_id)||null}));
 const filtered=rows.filter(r=>`${r.first_name} ${r.last_name} ${r.email||''} ${r.organization?.name||''}`.toLowerCase().includes(q.toLowerCase()));
 return <Shell><PageHeader title="Contacts" subtitle="The people behind every partnership. Keep their context close." action={canWrite&&<Link className="button button-primary" href="/contacts/new">+ Add contact</Link>}/><div className="contact-summary"><span><b>{rows.length}</b> Total Contacts</span><span>Decision Makers <small>Definition pending</small></span><span>Recently Contacted <small>Definition pending</small></span></div><form className="mb-5 flex gap-3"><input name="q" defaultValue={q} placeholder="Search contacts…" aria-label="Search contacts"/><button type="submit">Search</button></form><DataTable label="Contacts" emptyMessage="No contacts found." columns={[{key:'name',label:'Contact'},{key:'organization',label:'Organization'},{key:'email',label:'Email'},{key:'type',label:'Type'},{key:'influence',label:'Influence'},{key:'activity',label:'Activity'}]} rows={filtered.map(r=>({id:r.id,href:`/contacts/${r.id}`,editHref:canWrite?`/contacts/${r.id}/edit`:undefined,cells:{name:{text:`${r.first_name} ${r.last_name}`,href:`/contacts/${r.id}`,kind:'identity',hint:r.title||'Title not recorded'},organization:{text:r.organization?.name||'Not linked',href:r.organization?`/organizations/${r.organization.id}`:undefined},email:{text:r.email},type:{text:r.contact_type},influence:{text:r.influence_level,kind:'status'},activity:{text:'View timeline',href:`/contacts/${r.id}#activities`}}}))}/></Shell>;
}
