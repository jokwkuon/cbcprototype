import Link from 'next/link';
import {financialReport} from '../lib/report-data';
import type {crmContext} from '../lib/crm-context';
import {ReceiptChart} from './receipt-chart';
import {money} from '../lib/giving-validation';
import {Icon} from './icons';
export function RelationshipBreakdown({counts}:{counts:Record<string,number>}){
 const total=Object.values(counts).reduce((a,b)=>a+b,0),colors=['#9978d0','#c0a7e3','#516485','#cfdae8','#b2b9c7','#e2dded'];
 return <section className="card chart-card"><div className="section-title"><h2>Organizations by status</h2><Link href="/organizations">View relationships <Icon name="arrow" size={12}/></Link></div><p className="chart-caption">Recorded relationship stages · {total} organizations</p><div className="status-bar" aria-hidden="true">{Object.entries(counts).map(([s,n],i)=><div key={s} style={{width:`${total?n/total*100:0}%`,background:colors[i%colors.length]}}/>)}</div><div className="status-list">{Object.entries(counts).map(([s,n],i)=><Link key={s} href={`/organizations?status=${encodeURIComponent(s)}`}><i style={{background:colors[i%colors.length]}}/>{s}<b>{n}</b></Link>)}</div>{!total&&<p>No organizations yet.</p>}<p className="chart-caption mt-6">Relationship statuses are recorded labels, not a financial pipeline forecast.</p></section>;
}
export async function GivingTrend({client}:{client:Awaited<ReturnType<typeof crmContext>>['client']}){
 let report;try{report=await financialReport(client,{});}catch{return <section className="card chart-card" role="status"><h2>Giving trend unavailable</h2><p>Receipt records could not be reconciled. No trend or zero balance is inferred.</p><Link className="button mt-4" href="/reports/financial">Open financial report</Link></section>;}
 const {summary:s,periodReceipts}=report;
 return <section className="card chart-card"><div className="section-title"><h2>Cash received</h2><Link href={`/reports/financial?year=${s.year}`}>View report <Icon name="arrow" size={12}/></Link></div><div className="flex items-end gap-3"><strong className="text-3xl font-semibold tracking-tight">{money(s.annual_cash)}</strong><span className="text-xs text-slate-500 pb-1">{s.year} year to date</span></div><div className="chart-legend"><span><i/>Non-void cash receipts</span><span>Prior comparable: {money(s.prior_cash)}</span></div><ReceiptChart receipts={periodReceipts} year={s.year} periodEnd={s.period_end}/><div className="flex flex-wrap justify-between gap-3 border-t pt-3 text-xs text-slate-500"><span>Current cash pledged <b className="text-slate-700 ml-2">{money(s.pledged)}</b></span><span>Outstanding <b className="text-slate-700 ml-2">{money(s.outstanding)}</b></span></div><p className="chart-caption mt-3">Reconciled receipt dates. Commitments are current balances; no historical commitment trend is inferred.</p></section>;
}
