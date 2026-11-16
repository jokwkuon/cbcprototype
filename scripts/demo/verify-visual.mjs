// Read-only verification of the presentation fixture, never a test-data writer.
import {check,sql,login,privateWrite} from './client.mjs';
check(process.env.CBC_DEMO_INSTANCE==='presentation','Select the isolated presentation instance');
const counts=JSON.parse(sql("select json_build_object('organizations',(select count(*) from public.organizations),'contacts',(select count(*) from public.contacts),'memberships',(select count(*) from public.memberships),'pairings',(select count(*) from public.mentorship_pairs),'documents',(select count(*) from public.documents),'recipients',(select count(*) from public.program_recipients),'enrollments',(select count(*) from public.program_enrollments),'contributions',(select count(*) from public.contributions),'receipts',(select count(*) from public.cash_receipts));"));
const expected={organizations:15,contacts:29,memberships:9,pairings:5,documents:15,recipients:6,enrollments:8,contributions:10,receipts:6};
for(const [table,count]of Object.entries(expected))check(counts[table]===count,`Unexpected ${table} count`);
check(sql("select count(*) from (select name from public.organizations group by name having count(*)>1) t;")==='0','Duplicate organization names');
check(sql("select count(*) from (select first_name,last_name from public.contacts group by first_name,last_name having count(*)>1) t;")==='0','Duplicate contact identities');
check(sql("select count(*) from public.organizations where name ~ '[0-9]{5,}';")==='0','Generated display-name suffix');
const c=await login('finance'),result=await c.rpc('giving_summary',{p_year:2026,p_organization_id:null,p_contact_id:null});check(!result.error,'Financial summary failed');
const summary=Array.isArray(result.data)?result.data[0]:result.data;
const cents=value=>{const [w,f='']=String(value).split('.');return BigInt(w)*100n+BigInt(f.padEnd(2,'0'));};
for(const [key,value]of Object.entries({annual_cash:'3650.00',lifetime_cash:'3850.00',pledged:'6700.00',outstanding:'2850.00',in_kind_declared:'1300.00'}))check(cents(summary[key])===cents(value),`Financial reconciliation failed: ${key}`);
privateWrite('visual-verification.json',{counts,finance:summary,checks:17,synthetic:true,readOnly:true});
console.log('PASS: clean presentation counts, unique organization/contact names, no generated display suffixes and five exact expected financial totals.');
