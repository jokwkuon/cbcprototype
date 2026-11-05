import { readFileSync,readdirSync,mkdirSync,writeFileSync,existsSync } from "node:fs";
import { resolve,dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
export const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const instance=process.env.CBC_DEMO_INSTANCE||'legacy';
if(!['legacy','presentation','test'].includes(instance))throw new Error('Unknown local demo instance');
export const apiPort=instance==='presentation'?55421:instance==='test'?56421:54421;
export const dbPort=apiPort+1;
export const local=resolve(root,instance==='legacy'?'.local/cbc-demo':`.local/cbc-${instance}`);
export const workdir=instance==='legacy'?resolve(root,'environments/demo'):resolve(local,'environment');
export const supabaseHome=resolve(root,'.local/cbc-demo/supabase-home');
export const cli=resolve(root,"apps/frontend/node_modules/supabase/dist/supabase.js");
export function prepare(){
 mkdirSync(local,{recursive:true,mode:0o700});
 if(instance!=='legacy'){
  mkdirSync(resolve(workdir,'supabase'),{recursive:true,mode:0o700});
  const config=readFileSync(resolve(root,'environments/demo/supabase/config.toml'),'utf8').replace('cbc-integration-demo',`cbc-${instance}`).replaceAll('54421',String(apiPort)).replaceAll('54422',String(dbPort)).replaceAll('54420',String(apiPort-1));
  writeFileSync(resolve(workdir,'supabase/config.toml'),config,{mode:0o600});
 }
 if(existsSync(resolve(workdir,"supabase/.temp/project-ref")))throw new Error("Demo workspace must not be linked to a hosted project.");
 const source=resolve(root,"database/migrations"),target=resolve(workdir,"supabase/migrations");
 mkdirSync(target,{recursive:true});
 const names=readdirSync(source).filter(n=>/^\d{12}(?:\d{2})?_.+\.sql$/.test(n)).sort();
 if(names.length<4)throw new Error("Missing canonical migrations.");
 for(const name of readdirSync(target))if(!names.includes(name))throw new Error("Unexpected generated migration; review instead of deleting it automatically.");
 const manifest=names.map(name=>{const content=readFileSync(resolve(source,name));writeFileSync(resolve(target,name),content);return {name,sha256:createHash("sha256").update(content).digest("hex")};});
 writeFileSync(resolve(local,"migration-manifest.json"),JSON.stringify(manifest,null,2)+"\n",{mode:0o600});
 return manifest;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){prepare();console.log("Prepared canonical migration copies. No drafts, test auth bootstrap, credentials or hosted changes included.");}
export function requireLocalUrl(value,port){const url=new URL(value);if(!["127.0.0.1","localhost"].includes(url.hostname)||Number(url.port)!==(port===54421?apiPort:port===54422?dbPort:port))throw new Error("Refusing a non-demo endpoint.");return url;}
export function readStatus(){const status=JSON.parse(readFileSync(resolve(local,"status.json"),"utf8"));if(!status.env)throw new Error("Local stack status missing env map.");requireLocalUrl(status.env.API_URL,54421);return status;}
export function hasStatus(){return existsSync(resolve(local,"status.json"));}
