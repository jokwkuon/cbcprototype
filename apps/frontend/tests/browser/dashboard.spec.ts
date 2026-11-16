import {test,expect,type Page} from '@playwright/test';
const api='http://127.0.0.1:54339';
async function login(page:Page){await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill('admin@example.test');await page.getByLabel('Password',{exact:true}).fill('synthetic-test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);}
test.beforeEach(async({request})=>{await request.post(`${api}/__reset`);});
function kpi(page:Page,label:string){return page.getByRole('region',{name:'Executive KPIs'}).locator('.metric-card').filter({has:page.getByText(label,{exact:true})});}
test('REQ-006: successful empty dashboard retains zero counts and empty lists',async({page})=>{
 await login(page);
 await expect(kpi(page,'Sponsorship revenue').locator('p').last()).toHaveText('Unavailable');
 await expect(kpi(page,'Active sponsors').locator('p').last()).toHaveText('0');
 await expect(kpi(page,'Sponsor pipeline').locator('p').last()).toHaveText('Unavailable');
 await expect(kpi(page,'Renewal rate').locator('p').last()).toHaveText('Pending');
 await expect(kpi(page,'Active members').locator('p').last()).toHaveText('0');
 await expect(page.getByText('No organizations yet.',{exact:true})).toHaveCount(2);
 await expect(page.getByText('Total organizations',{exact:true})).toBeVisible();
 await expect(page.getByRole('status').filter({hasText:'Financial summary unavailable'})).toBeVisible();
 await expect(page.getByText('Relationship dashboard unavailable',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Event ROI is not shown',{exact:false})).toBeVisible();
});
for(const query of ['organizations','contacts','statuses','recent'])test(`REQ-006: failed ${query} query shows unavailable instead of zero or empty data`,async({page,request})=>{
 await login(page);await request.post(`${api}/__fail-dashboard`,{data:{query}});await page.reload();
 await expect(page.getByRole('alert').filter({hasText:'Relationship dashboard unavailable'})).toBeVisible();
 await expect(page.getByText('Total organizations',{exact:true})).toHaveCount(0);
 await expect(page.getByText('No organizations yet.',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Your upcoming work',exact:true})).toBeVisible();
 await request.post(`${api}/__fail-dashboard`,{data:{query:''}});await page.reload();await expect(page.getByText('Total organizations',{exact:true})).toBeVisible();
});

test('REQ-006/004: successful zero financial summary differs from failed RPC',async({page,request})=>{
 await request.post(`${api}/__empty-financial-summary`,{data:{enabled:true}});await login(page);
 const summary=page.getByRole('region',{name:'Financial summary'});
 await expect(summary).toBeVisible();
 await expect(summary.locator('dt').getByText('Cash received this year',{exact:true}).locator('..').locator('dd')).toHaveText('CAD 0.00');
 await expect(kpi(page,'Sponsorship revenue').locator('p').last()).toHaveText('CAD 0.00');
 await expect(kpi(page,'Sponsor pipeline').locator('p').last()).toHaveText('CAD 0.00');
 await request.post(`${api}/__empty-financial-summary`,{data:{enabled:false}});await page.reload();
 await expect(page.getByRole('status').filter({hasText:'Financial summary unavailable'})).toBeVisible();
 await expect(summary).toHaveCount(0);
 await expect(page.getByText('Total organizations',{exact:true})).toBeVisible();
});

for(const [table,label] of [['membership_details','Membership'],['mentorship_details','Mentorship'],['sponsor_interests','Sponsor interests'],['program_enrollments','Programs'],['activities','Recent interactions']])test(`REQ-006 ${label} failure is unavailable and recovers`,async({page,request})=>{
 await login(page);await request.post(`${api}/__report-fixture`,{data:{failure:table}});await page.reload();await expect(page.getByRole('alert').filter({hasText:`${label} unavailable.`})).toBeVisible();await request.post(`${api}/__report-fixture`,{data:{}});await page.reload();await expect(page.getByRole('alert').filter({hasText:`${label} unavailable.`})).toHaveCount(0);
});
