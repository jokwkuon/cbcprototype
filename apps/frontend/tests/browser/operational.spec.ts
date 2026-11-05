import {test,expect} from '@playwright/test';
const api='http://127.0.0.1:54339';
test('REQ-001/002/005/008 bounded search, server paging, personal queue and request auth reuse',async({page,request})=>{
  await request.post(`${api}/__reset`);
  await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill('admin@example.test');await page.getByLabel('Password',{exact:true}).fill('synthetic-test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard$/);
  await page.goto('/organizations/new');await page.getByLabel('Organization Name',{exact:true}).fill('Juniper Vale Partners');await page.getByRole('button',{name:'Save record',exact:true}).click();
  await page.goto('/organizations?q=Juniper');await expect(page.locator('a[data-record]')).toHaveCount(1);
  await page.goto('/organizations?q=Juniper&page=999');await expect(page.locator('a[data-record]')).toHaveCount(1);await expect(page.getByRole('button',{name:'Next page'})).toBeDisabled();
  const found=await page.request.get('/api/search?q=Juniper');expect(found.ok()).toBeTruthy();expect((await found.json()).results.map((r:{name:string})=>r.name)).toContain('Juniper Vale Partners');
  const none=await page.request.get('/api/search?q=%25%2C()%22');expect((await none.json()).results).toEqual([]);
  await page.goto('about:blank'); // Stop background Link prefetches before counting one document render.
  await request.post(`${api}/__metrics-reset`);
  expect((await page.request.get('/organizations?q=Juniper')).ok()).toBeTruthy();
  const metrics=await (await request.get(`${api}/__metrics`)).json();
  expect(metrics['/rest/v1/profiles']).toBe(1);
  expect(metrics['/auth/v1/user']).toBeLessThanOrEqual(3); // Middleware/SDK checks remain separate; profile count proves shared render context.
  await page.goto('/dashboard');await expect(page.getByRole('link',{name:'Assigned to me',exact:true})).toHaveAttribute('aria-current','page');await page.getByRole('link',{name:'Team actions',exact:true}).click();await expect(page).toHaveURL(/work=team/);await expect(page.getByRole('link',{name:'Team actions',exact:true})).toHaveAttribute('aria-current','page');
  await page.getByRole('link',{name:'Unassigned',exact:true}).click();await expect(page).toHaveURL(/work=unassigned/);
});
