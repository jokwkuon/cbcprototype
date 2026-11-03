import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {local} from './prepare.mjs';
import {login,client,check,sql,privateWrite,accounts} from './client.mjs';
const base=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8')),seed=JSON.parse(readFileSync(resolve(local,'membership-records.json'),'utf8'));
let checks=0;function ok(v,l){check(v,l);checks++;}
for(const role of ['admin','staff','finance','viewer']){
 const c=await login(role),r=await c.from('membership_details').select('*').in('id',seed.ids).order('id');ok(!r.error&&r.data.length===3,`${role} reads memberships`);
 ok(r.data[0].status==='Renewal overdue'&&r.data[1].status==='Current term'&&r.data[2].status==='Scheduled','Date statuses');ok(r.data[0].fee==='50.10'&&r.data[2].fee===null,'Exact and unknown fee');
 const write=await c.from('memberships').insert({contact_id:base.contactIds[1],membership_type:'Partnership Review',start_date:seed.today,fee:'0.10'}).select('id').single();
 ok(['admin','staff'].includes(role)?!write.error:Boolean(write.error),`${role} writes`);
 if(write.data){for(const bad of [{member_organization_id:base.organizationId},{renewal_date:'1900-01-01'},{fee:'NaN'},{fee:'-1'},{fee:'1.001'},{contact_id:'ffffffff-ffff-4fff-8fff-ffffffffffff'}]){const x=await c.from('memberships').update(bad).eq('id',write.data.id).select();ok(Boolean(x.error),'Reject invalid membership');}}
}
const anon=await client().from('memberships').select('*');ok(Boolean(anon.error)||anon.data.length===0,'Anonymous denied');
const v=await login('viewer'),changed=await v.from('memberships').update({notes:'Denied'}).eq('id',seed.ids[0]).select();ok(!changed.data?.length,'Viewer update denied');
const staff=accounts().find(a=>a.role==='staff'),c=await login('staff');
try{sql(`update public.profiles set is_active=false where id='${staff.id}';`);const r=await c.from('membership_details').select('*');ok(!r.data?.length,'Inactive reads denied');const w=await c.from('memberships').insert({contact_id:base.contactIds[0],membership_type:'Denied',start_date:seed.today});ok(Boolean(w.error),'Inactive writes denied');}finally{sql(`update public.profiles set is_active=true where id='${staff.id}';`);}
privateWrite('membership-api-verification.json',{checks});console.log(`PASS: ${checks} real Membership Auth/PostgREST checks.`);
