import {monthlyCash,exactCents} from '../lib/chart-data';
import {money} from '../lib/giving-validation';
export function ReceiptChart({receipts,year,periodEnd}:{receipts:{received_on:string;amount:string}[];year:number;periodEnd:string}){
 const months=monthlyCash(receipts,year,Number(periodEnd.slice(5,7))),max=months.reduce((a,b)=>a>b?a:b,0n);
 return <svg className="cash-chart" viewBox="0 0 650 190" role="img" aria-label={`Monthly non-void cash received in ${year}. Records through ${periodEnd}.`}>{[20,65,110,155].map(y=><line className="grid-line" key={y} x1="0" y1={y} x2="650" y2={y}/>)}{months.map((amount,i)=>{const label=new Intl.DateTimeFormat('en',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2024,i,1))),height=max?Number(amount*13000n/max)/100:0,w=600/months.length,x=22+i*w;return <a key={label} href={`/reports/financial?year=${year}#received-payments`} aria-label={`${label}: ${money(exactCents(amount))}`}><rect x={x} y={155-height} width={Math.max(8,w-20)} height={height} rx="3"><title>{label} · {money(exactCents(amount))}</title></rect><text x={x+(w-20)/2} y="180" textAnchor="middle">{label}</text></a>;})}</svg>;
}
