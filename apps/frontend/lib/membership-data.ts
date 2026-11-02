import { readAll } from './read-all';
import type { crmContext } from './crm-context';
type Client=Awaited<ReturnType<typeof crmContext>>['client'];
export type Membership={id:string;member_name:string;contact_id:string|null;member_organization_id:string|null;organization_id:string|null;linked_organization_id:string|null;organization_name:string|null;relationship_owner:string|null;membership_type:string;industry:string|null;start_date:string;renewal_date:string|null;fee:string|null;payment_status:string|null;notes:string|null;status:string;last_engagement:string|null;created_at:string;updated_at:string};
export function memberships(client:Client){return readAll<Membership>((a,b)=>client.from('membership_details').select('*',{count:'exact'}).order('id').range(a,b));}
export async function membershipOptions(client:Client){
 const [contacts,organizations]=await Promise.all([
 readAll<{id:string;first_name:string;last_name:string}>((a,b)=>client.from('contacts').select('id,first_name,last_name',{count:'exact'}).order('id').range(a,b)),
 readAll<{id:string;name:string}>((a,b)=>client.from('organizations').select('id,name',{count:'exact'}).order('id').range(a,b))]);
 return {contacts:contacts.map(c=>({id:c.id,name:`${c.first_name} ${c.last_name}`})),organizations};
}
