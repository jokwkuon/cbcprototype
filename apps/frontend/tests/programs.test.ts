import {test} from "node:test";
import assert from "node:assert/strict";
import {parseProgramForm,type ProgramKind} from "../lib/program-validation.ts";
import {ValidationError} from "../lib/crm-validation.ts";
const id="a0000000-0000-4000-8000-000000000001";
function form(values:Record<string,string>){const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,v);return f;}
test("REQ-010: required program/cohort/recipient identity and references",()=>{
 const invalid:[ProgramKind,Record<string,string>][]=[["program",{name:"  "}],["cohort",{program_id:id,label:"",year:"2024"}],["cohort",{program_id:id,label:"Synthetic",year:"0"}],["cohort",{program_id:id,label:"Synthetic",year:"2024.5"}],["recipient",{name:"  "}],["recipient",{name:"Synthetic",contact_id:"forged"}],["enrollment",{program_id:id,cohort_id:id,recipient_id:"forged"}]];
 for(const [kind,values] of invalid)assert.throws(()=>parseProgramForm(kind,form(values)),ValidationError);
});
test("REQ-010: exact support, unknown vs zero, no unsupported fields",()=>{
 const values={program_id:id,cohort_id:id,recipient_id:id,support_amount:"12345678901234567890.12",graduation_status:" Manual unknown ",employment_field:" Different discipline ",field_alignment:"true",graduation_rate:"100"};
 const out=parseProgramForm("enrollment",form(values));assert.equal(out.support_amount,"12345678901234567890.12");assert.equal(out.graduation_status,"Manual unknown");assert.equal(out.employment_field,"Different discipline");assert.equal(out.graduation_date,null);assert.ok(!Object.hasOwn(out,"field_alignment"));assert.ok(!Object.hasOwn(out,"graduation_rate"));
 assert.equal(parseProgramForm("enrollment",form({...values,support_amount:""})).support_amount,null);assert.equal(parseProgramForm("enrollment",form({...values,support_amount:"0"})).support_amount,"0");
 for(const amount of ["-1","NaN","Infinity","1.001","1e3"])assert.throws(()=>parseProgramForm("enrollment",form({...values,support_amount:amount})),ValidationError);
});
test("REQ-010: date validation, standalone and linked identity",()=>{
 assert.throws(()=>parseProgramForm("enrollment",form({program_id:id,cohort_id:id,recipient_id:id,graduation_date:"2025-02-29"})),ValidationError);
 assert.throws(()=>parseProgramForm("recipient",form({contact_id:id,alumni_since:"2024-02-30"})),ValidationError);
 assert.equal(parseProgramForm("recipient",form({contact_id:id,alumni_since:"2024-02-29"})).name,null);
 assert.equal(parseProgramForm("recipient",form({name:" Synthetic standalone "})).name,"Synthetic standalone");
});
