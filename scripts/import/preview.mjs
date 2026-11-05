// REQ-007: fictional CSV dry-run only. No DB/network/apply capability.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const allowed=new Set(['name','organization_type','industry','location','website','notes']);
export function parseCsv(input){
 if(Buffer.byteLength(input)>5*1024*1024)throw new Error('CSV exceeds 5 MiB');
 const rows=[];let row=[],cell='',quoted=false,closed=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(quoted){if(c==='"'){if(input[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
  else if(c==='"'){if(cell||closed)throw new Error('Unexpected quote');quoted=true;}
  else if(c===','||c==='\n'||c==='\r'){
    row.push(cell);cell='';closed=false;
    if(c!==','){if(c==='\r'&&input[i+1]==='\n')i++;rows.push(row);row=[];if(rows.length>10001)throw new Error('CSV exceeds 10,000 data rows');}
  }else{if(closed)throw new Error('Characters after closing quote');cell+=c;}
 }
 if(quoted)throw new Error('Unclosed quoted field');
 if(cell||closed||row.length){row.push(cell);rows.push(row);}
 if(rows.length>10001)throw new Error('CSV exceeds 10,000 data rows');
 return rows;
}
export function preview(input){
 const rows=parseCsv(input.replace(/^\uFEFF/,''));const headers=rows.shift()??[];
 if(!headers.includes('name')||new Set(headers).size!==headers.length||headers.some(h=>!allowed.has(h)))throw new Error('Expected unique approved organization headers including name');
 const names=new Map(),errors=[],candidates=[],records=[];
 rows.forEach((cells,index)=>{
  const row=index+2;
  if(cells.length!==headers.length){errors.push({row,field:'row',code:'column_count'});return;}
  const record=Object.fromEntries(headers.map((h,i)=>[h,cells[i].trim()||null]));
  if(!record.name)errors.push({row,field:'name',code:'required'});
  if(cells.some(c=>c.length>10000))errors.push({row,field:'row',code:'field_too_long'});
  if(record.website){try{const url=new URL(record.website);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error();}catch{errors.push({row,field:'website',code:'invalid_url'});}}
  const key=record.name?.toLocaleLowerCase('en-CA');
  if(key){if(names.has(key))candidates.push({row,otherRow:names.get(key),reason:'same_name_review_only'});else names.set(key,row);}
  records.push({row,values:record});
 });
 return {syntheticOnly:true,dryRun:true,mappingVersion:1,sha256:createHash('sha256').update(input).digest('hex'),rowCount:rows.length,errors,candidates,records};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [flag,source,target]=process.argv.slice(2);
 if(flag!=='--fictional-only'||!source||!target)throw new Error('Usage: preview.mjs --fictional-only input.csv private-output.json; real-data import is not authorized');
 const result=preview(readFileSync(source,'utf8'));writeFileSync(target,JSON.stringify(result,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({dryRun:true,rows:result.rowCount,errorCount:result.errors.length,duplicateCandidates:result.candidates.length}));
 if(result.errors.length)process.exitCode=1;
}
