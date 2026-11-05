// REQ-001/002/005/008: screenshots contain only the isolated fictional demo.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdirSync,chmodSync,writeFileSync} from 'node:fs';
import {root,local,readStatus} from './prepare.mjs';
import {accounts,check} from './client.mjs';
const require=createRequire(resolve(root,'apps/frontend/package.json'));
const {chromium}=require('playwright');
readStatus();
const origin='http://127.0.0.1:3140',output=resolve(local,'operational-upgrade');
mkdirSync(output,{recursive:true,mode:0o700});chmodSync(output,0o700);
const browser=await chromium.launch({headless:true}),page=await browser.newPage();
const errors=[];page.on('pageerror',()=>errors.push('pageerror'));page.on('console',message=>{if(message.type()==='error')errors.push('console error');});
const account=accounts().find(a=>a.role==='admin');
await page.goto(`${origin}/login`);await page.getByLabel('Email',{exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard');
const captures=[];
for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]) {
 await page.setViewportSize(viewport);
 for(const [name,path] of [['dashboard','/dashboard?work=team'],['organizations','/organizations?q=Prairie%20Lantern'],['contacts','/contacts?q=Amara']]) {
  await page.goto(`${origin}${path}`);await page.locator('main').waitFor();await page.locator('.relationship-loading').waitFor({state:'hidden'});
  const file=`${name}-${viewport.name}.png`,overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.screenshot({path:resolve(output,file),fullPage:false});chmodSync(resolve(output,file),0o600);
  captures.push({file,path,viewport:viewport.name,overflow});
 }
}
await browser.close();
writeFileSync(resolve(output,'manifest.json'),JSON.stringify({synthetic:true,captures,errors},null,2),{mode:0o600});
console.log(`Captured ${captures.length} private synthetic screenshots; ${errors.length} runtime/console errors; ${captures.filter(c=>c.overflow).length} overflow screens.`);
check(!errors.length&&!captures.some(c=>c.overflow),'Visual capture verification failed');
