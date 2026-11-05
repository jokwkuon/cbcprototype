// Read-only hosted smoke. Separate from local helpers; no credentials or rows printed.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),config=JSON.parse(readFileSync(resolve(root,'.local/cbc-demo/hosted-public-config.json'),'utf8'));
if(config.url!=='https://sywfyjaqzziyqhgulvjp.supabase.co'||!config.publishableKey.startsWith('sb_publishable_'))throw Error('Explicit approved hosted target and public key required');
const results=[];
for(const resource of ['organizations','contact_directory','documents','profiles']) {
 const response=await fetch(`${config.url}/rest/v1/${resource}?select=id&limit=1`,{headers:{apikey:config.publishableKey}});
 if(![401,403].includes(response.status))throw Error(`Unexpected anonymous access status for ${resource}: ${response.status}`);
 results.push({resource,status:response.status,denied:true});
}
const rpc=await fetch(`${config.url}/rest/v1/rpc/current_role`,{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:'{}'});
if(![401,403].includes(rpc.status))throw Error(`Unexpected anonymous RPC status: ${rpc.status}`);
results.push({resource:'current_role RPC',status:rpc.status,denied:true});
const health=await fetch(`${config.url}/auth/v1/health`,{headers:{apikey:config.publishableKey}});
if(!health.ok)throw Error('Hosted Auth health check failed');
writeFileSync(resolve(root,'.local/cbc-demo/hosted-api-verification.json'),JSON.stringify({target:config.url,results,authHealth:health.status},null,2),{mode:0o600});
console.log(`PASS: ${results.length} hosted anonymous REST/RPC denials and Auth health; no data or account changes.`);
