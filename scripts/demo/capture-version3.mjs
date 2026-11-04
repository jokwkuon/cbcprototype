// REQ-001/002/005/008: private screenshots of synthetic local demo data only.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdirSync,chmodSync,readFileSync,writeFileSync} from 'node:fs';
import {root,local,readStatus} from './prepare.mjs';
import {accounts,check} from './client.mjs';
const require=createRequire(resolve(root,'apps/frontend/package.json'));
const {chromium}=require('playwright');
readStatus();
const port=process.env.CBC_CAPTURE_PORT||'3140';check(['3140','3141'].includes(port),'Capture refuses a non-demo port.');const origin=`http://127.0.0.1:${port}`;
const stage=process.argv[2];check(['before','after'].includes(stage),'Use before or after.');
const output=resolve(local,'version-3',stage);mkdirSync(output,{recursive:true,mode:0o700});chmodSync(output,0o700);
const records=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8'));
const routes=[['dashboard','/dashboard'],['organizations','/organizations'],['contacts','/contacts'],['activities','/activities'],['interests','/interests'],['programs','/programs'],['mentorship','/mentorship'],['membership','/membership'],['giving','/giving'],['documents','/documents'],['settings','/settings'],['reports','/reports'],['organization-detail',`/organizations/${records.organizationId}`],['contact-detail',`/contacts/${records.contactIds[0]}`],['organization-form','/organizations/new'],['membership-form','/membership/new'],['mentorship-form','/mentorship/new'],['activity-form','/activities/new'],...['organization','contact'].flatMap(kind=>{const id=kind==='organization'?records.organizationId:records.contactIds[0],base=kind==='organization'?'organizations':'contacts';return [[`${kind}-workspace`,stage==='before'?`/${base}/${id}`:`/${base}?selected=${id}`],[`${kind}-related`,stage==='before'?`/${base}/${id}#giving-history`:`/${base}?selected=${id}`],[`${kind}-quick-edit`,stage==='before'?`/${base}/${id}/edit`:`/${base}?selected=${id}`]];}),...['executive','sponsor','scholarship','mentorship','membership','financial'].map(c=>[`report-${c}`,`/reports/${c}${c==='sponsor'?`?organization=${records.organizationId}`:''}`])];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),a=accounts().find(a=>a.role==='admin');
const errors=[],consoleErrors=[];page.on('console',m=>{if(m.type()==='error'||m.text().toLowerCase().includes('hydration'))consoleErrors.push({path:page.url().split(origin)[1],type:m.type(),message:m.text()});});page.on('pageerror',e=>errors.push({path:page.url().split(origin)[1],message:e.message,stack:e.stack}));
await page.goto(`${origin}/login`);await page.getByLabel('Email',{exact:true}).fill(a.email);await page.getByLabel('Password',{exact:true}).fill(a.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard');
const evidence=[];
for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
 await page.setViewportSize(viewport);
 for(const [name,path]of routes){await page.goto(`${origin}${path}`);await page.locator('main').last().waitFor();await page.locator('.relationship-loading').waitFor({state:'hidden'});if(stage==='after'&&name.endsWith('-related'))await page.getByRole('tab',{name:'Related records',exact:true}).click();if(stage==='after'&&name.endsWith('-quick-edit'))await page.getByRole('button',{name:'Quick edit',exact:true}).click();await page.waitForTimeout(150);const filename=`${name}-${viewport.name}.png`;await page.screenshot({path:resolve(output,filename),fullPage:false});chmodSync(resolve(output,filename),0o600);evidence.push({name,path,viewport:viewport.name,file:filename,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});}
}
for(const v of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){const login=await browser.newPage({viewport:v});await login.goto(`${origin}/login`);await login.screenshot({path:resolve(output,`login-${v.name}.png`)});chmodSync(resolve(output,`login-${v.name}.png`),0o600);evidence.push({name:'login',path:'/login',viewport:v.name,file:`login-${v.name}.png`,overflow:await login.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await login.close();}
await browser.close();writeFileSync(resolve(output,'manifest.json'),JSON.stringify({stage,origin,evidence,errors,consoleErrors},null,2),{mode:0o600});console.log(`Captured ${evidence.length} private ${stage} screenshots. Runtime errors: ${errors.length}. Console errors: ${consoleErrors.length}. Overflow screens: ${evidence.filter(e=>e.overflow).length}.`);if(stage==='after'&&(errors.length||consoleErrors.length||evidence.some(e=>e.overflow)))process.exitCode=1;
