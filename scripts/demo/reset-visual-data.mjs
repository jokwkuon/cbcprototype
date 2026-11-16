// REQ-001/008. Reset only sealed local fixtures; unknown or edited rows abort atomically.
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {local,readStatus} from './prepare.mjs';
import {sql,check,privateWrite} from './client.mjs';
check(['presentation','test'].includes(process.env.CBC_DEMO_INSTANCE),'Select presentation or test explicitly. Legacy and hosted resets are unavailable.');
readStatus();
const file=resolve(local,'fixture-inventory.json'),mode=process.argv[2]||'--dry-run';
check(['--seal','--dry-run','--apply'].includes(mode),'Use --seal, --dry-run or --apply.');
const tables=JSON.parse(sql("select json_agg(tablename order by tablename) from pg_tables where schemaname='public' and tablename not in ('profiles','staff_directory');"));
check(tables.every(t=>/^[a-z_]+$/.test(t)),'Unexpected local table identifier');
const inventoryQuery="select json_build_object("+tables.map(t=>`'${t}',(select coalesce(json_agg(jsonb_build_object('key',coalesce(to_jsonb(r)->>'id',md5(to_jsonb(r)::text)),'fingerprint',md5(to_jsonb(r)::text)) order by to_jsonb(r)::text),'[]') from public.${t} r)`).join(',')+");";
const inventory=JSON.parse(sql(inventoryQuery));
if(mode==='--seal'){
 check(!existsSync(file),'Inventory already sealed. Reset from the existing seal; never adopt unknown rows.');
 privateWrite('fixture-inventory.json',{instance:process.env.CBC_DEMO_INSTANCE,inventory});
 console.log('Sealed exact local fixture IDs and row fingerprints. No data removed.');
}else{
 check(existsSync(file),'No sealed fixture inventory; refuse reset.');
 const expected=JSON.parse(readFileSync(file,'utf8'));
 check(expected.instance===process.env.CBC_DEMO_INSTANCE,'Inventory instance mismatch');
 const matches=JSON.stringify(expected.inventory)===JSON.stringify(inventory);
 privateWrite('reset-dry-run.json',{instance:expected.instance,proposedRemovals:inventory,approvedFixtureMatches:matches,action:matches?'Reset only these sealed fixture rows':'REFUSED: unknown, missing or edited rows; retain everything'});
 check(matches,'Reset refused: local rows differ from the sealed fixture. Exact private dry-run report saved; no rows removed.');
 if(mode==='--apply'){
  // Lock before rechecking, so no concurrent writer can slip between the check and truncation.
  const lock=`lock table ${tables.map(t=>`public.${t}`).join(',')} in access exclusive mode;`;
  const guard=`do $guard$ begin if (${inventoryQuery.trim().slice(0,-1).replace(/^select /,'')})::jsonb <> '${JSON.stringify(inventory).replaceAll("'","''")}'::jsonb then raise exception 'Fixture changed since dry run'; end if; end $guard$;`;
  sql(`begin; ${lock} ${guard} truncate table ${tables.map(t=>`public.${t}`).join(',')}; commit;`);
  // The next seed is a fresh fixture. Preserve the old seal as audit evidence, then allow resealing.
  privateWrite('previous-fixture-inventory.json',expected);
  const {unlinkSync}=await import('node:fs');unlinkSync(file);
  console.log('Reset the exact sealed local fixture. Auth users, profiles, unknown legacy data and hosted data were retained. Run canonical and visual seeds, then seal again.');
 }else console.log('Dry run ready: exact IDs/fingerprints saved privately. No rows removed.');
}
