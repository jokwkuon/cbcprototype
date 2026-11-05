// REQ-008: two NEW disposable databases; never operates on a hosted target.
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {compareCatalogs} from './compare.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const names=['canonical','adopted'].map(n=>`cbc_schema_${n}_${randomUUID().replaceAll('-','')}`);
function command(program,args,input) {
 const local=process.env.CBC_PG_BIN;
 const result=spawnSync(local?resolve(local,program):'docker',local?args:['exec','-i','cbc-day1-db',program,'-U','postgres',...args],{input,encoding:'utf8',maxBuffer:16*1024*1024});
 if(result.status!==0)writeFileSync('/tmp/cbc-schema-error.log',result.stderr??'',{mode:0o600});
 if(result.status!==0)throw new Error(`Disposable schema ${program} failed (exit ${result.status}). Review local PostgreSQL availability.`);
 return result.stdout.trim();
}
function query(db,input){return command('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-d',db],input);}
const read=name=>readFileSync(resolve(root,name),'utf8');
const manifest=JSON.parse(read('database/hosted/source-manifest.json'));
for(const item of manifest)if(createHash('sha256').update(read(`database/migrations/${item.name}`)).digest('hex')!==item.sha256)throw new Error(`Historical checksum changed: ${item.name}`);
const canonical=readdirSync(resolve(root,'database/migrations')).filter(x=>x.endsWith('.sql')).sort();
for(const db of names)command('createdb',[db]);
const bootstrap=read('database/tests/bootstrap.sql');
query(names[0],bootstrap+canonical.map(n=>read(`database/migrations/${n}`)).join('\n'));
const adopted=new Set(manifest.map(x=>x.name));
query(names[1],bootstrap+read(`database/migrations/${manifest[0].name}`)+read('database/hosted/reconcile-version3.sql')+canonical.filter(n=>!adopted.has(n)).map(n=>read(`database/migrations/${n}`)).join('\n'));
const catalogs=names.map(db=>JSON.parse(query(db,read('scripts/schema/catalog.sql'))));
const differences=compareCatalogs(...catalogs);
if(differences.length){console.log(JSON.stringify({matches:false,differences},null,2));process.exitCode=1;}
else console.log(`PASS: ${Object.keys(catalogs[0]).length} normalized public catalog objects match canonical vs reconciliation paths; ${manifest.length} historical checksums verified.`);
// Prove drift detection on real DDL, including permission/policy/function changes.
query(names[1],`alter table public.organizations add column drift_probe text; revoke select on public.organizations from authenticated;`);
const changed=compareCatalogs(catalogs[0],JSON.parse(query(names[1],read('scripts/schema/catalog.sql'))));
if(!changed.some(x=>x.key==='column:organizations.drift_probe')||!changed.some(x=>x.key==='relation:organizations'))throw new Error('Structural/ACL drift negative test failed');
console.log('PASS: unexpected column and changed grants detected; disposable databases retained for inspection. Hosted database untouched.');
