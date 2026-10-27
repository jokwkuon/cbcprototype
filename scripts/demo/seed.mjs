import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { local,readStatus } from "./prepare.mjs";
import { client,check,privateWrite,accounts,sql,login,uuid } from "./client.mjs";
const status=readStatus(),operator=client(status.env.SERVICE_ROLE_KEY);
const saved=existsSync(resolve(local,"accounts.json"))?accounts():[];
const list=await operator.auth.admin.listUsers({page:1,perPage:100});check(!list.error,"Unable to list local demo Auth users.");
const result=[];
for(const [name,role] of [["admin","admin"],["staff-a","staff"],["staff-b","staff"],["finance","finance"],["viewer","viewer"]]){
 const email=`cbc-demo-${name}@example.test`;let user=list.data.users.find(user=>user.email===email),record=saved.find(a=>a.email===email);
 if(user){check(user.user_metadata?.cbc_synthetic_demo===true&&record?.id===user.id,"Existing demo identity lacks matching private credentials; refuse to overwrite it.");}
 else{const password=randomBytes(24).toString("base64url")+"aA7!";const created=await operator.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:`Synthetic Demo ${name}`,cbc_synthetic_demo:true}});check(!created.error&&created.data.user,"Local Auth user creation failed.");user=created.data.user;record={id:user.id,email,password,role,name};}
 result.push(record);privateWrite("accounts.json",result);
 sql(`update public.profiles set role='${role}',is_active=true where id='${uuid(user.id)}';`);
}
const admin=await login("admin"),staff=result.filter(a=>a.role==="staff");
const orgId="60000000-0000-4000-8000-000000000001",contactIds=["61000000-0000-4000-8000-000000000001","61000000-0000-4000-8000-000000000002"];
const org=await admin.from("organizations").upsert({id:orgId,name:"Synthetic Demo Community Partner",organization_type:"Community Partner",industry:"Synthetic services",website:"https://example.test/",location:"Demo City",relationship_owner:staff[0].id,relationship_status:"Active",relationship_strength:"High",priority_level:"High",potential:"Medium",estimated_opportunity:1000,notes:"Synthetic demonstration only; no CBC records."});check(!org.error,"Organization seed failed.");
for(const [index,id] of contactIds.entries()){const c=await admin.from("contacts").upsert({id,organization_id:orgId,first_name:"Synthetic",last_name:`Participant ${index+1}`,title:"Demo contact",email:`participant-${index+1}@example.test`,phone:"555-0100",contact_type:"Relationship Contact",influence_level:"Medium",interests:"Demo programs",notes:"Synthetic only"});check(!c.error,"Contact seed failed.");}
check(!(await admin.from("organizations").update({primary_contact_id:contactIds[0]}).eq("id",orgId)).error,"Primary contact seed failed.");
const existing=await admin.from("activities").select("id").eq("organization_id",orgId).eq("purpose","Synthetic Demo Check-in").maybeSingle();check(!existing.error,"Seed activity lookup failed.");
const values={organization_id:orgId,occurred_at:"2020-07-15T14:30:00Z",activity_type:"Meeting",location:"Synthetic room",purpose:"Synthetic Demo Check-in",key_discussion:"Demo discussion",sponsor_needs:"Demo needs",cbc_opportunity:"Demo opportunity",outcome:"Demo follow-up agreed"};
const activity=await admin.rpc("save_activity",{p_id:existing.data?.id??null,p_values:values,p_contacts:contactIds});check(!activity.error&&activity.data,"Activity seed failed.");
const calendar=await admin.rpc("activity_today");check(!calendar.error,"Demo date lookup failed.");
const day=offset=>{const d=new Date(calendar.data+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);};
const taskNames=["Overdue proposal","Due today","Upcoming check-in","Completed thank-you","Undated action","Outside seven-day queue"];
for(let index=0;index<taskNames.length;index++){
 const task={id:`62000000-0000-4000-8000-${String(index+1).padStart(12,"0")}`,activity_id:activity.data,description:`Synthetic Demo ${taskNames[index]}`,owner_id:staff[index%2].id,due_date:index===4?null:day([-1,0,2,-1,0,10][index]),completed_at:index===3?new Date().toISOString():null};
 check(!(await admin.from("tasks").upsert(task)).error,"Follow-up seed failed.");
}
privateWrite("records.json",{organizationId:orgId,contactIds,activityId:activity.data,taskCount:6,calendarDate:calendar.data});
console.log("Seeded five real local Auth accounts, one organization, two contacts, one activity and six follow-ups. Passwords are private; no hosted data touched.");
await (await import('./seed-giving.mjs')).seedGiving();
console.log('Seeded five contributions, four receipt records, two typed initiative references and one synthetic document link.');
