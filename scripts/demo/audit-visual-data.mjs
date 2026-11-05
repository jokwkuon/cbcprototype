// Read-only local audit. A matching name is evidence for review, never deletion authority.
import {sql,privateWrite} from './client.mjs';
const tables={organizations:"name",contacts:"first_name || ' ' || last_name",memberships:"membership_type",mentorship_pairs:"mentor_id::text || ' / ' || mentee_id::text",documents:"name",program_recipients:"coalesce(name,contact_id::text)",contributions:"organization_id::text"};
const results={syntheticLocalOnly:true,proposedRemovals:[],policy:'Unknown records are retained. Numeric suffixes and repeated labels are review candidates only. Membership terms, receipts and enrollments may legitimately repeat.',tables:{}};
for(const [table,label]of Object.entries(tables)){
 const records=JSON.parse(sql(`select coalesce(json_agg(r),'[]') from (select id,${label} as label,to_jsonb(t)->>'notes' as provenance from public.${table} t order by id) r;`));
 const counts=new Map();for(const r of records)counts.set(r.label,(counts.get(r.label)||0)+1);
 results.tables[table]={count:records.length,review:records.filter(r=>/\d{8,}/.test(r.label)||counts.get(r.label)>1).map(r=>({...r,reason:/\d{8,}/.test(r.label)?'Generated-looking suffix; compare source and private test evidence':'Repeated label; inspect linked identities and term dates',removalApproved:false})),records};
}
privateWrite('visual-data-audit.json',results);
console.log(JSON.stringify({counts:Object.fromEntries(Object.entries(results.tables).map(([k,v])=>[k,v.count])),reviewCandidates:Object.values(results.tables).reduce((n,v)=>n+v.review.length,0),proposedRemovals:0,report:'Selected instance: visual-data-audit.json'}));
