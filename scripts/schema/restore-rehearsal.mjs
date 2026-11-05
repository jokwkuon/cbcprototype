// REQ-008: synthetic-only restore drill, always two NEW disposable databases.
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {compareCatalogs} from './compare.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const names=['source','restored'].map(n=>`cbc_restore_${n}_${randomUUID().replaceAll('-','')}`);
function run(program,args,input){
 const local=process.env.CBC_PG_BIN;
 const r=spawnSync(local?resolve(local,program):'docker',local?args:['exec','-i','cbc-day1-db',program,'-U','postgres',...args],{input,encoding:'utf8',maxBuffer:32*1024*1024});
 if(r.status!==0){writeFileSync('/tmp/cbc-restore-error.log',r.stderr??'',{mode:0o600});throw new Error(`Restore drill ${program} failed; private diagnostics /tmp/cbc-restore-error.log`);}return r.stdout;
}
const query=(db,input)=>run('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-d',db],input).trim();
const read=n=>readFileSync(resolve(root,n),'utf8');
for(const db of names)run('createdb',[db]);
query(names[0],read('database/tests/bootstrap.sql')+readdirSync(resolve(root,'database/migrations')).filter(n=>n.endsWith('.sql')).sort().map(n=>read(`database/migrations/${n}`)).join('\n')+read('database/tests/fixtures.sql'));
const dump=run('pg_dump',['-d',names[0]]);
const directory=mkdtempSync(resolve(tmpdir(),'cbc-synthetic-restore-'));writeFileSync(resolve(directory,'snapshot.sql'),dump,{mode:0o600});
query(names[1],dump);
const catalogs=names.map(db=>JSON.parse(query(db,read('scripts/schema/catalog.sql'))));
const drift=compareCatalogs(...catalogs);if(drift.length){writeFileSync('/tmp/cbc-restore-drift.json',JSON.stringify({drift,values:drift.map(d=>({key:d.key,before:catalogs[0][d.key],after:catalogs[1][d.key]}))}),{mode:0o600});throw new Error('Restored public catalog mismatch');}
// Compare ordered complete rows, not only counts. Includes synthetic auth contract.
const tables=JSON.parse(query(names[0],"select json_agg(schemaname||'.'||tablename order by schemaname,tablename) from pg_tables where schemaname in ('public','auth');"));
let rows=0;
for(const table of tables){
 if(!/^(public|auth)\.[a-z_]+$/.test(table))throw new Error('Unexpected fixture table');
 const select=`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]') from ${table} t;`;
 const values=names.map(db=>query(db,select));if(values[0]!==values[1])throw new Error(`Restored rows differ: ${table}`);rows+=JSON.parse(values[0]).length;
}
console.log(`PASS: synthetic logical restore; ${tables.length} tables, ${rows} complete rows and ${Object.keys(catalogs[0]).length} public catalog objects reconciled. Snapshot retained privately in ${directory}.`);
console.log('Excludes real Supabase Auth/platform configuration, secrets, storage and hosting. No production recovery claim.');
