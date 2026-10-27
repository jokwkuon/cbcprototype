import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync,readdirSync,writeFileSync,chmodSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { root,local,readStatus,requireLocalUrl } from "./prepare.mjs";
const require=createRequire(resolve(root,"apps/frontend/package.json"));
export const {createClient}=require("@supabase/supabase-js");
export function check(ok,label){if(!ok)throw new Error(label);}
export function privateWrite(name,data){const file=resolve(local,name);writeFileSync(file,JSON.stringify(data,null,2)+"\n",{mode:0o600});chmodSync(file,0o600);}
export function accounts(){return JSON.parse(readFileSync(resolve(local,"accounts.json"),"utf8"));}
export function client(key){const status=readStatus();return createClient(status.env.API_URL,key??status.env.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}
export async function login(role){const account=accounts().find(a=>a.role===role);check(account,`Missing ${role} demo account. Run seed first.`);const c=client();const {error}=await c.auth.signInWithPassword({email:account.email,password:account.password});check(!error,`${role} authentication failed.`);return c;}
function findPsql(directory){for(const entry of readdirSync(directory,{withFileTypes:true})){const path=resolve(directory,entry.name);if(entry.isFile()&&entry.name==="psql")return path;if(entry.isDirectory()){const found=findPsql(path);if(found)return found;}}}
export function psqlPath(){return process.env.CBC_PSQL_BIN??findPsql(resolve(local,"supabase-home/cache/stack/slim-services/postgres"));}
export function sql(query){
 const status=readStatus(),url=requireLocalUrl(status.env.DB_URL,54422);
 const executable=psqlPath();check(executable,"Local psql binary unavailable.");
 const result=spawnSync(executable,["-X","-q","-A","-t","-v","ON_ERROR_STOP=1"],{input:query,encoding:"utf8",env:{...process.env,PGHOST:url.hostname,PGPORT:url.port,PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:url.pathname.slice(1)}});
 if(result.status!==0){privateWrite("sql-error.json",{stderr:result.stderr});throw new Error("Local SQL failed; private diagnostics saved. No credentials printed.");}return result.stdout.trim();
}
export function uuid(value){check(/^[0-9a-f-]{36}$/.test(value),"Invalid generated identity.");return value;}
