import type { FieldDefinition } from "./crm-fields";
export const activityFields: FieldDefinition[] = [
  {name:"occurred_at",label:"Date / Time",type:"datetime-local",required:true,hint:"UTC. Future times represent planned activities and do not advance Last Contact."},
  {name:"activity_type",label:"Activity Type",required:true,hint:"For example Meeting, Call, Email, Lunch, Coffee, Golf or Event. Custom types are allowed."},
  {name:"location",label:"Location"},{name:"purpose",label:"Purpose"},
  {name:"key_discussion",label:"Key Discussion",type:"textarea"}, {name:"sponsor_needs",label:"Sponsor Needs",type:"textarea"},
  {name:"cbc_opportunity",label:"CBC Opportunity",type:"textarea"}, {name:"outcome",label:"Outcome",type:"textarea"},
];
export const followUpFields: FieldDefinition[] = [
  {name:"description",label:"Next Action",required:true},
  {name:"due_date",label:"Due Date",type:"date",hint:"Calgary calendar date. Incomplete actions become overdue the following day."},
  {name:"completion",label:"Completion",type:"select",options:[{id:"open",name:"Open"},{id:"complete",name:"Complete"}],hint:"Overdue status is calculated; completion can be reopened."},
];
