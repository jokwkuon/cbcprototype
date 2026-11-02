import {crmContext} from '../../../../lib/crm-context';
import {operationalReport,type ReportFilters} from '../../../../lib/operational-report';
import {financialReport,sponsorReport} from '../../../../lib/report-data';
import {csv} from '../../../../lib/csv';
export async function GET(request:Request,{params}:{params:Promise<{category:string}>}){
 try{
 const {client}=await crmContext(),{category}=await params,url=new URL(request.url),filters:Record<string,string|string[]>={};for(const key of new Set(url.searchParams.keys())){const values=url.searchParams.getAll(key);filters[key]=values.length===1?values[0]:values;}
 let content:string;
 if(category==='financial'){const r=await financialReport(client,filters);content=csv(['Receipt ID','Contribution ID','Received on','Amount CAD','Reference'],r.periodReceipts.map(x=>[x.id,x.contribution_id,x.received_on,x.amount,x.reference]));}
 else if(category==='sponsor'){const r=await sponsorReport(client,filters.organization);content=csv(['Contribution ID','Contribution Date','Agreement Start','Agreement End','Renewal'],r.records.map(x=>[x.id,x.contribution_date,x.agreement_start,x.agreement_end,x.renewal_date]));}
 else{const r=await operationalReport(client,category,filters as ReportFilters);content=csv(['Record ID',...r.columns],r.rows.map(x=>[x.id,...x.values]));}
 return new Response(content,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="cbc-${category}.csv"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Export unavailable. Check authentication, permissions and filters; retry.',{status:400,headers:{'Cache-Control':'no-store'}});}
}
