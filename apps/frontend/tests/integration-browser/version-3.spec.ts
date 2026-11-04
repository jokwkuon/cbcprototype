import {test,expect,type Page} from '@playwright/test';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

const local = resolve(__dirname,'../../../../.local/cbc-demo');
const status = JSON.parse(readFileSync(resolve(local,'status.json'),'utf8'));
const accounts = JSON.parse(readFileSync(resolve(local,'accounts.json'),'utf8')) as {email:string;password:string;role:string}[];
const seed = JSON.parse(readFileSync(resolve(local,'records.json'),'utf8'));
const marker = 'Community investment and education';
const queryReference = randomUUID().slice(0,8);
let admin:SupabaseClient, orgId:string, contactId:string;
async function login(page:Page,role='admin') {
  const account = accounts.find(a => a.role === role)!;
  await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard$/);
}
test.beforeAll(async() => {
  admin = createClient(status.env.API_URL,status.env.ANON_KEY,{auth:{persistSession:false}});
  const account = accounts.find(a => a.role === 'admin')!;
  const auth = await admin.auth.signInWithPassword(account);expect(auth.error).toBeNull();
  const names = ['Alder Grove Foundation','Birchwater Community Partners','Cedar Vale Ventures','Copper Finch Consulting','Elm Harbour Learning','Fircrest Education Partners','Juniper Lane Collective','Maplefield Advisory','North Willow Foundation','Oak Harbour Enterprises','Pinehaven Community Trust','Willowbend Arts Council'];
  const orgs = await admin.from('organizations').insert(names.map(name => ({id:`${queryReference}${randomUUID().slice(8)}`,name,industry:marker,notes:'Discuss the community partnership proposal',location:'Calgary',website:'https://example.test',estimated_opportunity:'3141.59'}))).select('id,name');
  expect(orgs.error).toBeNull();orgId = orgs.data!.find(r => r.name === names[0])!.id;
  const person = await admin.from('contacts').insert({first_name:'Nadia',last_name:'Lawson',organization_id:orgId,title:'Partnerships Director',email:'nadia.lawson@example.test',phone:'555-0148',interests:'Entrepreneurship and youth mentorship',notes:'Share the community partnership brief'}).select('id').single();
  expect(person.error).toBeNull();contactId = person.data!.id;
});

