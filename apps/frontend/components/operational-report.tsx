import Link from 'next/link';
import {operationalReport,type ReportFilters} from '../lib/operational-report';
import type {crmContext} from '../lib/crm-context';
import {DetailFields} from './fields';
import {FinancialSummary} from './giving';
import {BoardSummaries} from './board-summaries';
export async function OperationalReport({client,category,filters}:{client:Awaited<ReturnType<typeof crmContext>>['client'];category:string;filters:ReportFilters}){
 let report;try{report=await operationalReport(client,category,filters);}catch(e){return <section role="alert" className="card p-5"><h2>Report unavailable</h2><p>{e instanceof Error?e.message:'Unable to verify report.'} No totals are implied.</p><Link href={`/reports/${category}`}>Reset filters and retry</Link></section>;}
 const {rows,columns,metrics,pending,organizations,organization,programs,cohorts,program,cohort,status,q}=report;
 const query=new URLSearchParams();for(const [k,v]of Object.entries({organization,program,cohort,status,q}))if(v)query.set(k,v);
 return <><form className="my-5 flex flex-wrap items-end gap-3"><label>Search<input name="q" defaultValue={q}/></label><label>Organization<select name="organization" defaultValue={organization}><option value="">All organizations</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>{['scholarship','mentorship'].includes(category)&&<><label>Program<select name="program" defaultValue={program}><option value="">All programs</option>{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Cohort<select name="cohort" defaultValue={cohort}><option value="">All cohorts</option>{cohorts.map(c=><option key={c.id} value={c.id}>{programs.find(p=>p.id===c.program_id)?.name} / {c.label}</option>)}</select></label></>}{['membership','mentorship'].includes(category)&&<label>Status (exact)<input name="status" defaultValue={status}/></label>}<button>Apply report filters</button></form>
 <section className="card my-5 p-5"><h2 className="font-bold">Verified record summary</h2><DetailFields fields={metrics}/><p>{pending}</p></section>
 <Link className="underline" href={`/reports/${category}/export?${query}`}>Export filtered CSV</Link><div className="card my-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{columns.map(c=><th key={c} className="p-3">{c}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}>{r.values.map((v,i)=><td key={i} className="p-3">{i===0?<Link className="underline" href={r.href}>{v}</Link>:v}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="p-5">No matching records. Queries succeeded.</p>}</div>
 {category==='executive'&&<><p>Current global summaries below are independently scoped to all records; the organization/search filters above apply only to the relationship section.</p><BoardSummaries/><FinancialSummary/><nav className="flex flex-wrap gap-5">{['financial','sponsor','scholarship','membership','mentorship'].map(c=><Link key={c} href={`/reports/${c}`}>{c} report</Link>)}</nav></>}
 </>;
}
