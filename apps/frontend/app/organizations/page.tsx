import Link from 'next/link';
import {Shell} from '../../components/shell';
import {PageHeader} from '../../components/ui';
import {DataTable} from '../../components/data-table';
import {crmContext} from '../../lib/crm-context';
import {readAll} from '../../lib/read-all';
export default async function Organizations({searchParams}:{searchParams:Promise<{q?:string;status?:string}>}){
 const params=await searchParams,q=typeof params.q==='string'?params.q:'',status=typeof params.status==='string'?params.status:'',{client,canWrite}=await crmContext();
 const rows=await readAll<{id:string;name:string;industry:string|null;relationship_status:string;organization_type:string|null;priority_level:string;location:string|null;created_at:string}>((a,b)=>client.from('organizations').select('id,name,industry,relationship_status,organization_type,priority_level,location,created_at',{count:'exact'}).order('id').range(a,b));
 const visible=rows.filter(r=>(!q||`${r.name} ${r.industry||''} ${r.location||''}`.toLowerCase().includes(q.toLowerCase()))&&(!status||r.relationship_status===status));
 return <Shell><PageHeader title="Organizations" subtitle="A shared view of your companies, foundations and community partners." action={canWrite&&<Link className="button button-primary" href="/organizations/new">+ Add organization</Link>}/><form className="mb-5 flex flex-wrap gap-3"><input name="q" aria-label="Search organizations" defaultValue={q} placeholder="Search organizations…"/><label className="sr-only" htmlFor="org-status">Relationship status</label><select id="org-status" aria-label="Relationship status" name="status" defaultValue={status} className="max-w-48"><option value="">All relationship stages</option>{[...new Set(rows.map(r=>r.relationship_status))].sort().map(s=><option key={s}>{s}</option>)}</select><button type="submit">Search</button></form>
 <DataTable label="Organizations" emptyMessage="No organizations found." columns={[{key:'name',label:'Organization'},{key:'status',label:'Relationship stage'},{key:'type',label:'Type'},{key:'priority',label:'Priority'},{key:'location',label:'Location'},{key:'created',label:'Added'}]} rows={visible.map(r=>({id:r.id,href:`/organizations/${r.id}`,editHref:canWrite?`/organizations/${r.id}/edit`:undefined,cells:{name:{text:r.name,href:`/organizations/${r.id}`,hint:r.industry||'Industry not recorded',kind:'identity'},status:{text:r.relationship_status,kind:'status'},type:{text:r.organization_type},priority:{text:r.priority_level,kind:'status'},location:{text:r.location},created:{text:r.created_at,kind:'date'}}}))}/></Shell>;
}
