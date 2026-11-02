import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const local=resolve(__dirname,'../../../../.local/cbc-demo');
const accounts=JSON.parse(readFileSync(resolve(local,'accounts.json'),'utf8')) as {email:string;password:string;role:string}[];
const status=JSON.parse(readFileSync(resolve(local,'status.json'),'utf8'));
async function login(page:Page,role:string){const a=accounts.find(a=>a.role===role)!;await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(a.email);await page.getByLabel('Password',{exact:true}).fill(a.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);}
function value(page:Page,label:string){return page.locator('dl > div').filter({has:page.locator('dt').getByText(label,{exact:true})}).locator('dd');}
let organization:string,empty:string,contribution:string,activity:string,opportunity:string;
test.beforeAll(async()=>{
 const a=accounts.find(a=>a.role==='admin')!,c=createClient(status.env.API_URL,status.env.ANON_KEY,{auth:{persistSession:false}});
 if((await c.auth.signInWithPassword(a)).error)throw new Error('Synthetic report setup login failed.');
 organization=randomUUID();empty=randomUUID();contribution=randomUUID();
 if((await c.from('organizations').insert([{id:organization,name:'Synthetic Report Ledger'},{id:empty,name:'Synthetic Empty Report'}])).error)throw new Error('Synthetic report setup failed.');
 const contributions=[{id:contribution,organization_id:organization,contribution_date:'2023-01-01',amount:'1000.30',contribution_type:'Cash',funding_status:'Committed',agreement_start:'2024-01-01',agreement_end:'2027-12-31',renewal_date:'2027-01-01'},
 {id:randomUUID(),organization_id:organization,contribution_date:'2024-01-01',amount:'500',contribution_type:'In-Kind',funding_status:'Committed',agreement_start:null,agreement_end:null,renewal_date:null}];
 if((await c.from('contributions').insert(contributions)).error)throw new Error('Synthetic report contribution failed.');
 if((await c.from('cash_receipts').insert([{contribution_id:contribution,received_on:'2024-12-31',amount:'100.10',is_void:false,void_reason:null},{contribution_id:contribution,received_on:'2025-01-01',amount:'200.20',is_void:false,void_reason:null},{contribution_id:contribution,received_on:'2025-01-01',amount:'99',is_void:true,void_reason:'Synthetic report correction'}])).error)throw new Error('Synthetic report receipts failed.');
 const interaction=await c.rpc('save_activity',{p_id:null,p_values:{organization_id:organization,occurred_at:'2020-01-01T12:00:00Z',activity_type:'Meeting',purpose:'Synthetic Report Interaction'},p_contacts:[]});if(interaction.error)throw new Error('Synthetic report activity setup failed.');activity=interaction.data;
 opportunity=randomUUID();if((await c.from('opportunities').insert({id:opportunity,organization_id:organization,name:'Synthetic Report Opportunity'})).error)throw new Error('Synthetic report opportunity setup failed.');
});
test('REQ-013: six report categories navigate; Financial report reconciles periods, balances and Giving links',async({page})=>{
 await login(page,'finance');await page.setViewportSize({width:390,height:844});await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Reports',exact:true}).click();
 for(const title of ['Executive Performance','Sponsor Relationship','Scholarship Impact','Mentorship','Membership','Financial Performance'])await expect(page.getByRole('link',{name:title,exact:true})).toBeVisible();
 for(const slug of ['executive','scholarship','mentorship','membership']){await page.goto(`/reports/${slug}`);await expect(page.getByRole('heading',{name:'Definition pending',exact:true})).toBeVisible();await expect(page.getByRole('region',{name:'Financial summary'})).toHaveCount(0);}
 await page.goto(`/reports/financial?year=2025&organization=${organization}`);
 for(const [label,amount] of [['Selected-period cash received','CAD 200.20'],['Lifetime Giving / cash received','CAD 300.30'],['Prior comparable cash','CAD 100.10'],['Pledged (all-time active cash commitments)','CAD 1,000.30'],['Outstanding Commitment (all-time)','CAD 700.00'],['In-kind declared value (separate)','CAD 500.00']])await expect(value(page,label)).toHaveText(amount);
 await expect(page.getByLabel('Reporting year',{exact:true})).toHaveValue('2025');await expect(page.getByLabel('Report organization',{exact:true})).toHaveValue(organization);
 const ledger=page.getByRole('region',{name:'Received payments in period'});await expect(ledger.locator('tbody tr')).toHaveCount(1);await expect(ledger.locator('tfoot')).toContainText('CAD 200.20');await expect(page.getByText('Event ROI — Definition pending',{exact:true})).toBeVisible();
 await page.getByLabel('Reporting year',{exact:true}).fill('2024');await page.getByRole('button',{name:'Apply report filters',exact:true}).click();await expect(value(page,'Selected-period cash received')).toHaveText('CAD 100.10');await expect(value(page,'Outstanding Commitment (all-time)')).toHaveText('CAD 700.00');
 await page.getByRole('region',{name:'Received payments in period'}).getByRole('link').first().click();await expect(page).toHaveURL(new RegExp(`/giving/${contribution}$`));await expect(page.getByRole('heading',{name:'Contribution · 2023-01-01',exact:true})).toBeVisible();
});
for(const role of ['admin','staff','viewer'])test(`REQ-013/008: ${role} reads Financial report; empty periods and scopes retain genuine zeroes`,async({page})=>{
 await login(page,role);await page.goto(`/reports/financial?year=2025&organization=${organization}`);await expect(value(page,'Selected-period cash received')).toHaveText('CAD 200.20');await expect(page.getByRole('link',{name:'Edit contribution',exact:true})).toHaveCount(0);
 await page.goto(`/reports/financial?year=2022&organization=${organization}`);await expect(value(page,'Selected-period cash received')).toHaveText('CAD 0.00');await expect(value(page,'Pledged (all-time active cash commitments)')).toHaveText('CAD 1,000.30');await expect(page.getByText('No received payments in this period.',{exact:true})).toBeVisible();
 await page.goto(`/reports/financial?year=2025&organization=${empty}`);await expect(value(page,'Pledged (all-time active cash commitments)')).toHaveText('CAD 0.00');await expect(page.getByText('No contributions recorded in this scope. Verified totals are zero.',{exact:true})).toBeVisible();
});
test('REQ-013: direct invalid report filters are explicit errors with no totals',async({page})=>{
 await login(page,'admin');
 for(const query of ['year=2025x','year=0001','year=9999','year=2025&year=2024','organization=invalid','organization=ffffffff-ffff-4fff-8fff-ffffffffffff']){await page.goto(`/reports/financial?${query}`);await expect(page.getByRole('alert').filter({hasText:'Financial report unavailable'})).toContainText('Financial report unavailable');await expect(page.getByRole('region',{name:'Financial summary'})).toHaveCount(0);}
});
test('REQ-013/008: anonymous reports require login',async({page})=>{await page.goto('/reports/financial');await expect(page).toHaveURL(/\/login$/);});

