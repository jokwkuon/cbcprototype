import { crmContext } from "./crm-context";
import { validId } from "./crm-validation";
import { contributionTypes,fundingStatuses } from "./giving-validation";
import type { FieldDefinition } from "./crm-fields";
export type Contribution={id:string;organization_id:string|null;contact_id:string|null;organization_name:string|null;contact_name:string;contribution_date:string;amount:string;contribution_type:string;sponsorship_level:string|null;funding_status:string;program_id:string|null;event_id:string|null;program_name:string|null;event_name:string|null;agreement_start:string|null;agreement_end:string|null;renewal_date:string|null;notes:string|null;cash_received:string;pledged:string;outstanding:string;payment_status:string;currency:string};
export type Receipt={id:string;contribution_id:string;received_on:string;amount:string;reference:string|null;is_void:boolean;void_reason:string|null};
export type GivingSummary={year:number;as_of:string;period_end:string;prior_period_end:string;annual_cash:string;prior_cash:string;lifetime_cash:string;pledged:string;outstanding:string;in_kind_declared:string;yoy_delta:string;yoy_percent:string|null;comparison_basis:string};
export async function financeContext(){const ctx=await crmContext();return {...ctx,financialWriter:["admin","finance"].includes(ctx.profile.role)};}
type Client=Awaited<ReturnType<typeof crmContext>>["client"];
export async function contributions(client:Client,filter?:{organization?:string;contact?:string;id?:string}) {
 let q=client.from("contribution_details").select("*").order("contribution_date",{ascending:false}).order("id");
 if(filter?.organization) q=q.eq("organization_id",filter.organization);
 if(filter?.contact) q=q.eq("contact_id",filter.contact);
 if(filter?.id) {if(!validId(filter.id)) return [];q=q.eq("id",filter.id);}
 const {data,error}=await q;if(error) throw new Error("Giving data unavailable. No failed query is reported as zero revenue.");return (data??[]) as Contribution[];
}
export async function givingSummary(client:Client,year:number,filter?:{organization?:string;contact?:string}) {
 const {data,error}=await client.rpc("giving_summary",{p_year:year,p_organization_id:filter?.organization??null,p_contact_id:filter?.contact??null});
 if(error||!data) throw new Error("Financial summary unavailable.");return data as GivingSummary;
}
const options=(values:string[])=>values.map(id=>({id,name:id}));
export const receiptFields:FieldDefinition[]=[{name:"received_on",label:"Received on",type:"date",required:true,hint:"Actual cash received; future dates are rejected."},{name:"amount",label:"Receipt amount (CAD)",required:true},{name:"reference",label:"Receipt reference"},{name:"disposition",label:"Disposition",type:"select",options:[{id:"active",name:"Active"},{id:"void",name:"Void"}]},{name:"void_reason",label:"Void reason",type:"textarea"}];
export const documentFields:FieldDefinition[]=[{name:"label",label:"Document label",required:true},{name:"url",label:"Document URL",required:true,hint:"Reference only. Use synthetic example.test links; no confidential documents."}];
export const initiativeFields:FieldDefinition[]=[{name:"name",label:"Initiative name",required:true},{name:"kind",label:"Initiative kind",type:"select",options:options(["Program","Event"]),required:true}];
export async function givingFormData(id?:string) {
 const {client,financialWriter}=await financeContext();if(!financialWriter) throw new Error("Admin or Finance access required.");
 const [orgs,contacts,initiatives,records]=await Promise.all([client.from("organizations").select("id,name").order("name"),client.from("contacts").select("id,first_name,last_name").order("last_name"),client.from("funding_initiatives").select("id,name,kind").order("name"),id?contributions(client,{id}):[]]);
 if(orgs.error||contacts.error||initiatives.error) throw new Error("Unable to load giving selections.");
 if(id&&!records.length) return null;
 const blank={id:"",name:"Not linked"};
 const fields:FieldDefinition[]=[
 {name:"organization_id",label:"Organization",type:"select",options:[blank,...(orgs.data??[])]},
 {name:"contact_id",label:"Contact",type:"select",options:[blank,...(contacts.data??[]).map(c=>({id:c.id,name:`${c.first_name} ${c.last_name}`}))]},
 {name:"contribution_date",label:"Contribution Date",type:"date",required:true},
 {name:"amount",label:"Amount (CAD)",required:true,hint:"Planned/pledged amount. Does not create cash revenue. In-kind: manual declared value only."},
 {name:"contribution_type",label:"Contribution Type",type:"select",options:options(contributionTypes),required:true},
 {name:"sponsorship_level",label:"Sponsorship Level",hint:"Manual label; no approved tier taxonomy assumed."},
 ...(["Program","Event"] as const).map(kind=>({name:kind.toLowerCase()+"_id",label:kind,type:"select" as const,options:[blank,...(initiatives.data??[]).filter(i=>i.kind===kind)]})),
 {name:"funding_status",label:"Funding Status",type:"select",options:options(fundingStatuses),required:true,hint:"Planning stage; receipt history determines payment status."},
 {name:"agreement_start",label:"Agreement Start",type:"date"},{name:"agreement_end",label:"Agreement End",type:"date"},{name:"renewal_date",label:"Renewal Date",type:"date",hint:"Manually scheduled. Automatic renewal rules remain pending."},{name:"notes",label:"Notes",type:"textarea"}];
 return {fields,values:records[0]?{...records[0]}:{contribution_type:"Cash",funding_status:"Committed"}};
}
