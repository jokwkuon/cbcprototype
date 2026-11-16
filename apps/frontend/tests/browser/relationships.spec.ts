import {test,expect,type Page} from '@playwright/test';
const fixture = 'http://127.0.0.1:54339';
async function prepare(page:Page) {
  await page.request.post(`${fixture}/__reset`);
  await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill('admin@example.test');await page.getByLabel('Password',{exact:true}).fill('synthetic-test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard$/);
  await page.goto('/organizations/new');await page.getByLabel('Organization Name',{exact:true}).fill('Foxglove Community Partners');await page.getByRole('button',{name:'Save record',exact:true}).click();await expect(page.getByRole('heading',{name:'Foxglove Community Partners',exact:true})).toBeVisible();
  return page.url().split('/').pop()!;
}
test('REQ-001/005 V3 failed activity history stays unavailable and recovers',async({page}) => {
  const id = await prepare(page);
  await page.request.post(`${fixture}/__fail-activities`,{data:{fail:true}});await page.goto(`/organizations?selected=${id}`);
  await expect(page.getByRole('heading',{name:'Activity unavailable',exact:true})).toBeVisible();await expect(page.getByText('No interactions recorded',{exact:true})).toHaveCount(0);
  await page.request.post(`${fixture}/__fail-activities`,{data:{fail:false}});await page.getByRole('link',{name:'Retry workspace',exact:true}).click();await expect(page.getByRole('heading',{name:'No interactions recorded',exact:true})).toBeVisible();
});
test('REQ-001 V3 quick-edit save failure retains input, saving state and successful retry',async({page}) => {
  const id = await prepare(page);await page.goto(`/organizations?selected=${id}`);await page.getByRole('button',{name:'Quick edit',exact:true}).click();const dialog = page.getByRole('dialog',{name:'Quick edit organization',exact:true});await dialog.getByLabel('Location',{exact:true}).fill('Canmore');
  await page.request.post(`${fixture}/__relationship-behavior`,{data:{writeFailure:true,writeDelay:500}});await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await expect(dialog.getByRole('button',{name:'Saving…',exact:true})).toBeDisabled();await expect(dialog.getByRole('alert')).toContainText('Unable to save');await expect(dialog.getByLabel('Location',{exact:true})).toHaveValue('Canmore');
  await page.request.post(`${fixture}/__relationship-behavior`,{data:{}});await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await expect(dialog.getByRole('status')).toHaveText('Changes saved successfully.');await expect(dialog.getByLabel('Location',{exact:true})).toHaveValue('Canmore');await dialog.getByRole('button',{name:'Done',exact:true}).click();await page.reload();await expect(page.getByRole('tabpanel',{name:'Activity',exact:true})).toContainText('Canmore');
});
test('REQ-001/005 V3 slow activity reads expose a loading state before the empty result',async({page}) => {
  const id = await prepare(page);await page.request.post(`${fixture}/__relationship-behavior`,{data:{delayTable:'activities',delay:1500}});
  await page.goto(`/organizations?selected=${id}`,{waitUntil:'commit'});await expect(page.locator('.relationship-loading').first()).toBeVisible();await expect(page.getByRole('heading',{name:'No interactions recorded',exact:true})).toBeVisible();
});
