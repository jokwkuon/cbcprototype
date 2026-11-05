import {crmContext} from '../../../lib/crm-context';
import {searchFilter,searchTerm} from '../../../lib/search-query';
const headers = {'Cache-Control':'private, no-store'};
export async function GET(request:Request) {
  try {
    const {client} = await crmContext();
    const q = searchTerm(new URL(request.url).searchParams.get('q') || '');
    if(q.length < 2) return Response.json({results:[]},{headers});
    const responses = await Promise.all([
      client.from('organizations').select('id,name,industry').or(searchFilter(['name','industry'],q)).order('name').order('id').limit(6),
      client.from('contacts').select('id,first_name,last_name,email').or(searchFilter(['first_name','last_name','email'],q)).order('last_name').order('first_name').order('id').limit(6),
      client.from('programs').select('id,name').ilike('name',`%${q}%`).order('name').order('id').limit(6),
      client.from('documents').select('id,name,document_type').or(searchFilter(['name','document_type'],q)).order('name').order('id').limit(6),
    ]);
    if(responses.some(result => result.error)) throw new Error('Search query failed');
    const [organizations,contacts,programs,documents] = responses;
    const results = [
      ...(organizations.data || []).map(r=>({id:r.id,name:r.name,type:'organizations',href:`/organizations/${r.id}`,context:r.industry||'Organization'})),
      ...(contacts.data || []).map(r=>({id:r.id,name:`${r.first_name} ${r.last_name}`,type:'contacts',href:`/contacts/${r.id}`,context:r.email||'Contact'})),
      ...(programs.data || []).map(r=>({id:r.id,name:r.name,type:'programs',href:`/programs/${r.id}`,context:'Program'})),
      ...(documents.data || []).map(r=>({id:r.id,name:r.name,type:'documents',href:`/documents/${r.id}`,context:r.document_type||'Document metadata'})),
    ];
    return Response.json({results},{headers});
  } catch {
    return Response.json({error:'Search unavailable.'},{status:503,headers});
  }
}
