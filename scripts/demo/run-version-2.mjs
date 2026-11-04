// REQ-008/013: compare the frozen Version 2 frontend without switching or editing branches.
import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,existsSync,chmodSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,local,readStatus} from './prepare.mjs';
const baseline='2803dba',snapshot=resolve(local,'version-3/version-2-source'),frontend=resolve(snapshot,'apps/frontend');
mkdirSync(snapshot,{recursive:true,mode:0o700});chmodSync(snapshot,0o700);
if(!existsSync(resolve(frontend,'package.json'))){
 const archive=spawnSync('git',['archive',baseline,'apps/frontend'],{cwd:root,maxBuffer:32*1024*1024});if(archive.status!==0)throw new Error('Version 2 baseline archive unavailable.');
 const unpack=spawnSync('tar',['-x','-C',snapshot],{input:archive.stdout});if(unpack.status!==0)throw new Error('Unable to prepare private Version 2 frontend.');
}
if(!existsSync(resolve(frontend,'node_modules'))){const copy=spawnSync('cp',['-a','--reflink=auto',resolve(root,'apps/frontend/node_modules'),resolve(frontend,'node_modules')]);if(copy.status!==0)throw new Error('Unable to prepare existing dependencies for Version 2.');}
const {env}=readStatus(),runtime={...process.env,NODE_ENV:'production',NEXT_PUBLIC_SUPABASE_URL:env.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:env.ANON_KEY};
const build=spawnSync('npm',['run','build'],{cwd:frontend,env:runtime,stdio:'inherit'});if(build.status!==0)process.exit(build.status||1);
console.log('Frozen Version 2 comparison: http://localhost:3141/login. Same local synthetic database; no branch switch or hosted change.');
const app=spawn('npm',['run','start','--','--hostname','127.0.0.1','--port','3141'],{cwd:frontend,env:runtime,stdio:'inherit'});app.on('exit',code=>process.exit(code||0));
