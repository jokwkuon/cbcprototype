// Only the isolated test environment may service browser fixture SQL.
import {sql,accounts} from './client.mjs';
if(process.env.CBC_DEMO_INSTANCE!=='test')throw new Error('Browser SQL requires isolated test instance');
let query='';for await(const part of process.stdin)query+=part;
const admin=accounts().find(a=>a.role==='admin');
if(!admin||!/^[0-9a-f-]{36}$/.test(admin.id))throw new Error('Isolated Admin fixture missing');
sql(`select set_config('request.jwt.claim.sub','${admin.id}',false);`+query); // Deliberately print neither query nor rows.
