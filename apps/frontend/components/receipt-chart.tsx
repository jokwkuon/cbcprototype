import {monthlyCash,exactCents} from '../lib/chart-data';
import {money} from '../lib/giving-validation';
export function ReceiptChart({receipts,year,periodEnd}:{receipts:{received_on:string;amount:string}[];year:number;periodEnd:string}){
 const months=monthlyCash(receipts,year,Number(periodEnd.slice(5,7))),max=months.reduce((a,b)=>a>b?a:b,0n),labels=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 return <div className="cash-chart" role="img" aria-label={`Monthly non-void cash received in ${year}. Records through ${periodEnd}. A detailed receipt ledger is available in the financial report.`}><div className="cash-columns">{months.map((amount,i)=>{const label=labels[i],height=max&&amount?Math.max(1,Number(amount*10000n/max)/100):0;return <div className="cash-column" key={label}><span className="cash-bar" style={{height:`${height}%`}} title={`${label} · ${money(exactCents(amount))}`} aria-hidden="true"/><span className="cash-label">{label}</span></div>;})}</div></div>;
}
