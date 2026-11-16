import type {crmContext} from './crm-context';
import {readAll} from './read-all';
import {validId} from './crm-validation';

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
export async function relationshipDirectory(client: Client, kind: RelationshipKind, view: DirectoryParams = {}) {
  const table = kind === 'organization' ? 'organization_directory' : 'contact_directory';
  const requested = Number(view.page);
  let page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested,1000000) : 1;
  function query(head=false) {
    let query = client.from(table).select('id,name,context,status,category,categoryId,email,location,priority',{count:'exact',head});
    if(view.q?.trim()) query = query.ilike('search_text',`%${view.q.trim().slice(0,80).replace(/[\\%_]/g, '\\$&')}%`);
    if(view.status) query = query.eq(kind === 'organization' ? 'status' : 'categoryId',view.status === 'unlinked' ? '' : view.status);
    if(view.group === 'category' || view.group === 'status') query = query.order(view.group);
    return query.order('name',{ascending:view.sort !== 'desc'}).order('id');
  }
  // A direct selected-record link opens the page containing it, preserving V3 behavior.
  if(!view.page && view.selected && validId(view.selected)) {
    const selected = await query().eq('id',view.selected).maybeSingle();
    if(selected.error) throw new Error('Unable to locate the selected record.');
    if(selected.data) {
      const row = selected.data as DirectoryRecord;
      const literal = (value:string) => `"${value.replaceAll('\\','\\\\').replaceAll('"','\\"')}"`;
      const direction = view.sort === 'desc' ? 'gt' : 'lt';
      const nameBefore = `name.${direction}.${literal(row.name)}`;
      const tiedName = `and(name.eq.${literal(row.name)},id.lt.${row.id})`;
      const group = view.group === 'category' || view.group === 'status' ? view.group : null;
      const before = group ? `${group}.lt.${literal(row[group])},and(${group}.eq.${literal(row[group])},or(${nameBefore},${tiedName}))` : `${nameBefore},${tiedName}`;
      const rank = await query(true).or(before);
      if(rank.error || rank.count === null) throw new Error('Unable to locate the selected results page.');
      page = Math.floor(rank.count/10)+1;
    }
  }
  let result = await query().range((page-1)*10,page*10-1);
  if(result.error?.code === 'PGRST103') {
    const total = await query(true);
    if(total.error || total.count === null) throw new Error('Unable to load directory. Reload to retry.');
    page=Math.max(1,Math.ceil(total.count/10));
    result=await query().range((page-1)*10,page*10-1);
  }
  if(result.error || result.count === null) throw new Error('Unable to load directory. Reload to retry.');
  const pages = Math.max(1,Math.ceil(result.count/10));
  if(page > pages) {page=pages;result=await query().range((page-1)*10,page*10-1);}
  if(result.error || result.count === null) throw new Error('Unable to load directory. Reload to retry.');
  // Only minimal labels for the existing affiliation picker, never full contact/organization records.
  const options = kind === 'organization'
    ? ['Prospect','Cultivate','Proposal','Committed','Active','Lapsed'].map(value=>[value,value] as [string,string])
    : [['unlinked','Not linked'] as [string,string],...(await readAll<{id:string;name:string}>((a,b)=>client.from('organizations').select('id,name',{count:'exact'}).order('id').range(a,b))).map(row=>[row.id,row.name] as [string,string]).sort((a,b)=>a[1].localeCompare(b[1]))];
  return {rows:(result.data || []) as DirectoryRecord[],total:result.count,page,options};
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
