import type {crmContext} from './crm-context';
import {lastContact,type Activity,type FollowUp} from './activity-data';
import type {RelationshipKind} from './relationship-directory';
import {HISTORY_PAGE_SIZE,historyAfter,type HistorySection,type HistoryCursor} from './history-query';
import {validId} from './crm-validation';
type Client = Awaited<ReturnType<typeof crmContext>>['client'];
export type HistoryPage<T> = {rows:T[];total:number;next:HistoryCursor|null};
export async function relationshipHistoryPage(client:Client,kind:RelationshipKind,id:string,section:HistorySection,cursor:HistoryCursor|null=null):Promise<HistoryPage<Activity|FollowUp>> {
  if(!validId(id)) throw new Error('Invalid relationship reference.');
  const activity = section === 'activities';
  // Inner joins scope contact links in PostgreSQL, avoiding large IN lists.
  const select = kind === 'organization' ? '*' : activity ? '*,activity_contacts!inner(contact_id)' : '*,activities!tasks_activity_id_fkey!inner(activity_contacts!inner(contact_id))';
  let query = client.from(activity ? 'activities' : 'follow_ups').select(select,{count:'exact'});
  query = kind === 'organization' ? query.eq('organization_id',id) : query.eq(activity ? 'activity_contacts.contact_id' : 'activities.activity_contacts.contact_id',id);
  if(!activity) query = section === 'open' ? query.is('completed_at',null) : query.not('completed_at','is',null);
  query = activity ? query.order('occurred_at',{ascending:false}).order('id') : query.order('due_date',{ascending:true,nullsFirst:false}).order('id');
  if(cursor) query = query.or(historyAfter(section,cursor));
  const {data,error,count} = await query.limit(HISTORY_PAGE_SIZE+1);
  if(error || !data || count === null) throw new Error('Relationship history unavailable. Try again.');
  const rows = data.slice(0,HISTORY_PAGE_SIZE) as unknown as (Activity|FollowUp)[];
  const end=rows.at(-1);
  return {rows,total:count,next:data.length>HISTORY_PAGE_SIZE&&end ? {id:end.id,value:activity ? (end as Activity).occurred_at : (end as FollowUp).due_date} : null};
}
export async function relationshipHistory(client:Client,kind:RelationshipKind,id:string) {
  const [activities,open,completed,last] = await Promise.all([
    relationshipHistoryPage(client,kind,id,'activities'),relationshipHistoryPage(client,kind,id,'open'),relationshipHistoryPage(client,kind,id,'completed'),
    lastContact(client,kind === 'organization' ? {p_organization_id:id} : {p_contact_id:id}),
  ]);
  return {activities:activities as HistoryPage<Activity>,open:open as HistoryPage<FollowUp>,completed:completed as HistoryPage<FollowUp>,last};
}
