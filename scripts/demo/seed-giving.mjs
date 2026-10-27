import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {local} from './prepare.mjs';
import {login,check,privateWrite} from './client.mjs';
export async function seedGiving(){
 const c=await login('finance'),base=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8')),year=Number(base.calendarDate.slice(0,4));
 const programId='63000000-0000-4000-8000-000000000001',eventId='63000000-0000-4000-8000-000000000002';
 check(!(await c.from('funding_initiatives').upsert([{id:programId,kind:'Program',name:'Synthetic Scholarship Program'},{id:eventId,kind:'Event',name:'Synthetic Community Reception'}])).error,'Giving initiative seed failed.');
 const ids=[];
 for(const [i,type,amount,status] of [[1,'Cash','2000','Committed'],[2,'Cash','1000','Invoiced'],[3,'In-Kind','500','Committed'],[4,'Cash','400','Cancelled'],[5,'Cash','250','Prospect']]){
  const id=`64000000-0000-4000-8000-${String(i).padStart(12,'0')}`;ids.push(id);
  check(!(await c.from('contributions').upsert({id,organization_id:base.organizationId,contact_id:base.contactIds[0],contribution_date:`${year}-01-01`,amount,contribution_type:type,funding_status:status,sponsorship_level:'Synthetic Partner',program_id:programId,event_id:eventId,agreement_start:`${year}-01-01`,agreement_end:`${year}-12-31`,renewal_date:`${year+1}-01-01`,notes:'Synthetic demonstration only.'})).error,'Contribution seed failed.');
 }
 for(const [i,date,amount,isVoid] of [[1,`${year}-01-01`,'500',false],[2,base.calendarDate,'250',false],[3,`${year-1}-01-01`,'200',false],[4,base.calendarDate,'99',true]]) check(!(await c.from('cash_receipts').upsert({id:`65000000-0000-4000-8000-${String(i).padStart(12,'0')}`,contribution_id:ids[0],received_on:date,amount,reference:'Synthetic receipt',is_void:isVoid,void_reason:isVoid?'Synthetic correction':null})).error,'Receipt seed failed.');
 check(!(await c.from('giving_document_links').upsert({id:'66000000-0000-4000-8000-000000000001',contribution_id:ids[0],label:'Synthetic agreement reference',url:'https://example.test/synthetic-agreement'})).error,'Document link seed failed.');
 privateWrite('giving-records.json',{contributionIds:ids,programId,eventId,year,annualCash:'750',lifetimeCash:'950',pledged:'3000',outstanding:'2050',inKind:'500'});
}
