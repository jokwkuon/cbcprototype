import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync,chmodSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const local=resolve(__dirname,'../../../../.local/cbc-test');
const accounts=JSON.parse(readFileSync(resolve(local,'accounts.json'),'utf8'));
const records=JSON.parse(readFileSync(resolve(local,'records.json'),'utf8'));
test('REQ-001/002/004/005/008/013 reliability desktop/mobile visual and endpoint evidence',async({page})=>{
 const account=accounts.find((a:{role:string})=>a.role==='admin');
 await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard$/);
 const errors:string[]=[];page.on('pageerror',()=>errors.push('pageerror'));page.on('console',m=>{if(m.type()==='error')errors.push('console error');});
 const output=resolve(local,'reliability-screenshots');mkdirSync(output,{recursive:true,mode:0o700});
 const routes=[['dashboard','/dashboard'],['organization',`/organizations?selected=${records.organizationId}`],['contact',`/contacts/${records.contactIds[0]}`],['activities','/activities'],['giving','/giving'],['programs','/programs'],['membership','/membership'],['mentorship','/mentorship'],['documents','/documents'],['settings','/settings'],['organization-form','/organizations/new'],...['executive','sponsor','scholarship','mentorship','membership','financial'].map(c=>[`report-${c}`,`/reports/${c}${c==='sponsor'?`?organization=${records.organizationId}`:''}`])];
 const captures=[];
 for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
  await page.setViewportSize(viewport);
  for(const [name,path] of routes){
   await page.goto(path);await page.locator('main').waitFor();await page.locator('.relationship-loading').waitFor({state:'hidden'});
   const file=`${name}-${viewport.name}.png`;await page.screenshot({path:resolve(output,file)});chmodSync(resolve(output,file),0o600);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);captures.push({file,path,viewport:viewport.name,overflow});expect(overflow).toBe(false);
  }
 }
 const health=await page.request.get('/api/health');expect(health.ok()).toBeTruthy();expect(await health.json()).toEqual({status:'ok'});
 const download=await page.request.get('/reports/financial/export');expect(download.ok()).toBeTruthy();expect(download.headers()['x-export-record-count']).toMatch(/^\d+$/);expect(download.headers()['cache-control']).toContain('no-store');
 writeFileSync(resolve(output,'manifest.json'),JSON.stringify({synthetic:true,captures,errors},null,2),{mode:0o600});expect(errors).toEqual([]);
});
