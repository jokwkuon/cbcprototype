import { test, expect, type Page } from "@playwright/test";
async function signIn(page: Page, role: string) {
  await page.goto("/login"); await page.getByLabel("Email",{exact:true}).fill(`${role}@example.test`);
  await page.getByLabel("Password",{exact:true}).fill("synthetic-test-password"); await page.getByRole("button",{name:"Sign in",exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
test.beforeEach(async({request})=>{await request.post("http://127.0.0.1:54329/__reset");});
test("REQ-001/002: create, read, update, linked navigation and inline validation",async({page})=>{
  await signIn(page,"admin");
  await page.goto("/organizations/new");
  await page.getByLabel("Organization Name").fill("Synthetic Board Demo");
  await page.getByLabel("Organization Type",{exact:true}).fill("Community Partner");
  await page.getByLabel("Industry",{exact:true}).fill("Synthetic Industry");
  await page.getByLabel("Location",{exact:true}).fill("Demo City");
  await page.getByLabel("Estimated Opportunity",{exact:true}).fill("1234.56");
  await page.getByLabel("Relationship Status",{exact:true}).selectOption("Cultivate");
  await page.getByLabel("Priority Level",{exact:true}).selectOption("High");
  await page.getByLabel("Relationship Owner").selectOption({label:"Demo staff 2"});
  await page.getByLabel("Relationship Strength").selectOption("High");
  await page.getByLabel("Potential",{exact:true}).selectOption("Low");
  await page.getByLabel("Website",{exact:true}).fill("javascript:alert(1)");
  await page.getByRole("button",{name:"Save record"}).click();
  await expect(page.getByRole("alert").filter({hasText:"Please correct"})).toContainText("correct");
  await expect(page.getByLabel("Organization Name")).toHaveValue("Synthetic Board Demo");
  await page.getByLabel("Website",{exact:true}).fill("example.test");
  await page.getByRole("button",{name:"Save record"}).click();
  await expect(page.getByRole("heading",{name:"Synthetic Board Demo",exact:true})).toBeVisible();
  for (const label of ["Organization Name","Organization Type","Industry","Website","Primary Contact","Relationship Owner","Relationship Status","Relationship Strength","Priority Level","Potential","Estimated Opportunity","Notes"]) await expect(page.locator("dt").filter({hasText:new RegExp(`^${label}$`)})).toBeVisible();
  for (const value of ["Community Partner","Synthetic Industry","Demo City","1234.56","Cultivate","https://example.test/"]) await expect(page.getByText(value,{exact:true})).toBeVisible();
  const orgUrl=page.url(); await expect(page.getByText("Demo staff 2",{exact:true})).toBeVisible();
  await expect(page.getByText("Definition pending",{exact:true})).toHaveCount(6);
  await page.getByRole("link",{name:"Edit organization",exact:true}).click();
  await page.getByLabel("Potential",{exact:true}).selectOption("High");
  await page.getByLabel("Notes",{exact:true}).fill("Synthetic updated note");
  await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByText("Synthetic updated note",{exact:true})).toBeVisible();
  await page.goto("/contacts/new");
  await page.getByRole("textbox",{name:"First Name",exact:true}).fill("Demo");await page.getByRole("textbox",{name:"Last Name",exact:true}).fill("Person");
  await page.getByLabel("Organization",{exact:true}).selectOption({label:"Synthetic Board Demo"});
  await page.getByLabel("Contact Type",{exact:true}).fill("Decision Maker");await page.getByLabel("Influence Level",{exact:true}).selectOption("High");
  await page.getByLabel("Interests",{exact:true}).fill("Scholarships");
  await page.getByLabel("Email",{exact:true}).fill("person@example.test");
  await page.getByLabel("Phone",{exact:true}).fill("555-0100");
  await page.getByLabel("Notes",{exact:true}).fill("Synthetic contact note");
  await page.getByRole("button",{name:"Save record"}).click();
  await expect(page.getByRole("heading",{name:"Demo Person",exact:true})).toBeVisible();
  await expect(page.getByText("Demo staff 2",{exact:true})).toBeVisible();
  for (const label of ["First Name","Last Name","Title","Organization","Email","Phone","Contact Type","Influence Level","Relationship Owner","Interests","Notes"]) await expect(page.locator("dt").filter({hasText:new RegExp(`^${label}$`)})).toBeVisible();
  for (const value of ["person@example.test","555-0100","Decision Maker","Synthetic contact note"]) await expect(page.getByText(value,{exact:true})).toBeVisible();
  await expect(page.getByText("Definition pending",{exact:true})).toHaveCount(4);
  const contactUrl=page.url();
  await page.getByRole("link",{name:"Edit contact",exact:true}).click();await page.getByLabel("Title",{exact:true}).fill("Synthetic Director");
  await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByText("Synthetic Director",{exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Synthetic Board Demo",exact:true}).click();await expect(page).toHaveURL(orgUrl);
  await page.getByRole("link",{name:"Edit organization",exact:true}).click();await page.getByLabel("Primary Contact",{exact:true}).selectOption({label:"Demo Person"});
  await page.getByRole("button",{name:"Save record"}).click();
  await expect(page.getByRole("link",{name:"Demo Person",exact:true})).toHaveCount(2);
  await page.goto(contactUrl);await page.reload();await expect(page.getByText("Scholarships",{exact:true})).toBeVisible();
  await page.goto("/organizations");await page.getByPlaceholder("Search organizations…").fill("Synthetic");await page.getByPlaceholder("Search organizations…").press("Enter");
  await expect(page.getByRole("link",{name:"Synthetic Board Demo",exact:true})).toBeVisible();
});
test("REQ-008: staff self-assignment only and no edit owner control",async({page})=>{
  await signIn(page,"staff2");await page.goto("/organizations/new");
  await expect(page.getByLabel("Relationship Owner").locator("option")).toHaveCount(2);
  await page.getByLabel("Organization Name").fill("Staff Synthetic Org");await page.getByLabel("Relationship Owner").selectOption({label:"Demo staff 2"});
  await page.getByRole("button",{name:"Save record"}).click();await page.getByRole("link",{name:"Edit organization",exact:true}).click();
  await expect(page.getByLabel("Relationship Owner")).toHaveCount(0);
  await page.getByLabel("Potential",{exact:true}).selectOption("High");await page.getByRole("button",{name:"Save record"}).click();
  await expect(page.getByText("Demo staff 2",{exact:true})).toBeVisible();
});
for(const role of ["finance","viewer"]){test(`REQ-008: ${role} has no create controls`,async({page})=>{
  await signIn(page,role);await page.goto("/organizations");await expect(page.getByRole("link",{name:"+ Add organization",exact:true})).toHaveCount(0);
  await page.goto("/contacts");await expect(page.getByRole("link",{name:"+ Add contact",exact:true})).toHaveCount(0);
});}
test("REQ-008: anonymous redirect and mobile navigation",async({page})=>{
 await page.goto("/organizations");await expect(page).toHaveURL(/\/login$/);
 await signIn(page,"admin");await page.setViewportSize({width:390,height:844});
 await page.getByRole("navigation",{name:"Mobile navigation"}).getByRole("link",{name:"Contacts",exact:true}).click();
 await expect(page.getByRole("heading",{name:"Contacts",exact:true})).toBeVisible();
});
