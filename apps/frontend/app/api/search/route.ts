import {crmContext} from '../../../lib/crm-context';
import {readAll} from '../../../lib/read-all';
export async function GET(request:Request){
 try{const {client}=await crmContext(),q=(new URL(request.url).searchParams.get('q')||'').trim().toLowerCase().slice(0,80);if(q.length<2)return Response.json({results:[]},{headers:{'Cache-Control':'private, no-store'}});
 const [organizations,contacts,programs,documents]=await Promise.all([
 readAll<{id:string;name:string;industry:string|null}>((a,b)=>client.from('organizations').select('id,name,industry',{count:'exact'}).order('id').range(a,b)),
 readAll<{id:string;first_name:string;last_name:string;email:string|null}>((a,b)=>client.from('contacts').select('id,first_name,last_name,email',{count:'exact'}).order('id').range(a,b)),
 readAll<{id:string;name:string}>((a,b)=>client.from('programs').select('id,name',{count:'exact'}).order('id').range(a,b)),
 readAll<{id:string;name:string;document_type:string|null}>((a,b)=>client.from('documents').select('id,name,document_type',{count:'exact'}).order('id').range(a,b))]);
 const groups=[organizations.map(r=>({...r,type:'organizations',href:`/organizations/${r.id}`,context:r.industry||'Organization'})),contacts.map(r=>({...r,name:`${r.first_name} ${r.last_name}`,type:'contacts',href:`/contacts/${r.id}`,context:r.email||'Contact'})),programs.map(r=>({...r,type:'programs',href:`/programs/${r.id}`,context:'Program'})),documents.map(r=>({...r,type:'documents',href:`/documents/${r.id}`,context:r.document_type||'Document metadata'}))];
 return Response.json({results:groups.flatMap(g=>g.filter(r=>`${r.name} ${r.context}`.toLowerCase().includes(q)).slice(0,6))},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:'Search unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