for(const role of ['admin','finance','staff','viewer'])test(`REQ-013/008: ${role} reads Sponsor Relationship records without inferred pipeline metrics`,async({page})=>{
 await login(page,role);await page.goto('/reports/sponsor');await expect(page.getByText('Select an organization to view its recorded relationship evidence.',{exact:true})).toBeVisible();
 await page.getByLabel('Report organization',{exact:true}).selectOption(organization);await page.getByRole('button',{name:'Apply report filters',exact:true}).click();
 const agreements=page.getByRole('region',{name:'Recorded agreements and renewals'});await expect(agreements).toContainText('2027-01-01');await expect(agreements.locator(`a[href="/giving/${contribution}"]`)).toHaveCount(1);
 await expect(page.getByRole('region',{name:'Recorded interactions'}).getByRole('link',{name:'Synthetic Report Interaction',exact:true})).toHaveAttribute('href',`/activities/${activity}`);
 await expect(page.getByRole('region',{name:'Opportunity references'}).getByRole('link',{name:'Synthetic Report Opportunity',exact:true})).toHaveAttribute('href',`/interests/opportunities/${opportunity}`);
 await expect(page.getByRole('heading',{name:'Pipeline and renewal performance — Definition pending',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Edit contribution',exact:true})).toHaveCount(0);
 await page.goto(`/reports/sponsor?organization=${empty}`);for(const text of ['No contributions or agreement dates recorded for this organization.','No organization-linked interactions recorded.','No opportunity references recorded.'])await expect(page.getByText(text,{exact:true})).toBeVisible();
 await page.goto('/reports/sponsor?organization=invalid');await expect(page.getByRole('alert').filter({hasText:'Sponsor report unavailable'})).toBeVisible();
});
