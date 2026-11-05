// Local-only production build and screenshot review runner. Stops its own server afterward.
import {spawn,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,local,readStatus} from './prepare.mjs';
import {check} from './client.mjs';
check(process.env.CBC_DEMO_INSTANCE==='presentation','Visual review requires the isolated presentation instance.');
const {env}=readStatus(),cwd=resolve(root,'apps/frontend');
const runEnv={...process.env,NODE_ENV:'production',NEXT_PUBLIC_SUPABASE_URL:env.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:env.ANON_KEY,CBC_CAPTURE_PORT:'3143'};
const build=spawnSync('npm',['run','build'],{cwd,env:runEnv,stdio:'inherit'});check(build.status===0,'Presentation build failed');
const server=spawn('npm',['run','start','--','--hostname','127.0.0.1','--port','3143'],{cwd,env:runEnv,stdio:'ignore',detached:true});
try{
 let ready=false;
 for(let i=0;i<100;i++){check(server.exitCode===null,'Review server could not start');try{ready=(await fetch('http://127.0.0.1:3143/login')).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100));}
 check(ready,'Review server did not become ready');
 const capture=spawnSync(process.execPath,[resolve(root,'scripts/demo/capture-visual-quality.mjs'),'after'],{cwd:root,env:runEnv,stdio:'inherit'});check(capture.status===0,'Visual capture failed');
 const gallery=spawnSync(process.execPath,[resolve(root,'scripts/demo/comparison-visual-quality.mjs')],{cwd:root,env:runEnv,stdio:'inherit'});check(gallery.status===0,'Comparison gallery failed');
 console.log(`Private review artifacts: ${resolve(local,'visual-quality/comparison.html')}`);
}finally{try{process.kill(-server.pid,'SIGTERM');}catch{}}
