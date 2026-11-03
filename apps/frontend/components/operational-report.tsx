import { money } from "../lib/giving-validation";
import Link from 'next/link';
import {operationalReport,type ReportFilters} from '../lib/operational-report';
import type {crmContext} from '../lib/crm-context';
import {DataTable} from './data-table';
import {RecordBreakdown} from './report-breakdown';
import {FinancialSummary} from './giving';
import {BoardSummaries} from './board-summaries';
export async function OperationalReport({client,category,filters}:{client:Awaited<ReturnType<typeof crmContext>>['client'];category:string;filters:ReportFilters}){
 let report;try{report=await operationalReport(client,category,filters);}catch(e){return <section role="alert" className="card p-5"><h2>Report unavailable</h2><p>{e instanceof Error?e.message:'Unable to verify report.'} No totals are implied.</p><Link href={`/reports/${category}`}>Reset filters and retry</Link></section>;}
 const {rows,columns,metrics,pending,organizations,organization,programs,cohorts,program,cohort,status,q}=report;
 const query=new URLSearchParams();for(const [k,v]of Object.entries({organization,program,cohort,status,q}))if(v)query.set(k,v);
 return <><form className="my-5 flex flex-wrap items-end gap-3"><label>Search<input name="q" defaultValue={q}/></label><label>Organization<select name="organization" defaultValue={organization}><option value="">All organizations</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>{['scholarship','mentorship'].includes(category)&&<><label>Program<select name="program" defaultValue={program}><option value="">All programs</option>{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Cohort<select name="cohort" defaultValue={cohort}><option value="">All cohorts</option>{cohorts.map(c=><option key={c.id} value={c.id}>{programs.find(p=>p.id===c.program_id)?.name} / {c.label}</option>)}</select></label></>}{['membership','mentorship'].includes(category)&&<label>Status (exact)<input name="status" defaultValue={status}/></label>}<button>Apply report filters</button></form>
 <section className="my-5"><h2 className="font-bold mb-3">Verified record summary</h2><dl className="report-summary-grid">{metrics.map(([label,value])=><div className="summary-value" key={label}><dt>{label}</dt><dd style={{fontSize:typeof value==='string'&&value.length>18?14:undefined}}>{typeof value==='string'&&/CAD/.test(label)&&/^\d+(\.\d{1,2})?$/.test(value)?money(value):value}</dd></div>)}</dl><p className="callout">{pending}</p></section>
 <RecordBreakdown category={category} columns={columns} rows={rows}/>
 <div className="section-title"><h2>Underlying records</h2><Link className="button button-secondary" href={`/reports/${category}/export?${query}`}>Export filtered CSV</Link></div><DataTable label="Report records" searchable={false} filterable={false} columns={columns.map((c,i)=>({key:String(i),label:c}))} rows={rows.map(r=>({id:r.id,href:r.href,cells:Object.fromEntries(r.values.map((v,i)=>[String(i),{text:/CAD/.test(columns[i])&&/^\d+(\.\d{1,2})?$/.test(v)?money(v):v,sortValue:v,href:i===0?r.href:undefined,kind:i===0?'identity':columns[i]==='Status'?'status':undefined}]))}))} emptyMessage="No matching records. Queries succeeded."/>

 {category==='executive'&&<><p>Current global summaries below are independently scoped to all records; the organization/search filters above apply only to the relationship section.</p><BoardSummaries/><FinancialSummary/><nav className="flex flex-wrap gap-5">{['financial','sponsor','scholarship','membership','mentorship'].map(c=><Link key={c} href={`/reports/${c}`}>{c} report</Link>)}</nav></>}
 </>;
}
