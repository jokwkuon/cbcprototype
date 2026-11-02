import {test,expect,type Page} from '@playwright/test';
const api='http://127.0.0.1:54339';
async function login(page:Page){await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill('admin@example.test');await page.getByLabel('Password',{exact:true}).fill('synthetic-test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);}
test.beforeEach(async({request})=>{await request.post(`${api}/__reset`);});
test('REQ-013: empty report shows verified zeroes and receipt-empty state',async({page,request})=>{
 await login(page);await request.post(`${api}/__report-fixture`,{data:{}});await page.goto('/reports/financial?year=2025');
 await expect(page.getByText('No contributions recorded in this scope. Verified totals are zero.',{exact:true})).toBeVisible();await expect(page.getByText('No received payments in this period.',{exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'Financial summary'})).toContainText('CAD 0.00');await expect(page.getByRole('alert').filter({hasText:'Financial report unavailable'})).toHaveCount(0);
});
for(const failure of ['giving_summary','contribution_details','giving_receipts','organizations','activity_today'])test(`REQ-013: ${failure} failure cannot render a zero report`,async({page,request})=>{
 await login(page);await request.post(`${api}/__report-fixture`,{data:{failure}});await page.goto('/reports/financial?year=2025');
 await expect(page.getByRole('alert').filter({hasText:'Financial report unavailable'})).toContainText('Financial report unavailable');await expect(page.getByRole('region',{name:'Financial summary'})).toHaveCount(0);
 await expect(page.getByText('Verified totals are zero.',{exact:false})).toHaveCount(0);
 await request.post(`${api}/__report-fixture`,{data:{}});await page.reload();await expect(page.getByRole('region',{name:'Financial summary'})).toBeVisible();
});
test('REQ-013: inconsistent ledger refuses totals and slow queries show loading',async({page,request})=>{
 await login(page);await request.post(`${api}/__report-fixture`,{data:{mismatch:true}});await page.goto('/reports/financial?year=2025');await expect(page.getByRole('alert').filter({hasText:'Financial report unavailable'})).toContainText('Financial report unavailable');
 await request.post(`${api}/__report-fixture`,{data:{delay:2500}});await page.goto('/reports/financial?year=2024',{waitUntil:'commit'});
 await expect(page.getByRole('status').filter({hasText:'Loading report…'})).toBeVisible();await expect(page.getByRole('region',{name:'Financial summary'})).toBeVisible();await expect(page.getByText('Loading report…',{exact:false})).toHaveCount(0);
});
