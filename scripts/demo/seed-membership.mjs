import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {local} from './prepare.mjs';
import {login,check,privateWrite} from './client.mjs';
export async function seedMembership(){
 const c=await login('admin'),base=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8'));
 const {data:today,error}=await c.rpc('activity_today');check(!error,'Membership seed date failed.');
 const date=n=>{const d=new Date(`${today}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const ids=['b0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000003'];
 const rows=[{id:ids[0],contact_id:base.contactIds[0],member_organization_id:null,organization_id:base.organizationId,membership_type:'Synthetic Individual',industry:'Synthetic services',start_date:date(-365),renewal_date:date(-1),fee:'50.10',payment_status:'Recorded unpaid'},{id:ids[1],contact_id:base.contactIds[0],member_organization_id:null,organization_id:base.organizationId,membership_type:'Synthetic Individual',start_date:today,renewal_date:date(20),fee:'60.20',payment_status:'Recorded paid'},{id:ids[2],contact_id:null,member_organization_id:base.organizationId,organization_id:null,membership_type:'Synthetic Corporate',start_date:date(1),renewal_date:null,fee:null,payment_status:null}];
 check(!(await c.from('memberships').upsert(rows)).error,'Membership seed failed.');privateWrite('membership-records.json',{ids,today});
}
