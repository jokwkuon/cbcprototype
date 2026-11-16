import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
function sql(query:string){
 const r=spawnSync(process.execPath,[resolve(__dirname,'../../../../scripts/demo/test-sql.mjs')],{input:query,encoding:'utf8',env:{...process.env,CBC_DEMO_INSTANCE:'test'}});
 if(r.status!==0)throw new Error('Isolated browser fixture SQL failed; inspect private SQL diagnostics.');
}
const directory=resolve(__dirname,'../../../../.local/cbc-test');
const accounts=JSON.parse(readFileSync(resolve(directory,'accounts.json'),'utf8'));
async function signIn(page:Page) {
 const a=accounts.find((a:{role:string})=>a.role==='admin');
 await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(a.email);await page.getByLabel('Password',{exact:true}).fill(a.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard$/);
}
test('REQ-008: refresh rotation, parallel requests, reload, navigation and logout',async({page,context})=>{
 await signIn(page);
 const cookies=await context.cookies();
 const chunks=cookies.filter(c=>/auth-token(?:\.\d+)?$/.test(c.name)).sort((a,b)=>a.name.localeCompare(b.name));
 expect(chunks.length>0).toBeTruthy();
 const raw=chunks.map(c=>c.value).join('');
 const session=JSON.parse(Buffer.from(raw.replace(/^base64-/,''),'base64url').toString());
 const oldRefresh=session.refresh_token;
 session.expires_at=Math.floor(Date.now()/1000)-60;
 const encoded='base64-'+Buffer.from(JSON.stringify(session)).toString('base64url');
 // Preserve the chunk layout. This exercises expiry-driven renewal with a real
 // refresh token; it does not simulate server-side JWT signature expiration.
 let offset=0;
 for(const [i,chunk] of chunks.entries()) {
   const value=i===chunks.length-1?encoded.slice(offset):encoded.slice(offset,offset+chunk.value.length);
   offset+=value.length;await context.addCookies([{...chunk,value}]);
 }
 const response=await page.goto('/dashboard');expect(response?.ok()).toBeTruthy();
 expect(response?.headers()['cache-control']).toContain('no-store');
 const renewed=(await context.cookies()).filter(c=>/auth-token(?:\.\d+)?$/.test(c.name)).sort((a,b)=>a.name.localeCompare(b.name)).map(c=>c.value).join('');
 const token=JSON.parse(Buffer.from(renewed.replace(/^base64-/,''),'base64url').toString());
 expect(token.refresh_token!==oldRefresh).toBeTruthy();
 const results=await Promise.all(Array.from({length:8},()=>page.request.get('/api/search?q=Prairie')));
 expect(results.every(r=>r.ok())).toBeTruthy();
 await page.reload();await expect(page).toHaveURL(/dashboard$/);
 await page.getByRole('link',{name:'Organizations',exact:true}).first().click();await expect(page).toHaveURL(/organizations/);
 await page.getByLabel('Account menu',{exact:true}).click();await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL(/login$/);
 await page.goto('/dashboard');await expect(page).toHaveURL(/login$/);
});
test('REQ-001/002/005: complete keyset history with ties, null due dates and isolated cleanup',async({page})=>{
 const org=randomUUID(),contact=randomUUID();
 try {
   sql(`insert into public.organizations(id,name) values('${org}','Foxglove Harbour Partners');
   insert into public.contacts(id,organization_id,first_name,last_name) values('${contact}','${org}','Leila','Hartwell');
   insert into public.activities(id,organization_id,occurred_at,activity_type,purpose) select gen_random_uuid(),'${org}','2020-01-01T12:00:00Z','Call','Community partnership review' from generate_series(1,110);
   insert into public.activity_contacts(activity_id,contact_id) select id,'${contact}' from public.activities where organization_id='${org}';
   insert into public.tasks(activity_id,description,due_date) select id,'Prepare partnership notes',case when row_number() over(order by id)%2=0 then null else date '2020-01-02' end from public.activities where organization_id='${org}';`);
   await signIn(page);
   for(const kind of ['organization','contact'])for(const section of ['activities','open']) {
     const ids:string[]=[];let cursor=null;
     do {
       const query=new URLSearchParams({kind,id:kind==='organization'?org:contact,section});if(cursor)query.set('cursor',JSON.stringify(cursor));
       const response=await page.request.get(`/api/relationships/history?${query}`);expect(response.ok()).toBeTruthy();const result=await response.json();
       expect(result.rows.length).toBeLessThanOrEqual(25);ids.push(...result.rows.map((r:{id:string})=>r.id));cursor=result.next;
     }while(cursor);
     expect(ids.length).toBe(110);expect(new Set(ids).size).toBe(110);
   }
   await page.goto(`/organizations?selected=${org}`);
   await expect(page.locator('.relationship-timeline li')).toHaveCount(25);
   await page.getByRole('button',{name:'Load more interactions',exact:true}).click();await expect(page.locator('.relationship-timeline li')).toHaveCount(50);
   await page.goto(`/contacts/${contact}`);await expect(page.locator('.relationship-timeline li')).toHaveCount(25);
   const invalid=await page.request.get(`/api/relationships/history?kind=organization&id=${org}&section=activities&cursor=bad`);expect(invalid.status()).toBe(400);
 } finally {
   sql(`begin; delete from public.tasks where activity_id in(select id from public.activities where organization_id='${org}'); delete from public.activity_contacts where contact_id='${contact}'; delete from public.activities where organization_id='${org}'; delete from public.contacts where id='${contact}'; delete from public.organizations where id='${org}'; commit;`);
 }
});
