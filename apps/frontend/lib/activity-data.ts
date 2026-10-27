import { utcInputValue } from "./activity-validation";
import { crmContext, ownerOptions } from "./crm-context";
import { activityFields, followUpFields } from "./activity-fields";
import type { FieldDefinition } from "./crm-fields";
import { validId } from "./crm-validation";
export type Activity = { id:string; organization_id:string|null; occurred_at:string; activity_type:string; location:string|null; purpose:string|null; key_discussion:string|null; sponsor_needs:string|null; cbc_opportunity:string|null; outcome:string|null };
export type FollowUp = { id:string; activity_id:string; description:string; owner_id:string|null; due_date:string|null; completed_at:string|null; status:"Open"|"Complete"|"Overdue"; organization_id:string|null; organization_name:string|null; activity_purpose:string|null; activity_type:string; owner_name:string|null };
type Client = Awaited<ReturnType<typeof crmContext>>["client"];
export function displayTime(value:string|null) { return value ? new Date(value).toISOString().replace("T"," ").replace(/\.\d{3}Z$/," UTC") : "No past activity"; }
export async function activityById(client:Client,id:string) {
  if (!validId(id)) return null;
  const {data,error}=await client.from("activities").select("*").eq("id",id).maybeSingle();
  if(error) throw new Error("Unable to load activity."); return data as Activity|null;
}
export async function followUps(client:Client, activityIds?:string[]) {
  if(activityIds?.length===0) return [];
  let query=client.from("follow_ups").select("*").order("due_date",{ascending:true,nullsFirst:false}).order("id");
  if(activityIds) query=query.in("activity_id",activityIds);
  const {data,error}=await query;
  if(error) throw new Error("Unable to load follow-ups. No failed query is reported as an empty queue.");
  return (data??[]) as FollowUp[];
}
export async function businessToday(client:Client) {
  const {data,error}=await client.rpc("activity_today");
  if(error||!data) throw new Error("Unable to determine the action calendar date.");
  return String(data);
}
export async function lastContact(client:Client, parameters:{p_activity_id?:string;p_organization_id?:string;p_contact_id?:string}) {
  const {data,error}=await client.rpc("activity_last_contact",parameters);
  if(error) throw new Error("Unable to calculate Last Contact.");
  return data as string|null;
}
export async function relatedHistory(client:Client,kind:"organization"|"contact",id:string) {
  let ids:string[]|undefined;
  if(kind==="contact") {
    const {data,error}=await client.from("activity_contacts").select("activity_id").eq("contact_id",id);
    if(error) throw new Error("Unable to load activity links.");
    ids=(data??[]).map(row=>String(row.activity_id));
  }
  let activities:Activity[]=[];
  if(!ids||ids.length) {
    let query=client.from("activities").select("*").order("occurred_at",{ascending:false}).order("id");
    query=kind==="organization"?query.eq("organization_id",id):query.in("id",ids!);
    const {data,error}=await query;if(error) throw new Error("Unable to load related activities."); activities=(data??[]) as Activity[];
  }
  const [tasks,last]=await Promise.all([followUps(client,activities.map(row=>row.id)),lastContact(client,kind==="organization"?{p_organization_id:id}:{p_contact_id:id})]);
  return {activities,tasks,last};
}
export async function activityFormData(id?:string) {
  const {client,canWrite}=await crmContext();if(!canWrite) throw new Error("Your role has read-only access.");
  const [orgs,contacts,activity,links]=await Promise.all([
    client.from("organizations").select("id,name").order("name"), client.from("contacts").select("id,first_name,last_name").order("last_name"),
    id?activityById(client,id):null,
    id?client.from("activity_contacts").select("contact_id").eq("activity_id",id):{data:[],error:null},
  ]);
  if(orgs.error||contacts.error||links.error) throw new Error("Unable to load activity selections.");
  if(id&&!activity) return null;
  const fields:FieldDefinition[]=[...activityFields,
    {name:"organization_id",label:"Organization",type:"select",options:[{id:"",name:"Not linked"},...(orgs.data??[])]},
    {name:"contact_ids",label:"Contact(s)",type:"multiselect",options:(contacts.data??[]).map(c=>({id:c.id,name:`${c.first_name} ${c.last_name}`})),hint:"Select one or more participants with Ctrl/Cmd or Shift. Contacts need not share an organization."},
  ];
  return {fields,values:{...activity,occurred_at:activity?utcInputValue(activity.occurred_at):new Date().toISOString().slice(0,16),contact_ids:(links.data??[]).map(c=>String(c.contact_id))}};
}
export async function followUpFormData(client:Client,task?:FollowUp) {
  const owners=await ownerOptions(client);
  if(task?.owner_id&&!owners.some(owner=>owner.id===task.owner_id)) owners.push({id:task.owner_id,name:"Current owner (restricted or inactive) — preserve or select a permitted owner"});
  const fields:FieldDefinition[]=[followUpFields[0],{name:"owner_id",label:"Action Owner",type:"select",options:[{id:"",name:"Unassigned"},...owners]},...followUpFields.slice(1)];
  const values:Record<string,string|null>=task?{id:task.id,description:task.description,owner_id:task.owner_id,due_date:task.due_date,completion:task.completed_at?"complete":"open"}:{completion:"open"};
  return {fields,values};
}

export function requestTime() { return Date.now(); }
