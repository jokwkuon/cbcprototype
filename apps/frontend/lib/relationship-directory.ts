import type {crmContext} from './crm-context';
import {readAll} from './read-all';

export type RelationshipKind = 'organization' | 'contact';
export type DirectoryRecord = {
  id: string;
  name: string;
  context: string;
  status: string;
  category: string;
  categoryId: string;
  email?: string;
  location?: string;
  priority?: string;
};
export type DirectoryParams = {q?: string; status?: string; group?: string; sort?: string; page?: string; selected?: string};

type Client = Awaited<ReturnType<typeof crmContext>>['client'];
export async function relationshipDirectory(client: Client, kind: RelationshipKind): Promise<DirectoryRecord[]> {
  if (kind === 'organization') {
    const rows = await readAll<{id:string; name:string; industry:string|null; relationship_status:string; organization_type:string|null; priority_level:string; location:string|null}>((a,b) =>
      client.from('organizations').select('id,name,industry,relationship_status,organization_type,priority_level,location', {count:'exact'}).order('id').range(a,b));
    return rows.map(r => ({id:r.id, name:r.name, context:r.industry || 'Industry not recorded', status:r.relationship_status, category:r.organization_type || 'Type not recorded', categoryId:r.organization_type || '', location:r.location || '', priority:r.priority_level}));
  }
  const [contacts, organizations] = await Promise.all([
    readAll<{id:string; first_name:string; last_name:string; title:string|null; email:string|null; organization_id:string|null; contact_type:string|null}>((a,b) =>
      client.from('contacts').select('id,first_name,last_name,title,email,organization_id,contact_type', {count:'exact'}).order('id').range(a,b)),
    readAll<{id:string; name:string}>((a,b) => client.from('organizations').select('id,name', {count:'exact'}).order('id').range(a,b)),
  ]);
  const names = new Map(organizations.map(o => [o.id,o.name]));
  return contacts.map(c => ({id:c.id, name:`${c.first_name} ${c.last_name}`, context:c.title || 'Title not recorded', status:c.contact_type || 'Type not recorded', category:names.get(c.organization_id || '') || 'Not linked', categoryId:c.organization_id || '', email:c.email || ''}));
}

export function directoryRows(rows: DirectoryRecord[], kind: RelationshipKind, view: DirectoryParams) {
  const query = (view.q || '').toLowerCase(), status = view.status || '';
  const group = view.group === 'category' ? 'category' : view.group === 'status' ? 'status' : '';
  return rows.filter(r => (!query || `${r.name} ${r.context} ${r.category} ${r.email || ''} ${r.location || ''} ${r.id}`.toLowerCase().includes(query)) && (!status || (kind === 'organization' ? r.status : r.categoryId || 'unlinked') === status))
    .sort((a,b) => (group ? a[group].localeCompare(b[group]) : 0) || a.name.localeCompare(b.name) * (view.sort === 'desc' ? -1 : 1) || a.id.localeCompare(b.id));
}

export function directoryPage(rows: DirectoryRecord[], requested?: string, selected?: string) {
  const explicit = Number(requested);
  const selectedIndex = rows.findIndex(row => row.id === selected);
  const page = requested && Number.isSafeInteger(explicit) && explicit > 0 ? explicit : selectedIndex >= 0 ? Math.floor(selectedIndex / 10) + 1 : 1;
  return Math.min(Math.max(1, Math.ceil(rows.length / 10)),page);
}
