import { spawnSync } from "node:child_process";
import { writeFileSync,chmodSync } from "node:fs";
import { resolve } from "node:path";
import { prepare,cli,local,workdir,readStatus } from "./prepare.mjs";
prepare();
const command=process.argv[2]??"status";
if(!["start","status","migrate","stop","audit"].includes(command))throw new Error("Use start, status, migrate, audit or stop. Hosted commands are intentionally unavailable.");
const args=command==="start"?["stack","start","--runtime","native","--eager"]:command==="migrate"?["migration","up","--local"]:command==="audit"?["db","advisors","--local","--type","security","--level","warn","--fail-on","error"]:["stack",command];
const result=spawnSync(process.execPath,[cli,...args,"--workdir",workdir,"--output-format","json"],{env:{...process.env,SUPABASE_HOME:resolve(local,"supabase-home"),SUPABASE_EXPERIMENTAL_STACK:"1"},encoding:"utf8",maxBuffer:16*1024*1024});
const log=resolve(local,`${command}.log`);writeFileSync(log,(result.stdout??"")+"\n"+(result.stderr??""),{mode:0o600});chmodSync(log,0o600);
if(result.status!==0){console.error(`Local ${command} failed. Private diagnostics saved under .local/cbc-demo/${command}.log; no credentials printed.`);process.exit(result.status??1);}
if(command==="start"||command==="status"){
 try{const status=JSON.parse(result.stdout);if(!status.env)throw new Error();writeFileSync(resolve(local,"status.json"),JSON.stringify(status),{mode:0o600});chmodSync(resolve(local,"status.json"),0o600);readStatus();}
 catch{console.error("Unable to parse local stack status. Review private diagnostics; no credentials printed.");process.exit(1);}
 console.log("Local Supabase ready at http://127.0.0.1:54421. Generated keys saved privately; no hosted project selected.");
}else console.log(`Local ${command} completed. No credentials printed.`);
