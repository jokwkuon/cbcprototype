import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync,chmodSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const local=resolve(__dirname,'../../../../.local/cbc-demo');
const accounts=JSON.parse(readFileSync(resolve(local,'accounts.json'),'utf8'));
test('REQ-001/002/005/008 operational search, out-of-range paging and desktop/mobile evidence',async({page})=>{
 const account=accounts.find((a:{role:string})=>a.role==='admin');
 await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard$/);
 await page.goto('/organizations?q=Prairie%20Lantern&page=999999');await expect(page.locator('a[data-record]')).not.toHaveCount(0);await expect(page.getByRole('button',{name:'Next page',exact:true})).toBeDisabled();
 const search=await page.request.get('/api/search?q=Amara%20Okafor');expect(search.ok()).toBeTruthy();const result=await search.json();expect(result.results.some((r:{name:string})=>r.name==='Amara Okafor')).toBeTruthy();
 const output=resolve(local,'operational-upgrade');mkdirSync(output,{recursive:true,mode:0o700});chmodSync(output,0o700);
 const captures=[];const errors:string[]=[];page.on('pageerror',()=>errors.push('pageerror'));page.on('console',message=>{if(message.type()==='error')errors.push('console error');});
 for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]) {
  await page.setViewportSize(viewport);
  for(const [name,path] of [['dashboard','/dashboard?work=team'],['organizations','/organizations?q=Prairie%20Lantern'],['contacts','/contacts?q=Amara']]) {
   await page.goto(path);await page.locator('main').waitFor();await page.locator('.relationship-loading').waitFor({state:'hidden'});
   const file=`${name}-${viewport.name}.png`,overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   await page.screenshot({path:resolve(output,file),fullPage:false});chmodSync(resolve(output,file),0o600);
   captures.push({file,path,viewport:viewport.name,overflow});expect(overflow).toBe(false);
  }
 }
 writeFileSync(resolve(output,'manifest.json'),JSON.stringify({synthetic:true,captures,errors},null,2),{mode:0o600});expect(errors).toEqual([]);
});
