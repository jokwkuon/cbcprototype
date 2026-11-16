import {cents} from './report-validation.ts';
export function monthlyCash(receipts:{received_on:string;amount:string}[],year:number,throughMonth:number){
 if(!Number.isInteger(throughMonth)||throughMonth<1||throughMonth>12)throw new Error('Invalid chart period.');
 const months=Array.from({length:throughMonth},()=>0n);
 for(const r of receipts){if(Number(r.received_on.slice(0,4))!==year)continue;const month=Number(r.received_on.slice(5,7));if(month>=1&&month<=throughMonth)months[month-1]+=cents(r.amount);}
 return months;
}
export function exactCents(value:bigint){const sign=value<0n?'-':'',n=value<0n?-value:value;return `${sign}${n/100n}.${String(n%100n).padStart(2,'0')}`;}
