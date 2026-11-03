import {test} from "node:test";
import assert from "node:assert/strict";
import {parseInterest,parseOpportunity,interestValues} from "../lib/interest-validation.ts";
import {ValidationError} from "../lib/crm-validation.ts";
const org="80000000-0000-4000-8000-000000000001",link="81000000-0000-4000-8000-000000000001";
function form(values:Record<string,string|string[]>){const f=new FormData();for(const [k,v] of Object.entries(values))for(const s of Array.isArray(v)?v:[v])f.append(k,s);return f;}
test("REQ-014: organization and manual category required; identifiers validated",()=>{
 const invalid: Record<string,string|string[]>[] = [{},{organization_id:org,category:"  "},{organization_id:"forged",category:"Education"},{organization_id:org,category:"Education",primary_contact_id:"forged"},{organization_id:org,category:"Education",task_ids:["forged"]}];
 for(const values of invalid)assert.throws(()=>parseInterest(form(values)),ValidationError);
});
test("REQ-014: manual strength, optional links and deduplication; no derived values accepted",()=>{
 const f=form({organization_id:org,category:" Education ",strength:" Self assessed ",notes:" Synthetic ",program_ids:[link,link],activity_ids:[link],relationship_owner:link,last_discussed:"2099-01-01",archived_at:"2020-01-01"});
 const parsed=parseInterest(f);assert.deepEqual(parsed.programs,[link]);assert.deepEqual(parsed.tasks,[]);assert.equal(parsed.values.strength,"Self assessed");assert.equal(parsed.values.primary_contact_id,null);assert.equal(parsed.values.notes,"Synthetic");assert.ok(!Object.hasOwn(parsed.values,"relationship_owner"));assert.ok(!Object.hasOwn(parsed.values,"archived_at"));assert.deepEqual(interestValues(f).program_ids,[link,link]);
});
test("REQ-003/014: opportunity is a manual reference; exact estimate text retained",()=>{
 assert.deepEqual(parseOpportunity(form({organization_id:org,name:" Future Builders Partnership ",estimated_amount:"12345678901234567890.12"})),{organization_id:org,name:"Future Builders Partnership",estimated_amount:"12345678901234567890.12"});
 assert.equal(parseOpportunity(form({organization_id:org,name:"Future Builders Partnership"})).estimated_amount,null);
 for(const amount of ["NaN","Infinity","-1","1.001","1e3"])assert.throws(()=>parseOpportunity(form({organization_id:org,name:"Future Builders Partnership",estimated_amount:amount})),ValidationError);
});
