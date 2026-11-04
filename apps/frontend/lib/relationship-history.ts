import type {crmContext} from './crm-context';
import {lastContact,type Activity,type FollowUp} from './activity-data';
import {readAll} from './read-all';
import type {RelationshipKind} from './relationship-directory';

type Client = Awaited<ReturnType<typeof crmContext>>['client'];
export async function relationshipHistory(client:Client,kind:RelationshipKind,id:string) {
  const links = kind === 'contact' ? await readAll<{id:string;activity_id:string}>((a,b) => client.from('activity_contacts').select('activity_id',{count:'exact'}).eq('contact_id',id).order('activity_id').range(a,b).then(result => ({...result,data:result.data?.map(r => ({...r,id:r.activity_id})) || null}))) : null;
  const activities = links?.length === 0 ? [] : await readAll<Activity>((a,b) => {
    let query = client.from('activities').select('*',{count:'exact'}).order('id');
    query = kind === 'organization' ? query.eq('organization_id',id) : query.in('id',links!.map(x => x.activity_id));
    return query.range(a,b);
  });
  activities.sort((a,b) => b.occurred_at.localeCompare(a.occurred_at) || a.id.localeCompare(b.id));
  const [tasks,last] = await Promise.all([
    activities.length ? readAll<FollowUp>((a,b) => client.from('follow_ups').select('*',{count:'exact'}).in('activity_id',activities.map(x => x.id)).order('id').range(a,b)) : [],
    lastContact(client,kind === 'organization' ? {p_organization_id:id} : {p_contact_id:id}),
  ]);
  tasks.sort((a,b) => (a.due_date || '9999').localeCompare(b.due_date || '9999') || a.id.localeCompare(b.id));
  return {activities,tasks,last};
}
