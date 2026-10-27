import { test } from "node:test";
import assert from "node:assert/strict";
import { parseActivity,parseFollowUp,validDate,activityValues,utcInputValue } from "../lib/activity-validation.ts";
import { ValidationError } from "../lib/crm-validation.ts";
const form=(values:Record<string,string>)=>{const f=new FormData();for(const [key,value] of Object.entries(values))f.set(key,value);return f;};
test("REQ-005: preserve UTC timestamp, trim discussion fields and deduplicate participants",()=>{
 const f=form({occurred_at:"2026-07-01T14:30",activity_type:" Coffee ",purpose:" Demo ",key_discussion:" Notes ",sponsor_needs:" Needs ",cbc_opportunity:" Opportunity ",outcome:" Outcome "});
 f.append("contact_ids","30000000-0000-4000-8000-000000000001");f.append("contact_ids","30000000-0000-4000-8000-000000000001");
 const parsed=parseActivity(f);assert.equal(parsed.values.occurred_at,"2026-07-01T14:30:00.000Z");assert.equal(parsed.values.key_discussion,"Notes");assert.equal(parsed.contacts.length,1);assert.equal(parsed.values.organization_id,null);
 assert.equal(activityValues(f).contact_ids.length,2);
});
test("REQ-005: reject impossible calendar/time and forged participants",()=>{
 for(const occurred_at of ["2026-02-30T12:00","2026-01-01T25:00","bad",""]){assert.throws(()=>parseActivity(form({occurred_at,activity_type:"Call"})),ValidationError);}
 const f=form({occurred_at:"2026-01-01T12:00",activity_type:"Call"});f.append("contact_ids","forged");assert.throws(()=>parseActivity(f),ValidationError);
 assert.throws(()=>parseActivity(form({occurred_at:"2026-01-01T12:00",activity_type:" "})),ValidationError);
});
test("REQ-005: follow-up due-date validation and lifecycle intention",()=>{
 assert.equal(validDate("2024-02-29"),true);assert.equal(validDate("2026-02-29"),false);
 const p=parseFollowUp(form({description:" Follow up ",due_date:"2026-12-01",completion:"complete"}));assert.equal(p.complete,true);assert.equal(p.description,"Follow up");assert.equal(p.owner_id,null);
 const undated=parseFollowUp(form({description:"No date",completion:"open"}));assert.equal(undated.due_date,null);assert.equal(undated.complete,false);
 assert.throws(()=>parseFollowUp(form({description:"",due_date:"tomorrow",owner_id:"bad",completion:"Overdue"})),ValidationError);
});

test("REQ-005: edit input normalizes database offset timestamps to UTC",()=>{assert.equal(utcInputValue("2020-07-15T08:30:00-06:00"),"2020-07-15T14:30");});