test('REQ-001/002 V3 list selection, search, grouping, pagination and browser history retain context',async({page}) => {
  await login(page);await page.goto(`/organizations?q=${encodeURIComponent(queryReference)}`);
  await expect(page.getByRole('searchbox',{name:'Search organizations',exact:true})).toHaveCount(1);
  const results = page.getByRole('list',{name:'Organizations',exact:true});await expect(results.locator('a[data-record]')).toHaveCount(10);
  await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(results.locator('a[data-record]')).toHaveCount(2);await expect(page).toHaveURL(/page=2/);
  await page.getByRole('button',{name:'Previous page',exact:true}).click();await expect(results.locator('a[data-record]')).toHaveCount(10);await results.getByRole('link').first().click();await expect(page.getByRole('region',{name:'Selected record'}).getByRole('heading',{name:'Alder Grove Foundation',exact:true})).toBeVisible();await expect(page).toHaveURL(/selected=/);
  const selectedUrl = page.url();await page.reload();await expect(page.getByRole('heading',{name:'Alder Grove Foundation',exact:true})).toBeVisible();
  await results.getByRole('link').nth(1).click();await expect(page.getByRole('heading',{name:'Birchwater Community Partners',exact:true})).toBeVisible();await page.goBack();await expect(page).toHaveURL(selectedUrl);
  await page.getByText('View',{exact:true}).click();await page.getByLabel('Sort by name',{exact:true}).selectOption('desc');await expect(results.getByRole('link').first()).toContainText('Willowbend Arts Council');
  await page.getByLabel('Group organizations',{exact:true}).selectOption('status');await expect(page.locator('.directory-group').first()).toHaveText('Prospect');
  await page.getByRole('searchbox',{name:'Search organizations',exact:true}).fill('No matching partnership');await expect(page.getByRole('heading',{name:'No matching records',exact:true})).toBeVisible();await expect(page.getByText('This record is outside the current filters.',{exact:false})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Alder Grove Foundation',exact:true})).toBeVisible();
});

test('REQ-001/008 V3 organization quick save persists, preserves untouched fields and rejects stale edits',async({page}) => {
  await login(page);await page.goto(`/organizations?selected=${orgId}`);await page.getByRole('button',{name:'Quick edit',exact:true}).click();
  const dialog = page.getByRole('dialog',{name:'Quick edit organization',exact:true});
  await dialog.getByLabel('Location',{exact:true}).fill('Airdrie');await dialog.getByLabel('Relationship Status',{exact:true}).selectOption('Cultivate');await dialog.getByRole('button',{name:'Save changes',exact:true}).click();
  await expect(dialog.getByRole('status')).toHaveText('Changes saved successfully.');
  const saved = await admin.from('organizations').select('*').eq('id',orgId).single();expect(saved.data?.location).toBe('Airdrie');expect(saved.data?.relationship_status).toBe('Cultivate');expect(saved.data?.industry).toBe(marker);expect(Number(saved.data?.estimated_opportunity)).toBe(3141.59);expect(saved.data?.website).toBe('https://example.test');expect(saved.data?.notes).toBe('Discuss the community partnership proposal');
  await dialog.getByRole('button',{name:'Done',exact:true}).click();await expect(page.getByRole('button',{name:'Quick edit',exact:true})).toBeFocused();await page.reload();await page.getByRole('button',{name:'Quick edit',exact:true}).click();
  await dialog.getByLabel('Location',{exact:true}).fill('Cochrane');
  expect((await admin.from('organizations').update({notes:'Review the latest signed partnership brief'}).eq('id',orgId)).error).toBeNull();
  await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('changed since you opened it');await expect(dialog.getByLabel('Location',{exact:true})).toHaveValue('Cochrane');
  expect((await admin.from('organizations').select('location').eq('id',orgId).single()).data?.location).toBe('Airdrie');
  page.once('dialog',d => d.dismiss());await page.keyboard.press('Escape');await expect(dialog).toBeVisible();page.once('dialog',d => d.accept());await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
});

test('REQ-002/005 V3 contact quick edit, inline validation and contextual creation',async({page}) => {
  await login(page);await page.goto(`/contacts?selected=${contactId}`);await page.getByRole('button',{name:'Quick edit',exact:true}).click();
  const dialog = page.getByRole('dialog',{name:'Quick edit contact',exact:true});
  await dialog.locator('form').evaluate((form:HTMLFormElement) => {form.noValidate = true;});await dialog.getByLabel('Email',{exact:true}).fill('not-an-email');await dialog.getByRole('button',{name:'Save changes',exact:true}).click();
  await expect(dialog.getByRole('alert')).toContainText('correct');await expect(dialog.getByLabel('Email',{exact:true})).toHaveValue('not-an-email');await expect(dialog.getByText('Enter a valid email address.',{exact:true})).toBeVisible();
  await dialog.getByLabel('Email',{exact:true}).fill('nadia.partnerships@example.test');await dialog.getByLabel('Phone',{exact:true}).fill('555-0194');await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await expect(dialog.getByRole('status')).toContainText('saved successfully');
  const saved = await admin.from('contacts').select('*').eq('id',contactId).single();expect(saved.data?.organization_id).toBe(orgId);expect(saved.data?.interests).toBe('Entrepreneurship and youth mentorship');expect(saved.data?.phone).toBe('555-0194');
  await dialog.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('link',{name:'Log an interaction',exact:true}).click();await expect(page.getByLabel('Organization',{exact:true})).toHaveValue(orgId);await expect(page.getByLabel('Contact(s)',{exact:true})).toHaveValues([contactId]);await page.getByRole('link',{name:'Cancel',exact:true}).click();await expect(page).toHaveURL(new RegExp(`contacts\\?selected=${contactId}`));
  await page.goto(`/organizations?selected=${orgId}`);await page.getByRole('link',{name:'+ Add contact',exact:true}).click();await expect(page.getByLabel('Organization',{exact:true})).toHaveValue(orgId);
});

test('REQ-001/002/005/008 V3 connected timeline, related source records, keyboard and mobile results return',async({page}) => {
  const errors:string[] = [];page.on('pageerror',e => errors.push(e.message));
  await login(page);await page.goto(`/organizations?selected=${seed.organizationId}`);await expect(page.getByRole('list',{name:'Organizations',exact:true}).locator('a[aria-current=true]')).toContainText('Prairie Lantern Ventures');await expect(page.getByRole('heading',{name:'Activity timeline',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Prairie Lantern: Overdue proposal',exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Profile',exact:true}).click();await expect(page.getByRole('tabpanel',{name:'Profile',exact:true})).toContainText('Primary Contact');await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Related records',exact:true})).toBeFocused();await expect(page.getByRole('tabpanel',{name:'Related records',exact:true}).getByRole('link').first()).toBeVisible();
  await expect(page.getByRole('tabpanel',{name:'Related records',exact:true})).not.toContainText('unavailable');
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);await page.getByRole('link',{name:'Back to results',exact:true}).click();await expect(page.getByRole('searchbox',{name:'Search organizations',exact:true})).toBeVisible();
  await page.keyboard.press('/');await expect(page.getByRole('searchbox',{name:'Search organizations',exact:true})).toBeFocused();await page.keyboard.press('Tab');
  const links = page.getByRole('list',{name:'Organizations',exact:true}).locator('a[data-record]');await links.first().focus();await page.keyboard.press('ArrowDown');await expect(links.nth(1)).toBeFocused();await page.keyboard.press('Enter');await expect(page.getByRole('tab',{name:'Activity',exact:true})).toBeVisible();expect(errors).toEqual([]);
});

for (const role of ['finance','viewer','staff']) test(`REQ-008 V3 ${role} preserves existing role and document visibility`,async({page}) => {
  await login(page,role);await page.goto(`/organizations?selected=${seed.organizationId}`);
  if (role !== 'staff') {await expect(page.getByRole('button',{name:'Quick edit',exact:true})).toHaveCount(0);await expect(page.getByRole('link',{name:'Log an interaction',exact:true})).toHaveCount(0);}
  else {await expect(page.getByRole('button',{name:'Quick edit',exact:true})).toBeVisible();await page.getByRole('button',{name:'Quick edit',exact:true}).click();await expect(page.getByRole('dialog').getByLabel('Relationship Owner',{exact:true})).toHaveCount(0);await page.keyboard.press('Escape');}
  await page.getByRole('tab',{name:'Related records',exact:true}).click();await expect(page.getByRole('tabpanel',{name:'Related records',exact:true})).not.toContainText('Board Governance Working Notes');
  const c = createClient(status.env.API_URL,status.env.ANON_KEY,{auth:{persistSession:false}}), a = accounts.find(a => a.role === role)!;await c.auth.signInWithPassword(a);
  if (role !== 'staff') {const result = await c.from('organizations').update({notes:'Unauthorized edit attempt'}).eq('id',seed.organizationId).select();expect(result.error || result.data?.length === 0).toBeTruthy();}
});

test('REQ-001/002 V3 malformed and missing selection remain recoverable',async({page}) => {
  await login(page);await page.goto('/contacts?selected=not-a-uuid');await expect(page.getByRole('heading',{name:'Invalid record reference',exact:true})).toBeVisible();await expect(page.getByRole('searchbox',{name:'Search contacts',exact:true})).toBeVisible();
  await page.goto('/contacts?selected=00000000-0000-4000-8000-000000000000');await expect(page.getByRole('heading',{name:'Record unavailable',exact:true})).toBeVisible();
});

test('REQ-008 V3 direct action replay checks role and quick edit ignores forged ownership',async({page,browser}) => {
  await login(page);await page.goto(`/organizations?selected=${orgId}`);await page.getByRole('button',{name:'Quick edit',exact:true}).click();
  const dialog = page.getByRole('dialog',{name:'Quick edit organization',exact:true});
  await dialog.locator('form').evaluate(form => {const input = document.createElement('input');input.type = 'hidden';input.name = 'relationship_owner';input.value = '00000000-0000-4000-8000-000000000099';form.append(input);});
  const request = page.waitForRequest(r => r.method() === 'POST' && !!r.headers()['next-action']);
  await dialog.getByLabel('Location',{exact:true}).fill('Banff');await dialog.getByRole('button',{name:'Save changes',exact:true}).click();const call = await request;await expect(dialog.getByRole('status')).toContainText('saved successfully');
  expect((await admin.from('organizations').select('relationship_owner').eq('id',orgId).single()).data?.relationship_owner).toBeNull();
  const context = await browser.newContext({baseURL:'http://127.0.0.1:3140'});
  try {
    const viewer = await context.newPage();await login(viewer,'viewer');
    const before = (await admin.from('organizations').select('updated_at').eq('id',orgId).single()).data?.updated_at;
    const response = await viewer.request.post(call.url(),{headers:{'Next-Action':call.headers()['next-action'],'Content-Type':call.headers()['content-type'],'Origin':'http://127.0.0.1:3140'},data:call.postDataBuffer()!});
    expect(response.status()).toBe(200);expect(await response.text()).toContain('Your role cannot edit these records');
    expect((await admin.from('organizations').select('updated_at').eq('id',orgId).single()).data?.updated_at).toBe(before);
  } finally {await context.close();}
});
