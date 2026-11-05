import {diagnostic} from '../../../../lib/diagnostics';
import {crmContext} from '../../../../lib/crm-context';
import {operationalReport,type ReportFilters} from '../../../../lib/operational-report';
import {financialReport,sponsorReport} from '../../../../lib/report-data';
import {csvCell} from '../../../../lib/csv';
import {MAX_REPORT_ROWS} from '../../../../lib/read-all';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request,{params}:{params:Promise<{category:string}>}){
 const started=performance.now();
 try{
 const {client}=await crmContext(),{category}=await params,url=new URL(request.url),filters:Record<string,string|string[]>={};for(const key of new Set(url.searchParams.keys())){const values=url.searchParams.getAll(key);filters[key]=values.length===1?values[0]:values;}
 let columns:string[],rows:unknown[][];
 if(category==='financial'){const r=await financialReport(client,filters);columns=['Receipt ID','Contribution ID','Received on','Amount CAD','Reference'];rows=r.periodReceipts.map(x=>[x.id,x.contribution_id,x.received_on,x.amount,x.reference]);}
 else if(category==='sponsor'){const r=await sponsorReport(client,filters.organization);columns=['Contribution ID','Contribution Date','Agreement Start','Agreement End','Renewal'];rows=r.records.map(x=>[x.id,x.contribution_date,x.agreement_start,x.agreement_end,x.renewal_date]);}
 else{const r=await operationalReport(client,category,filters as ReportFilters);columns=['Record ID',...r.columns];rows=r.rows.map(x=>[x.id,...x.values]);}
 if(rows.length>MAX_REPORT_ROWS)throw new Error('Export size limit');
 // All authorization, completeness and financial reconciliation finishes before
 // sending headers. Stream encoded rows with backpressure, not one giant CSV.
 const encoder=new TextEncoder();let index=-1;
 const body=new ReadableStream<Uint8Array>({pull(controller){
   const row=index<0?columns:rows[index];
   if(!row){controller.close();return;}
   controller.enqueue(encoder.encode(row.map(csvCell).join(',')+'\r\n'));index++;
 }});
 return new Response(body,{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="cbc-${category}.csv"`,'X-Export-Record-Count':String(rows.length),'X-Export-Generated-At':new Date().toISOString()}});
 }catch{const correlationId=diagnostic('export_failed',started);return new Response(`Export unavailable. Check access and filters, then retry. Exports support up to ${MAX_REPORT_ROWS.toLocaleString('en-CA')} records per source dataset; narrow large reports. Reference: ${correlationId}.`,{status:400,headers});}
}
