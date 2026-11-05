import { localDate } from "../../lib/presentation";
import {test,expect,type Page} from "@playwright/test";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const privateDirectory=resolve(__dirname,"../../../../.local/cbc-demo");
const accounts=JSON.parse(readFileSync(resolve(privateDirectory,"accounts.json"),"utf8")) as {email:string;password:string;role:string;name:string}[];
const records=JSON.parse(readFileSync(resolve(privateDirectory,"records.json"),"utf8"));
async function signIn(page:Page,role:string){
 const account=accounts.find(account=>account.role===role)!;
 await page.goto("/login");await page.getByLabel("Email",{exact:true}).fill(account.email);await page.getByLabel("Password",{exact:true}).fill(account.password);
 await page.getByRole("button",{name:"Sign in",exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);
}
test("REQ-001/002/005/008: real Auth and complete record/relationship/action workflow",async({page})=>{
 await signIn(page,"admin");
 await page.goto(`/organizations/${records.organizationId}`);await expect(page.getByRole("heading",{name:"Prairie Lantern Ventures",exact:true})).toBeVisible();
 await page.goto(`/contacts/${records.contactIds[0]}`);await expect(page.getByRole("heading",{name:"Amara Okafor",exact:true})).toBeVisible();
 const name=`Silver Birch Community Partners ${Date.now()}`,contactSurname=`Thompson ${Date.now()}`,contactName=`Maya ${contactSurname}`;
 await page.goto("/organizations/new");await page.getByLabel("Organization Name").fill(name);await page.getByLabel("Relationship Owner").selectOption({label:"Jordan Ellis"});await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByRole("heading",{name,exact:true})).toBeVisible();const orgUrl=page.url();
 await page.getByRole("link",{name:"Edit organization",exact:true}).click();await page.getByLabel("Notes",{exact:true}).fill("Discuss the scholarship partnership at the next review");await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByText("Discuss the scholarship partnership at the next review",{exact:true})).toBeVisible();
 await page.goto("/contacts/new");await page.getByRole("textbox",{name:"First Name",exact:true}).fill("Maya");await page.getByRole("textbox",{name:"Last Name",exact:true}).fill(contactSurname);await page.getByLabel("Organization",{exact:true}).selectOption({label:name});await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByRole("heading",{name:contactName,exact:true})).toBeVisible();const contactUrl=page.url();
 await page.getByRole("link",{name:"Edit contact",exact:true}).click();await page.getByLabel("Title",{exact:true}).fill("Community Partnerships Manager");await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByText("Community Partnerships Manager",{exact:true})).toBeVisible();
 await page.goto(orgUrl+"/edit");await page.getByLabel("Primary Contact",{exact:true}).selectOption({label:contactName});await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByRole("link",{name:contactName,exact:true})).toHaveCount(2);
 await page.goto("/activities/new");await page.getByLabel("Date / Time").fill("2022-01-01T12:00");await page.getByLabel("Activity Type").fill("Call");await page.getByLabel("Purpose",{exact:true}).fill(name);await page.getByLabel("Organization",{exact:true}).selectOption({label:name});await page.getByLabel("Contact(s)",{exact:true}).selectOption({label:contactName});await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByRole("heading",{name,exact:true})).toBeVisible();const activityUrl=page.url();
 await page.getByRole("link",{name:"Edit activity",exact:true}).click();await expect(page.getByRole("heading",{name:"Edit activity",exact:true})).toBeVisible();await page.getByLabel("Outcome",{exact:true}).fill("Send the partnership summary for review");await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByText("Send the partnership summary for review",{exact:true})).toBeVisible();
 const action=`Action ${name}`;await page.getByLabel("Next Action").fill(action);await page.getByLabel("Action Owner",{exact:true}).selectOption({label:"Jordan Ellis"});await page.getByLabel("Due Date",{exact:true}).fill("2000-01-01");await page.getByRole("button",{name:"Save record"}).click();await expect(page.locator("article").filter({hasText:action})).toContainText("Overdue");
 await page.goto("/dashboard?work=team");
 const queue=page.locator('section').filter({has:page.getByRole('heading',{name:'Action Queue — overdue and next 7 days',exact:true})});
 while(await queue.getByRole('link',{name:action,exact:true}).count()===0 && await queue.getByRole('link',{name:'Next actions',exact:true}).count()) {await queue.getByRole('link',{name:'Next actions',exact:true}).click();}
 await expect(queue.getByRole('link',{name:action,exact:true})).toBeVisible();
 await page.goto(activityUrl);await page.locator("article").filter({hasText:action}).getByRole("link",{name:"Edit follow-up",exact:true}).click();await expect(page.getByRole("heading",{name:"Edit follow-up",exact:true})).toBeVisible();await page.getByLabel("Completion",{exact:true}).selectOption("complete");await page.getByRole("button",{name:"Save record"}).click();await expect(page.locator("article").filter({hasText:action})).toContainText("Complete");
 await page.goto("/dashboard");await expect(page.getByRole("link",{name:action,exact:true})).toHaveCount(0);
 await page.goto(contactUrl);await expect(page.getByRole("link",{name,exact:true})).toHaveCount(2);await expect(page.getByText(localDate("2022-01-01T12:00:00Z",true),{exact:true}).first()).toBeVisible();
 await page.goto("/contacts");await expect(page.getByRole("heading",{name:"Contacts",exact:true})).toBeVisible();
});
for(const role of ["finance","viewer"]){test(`REQ-008: real ${role} read-only controls`,async({page})=>{
 await signIn(page,role);await page.goto(`/activities/${records.activityId}`);await expect(page.getByRole("heading",{name:"Partnership planning check-in",exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Save record"})).toHaveCount(0);await expect(page.getByRole("link",{name:"Edit activity",exact:true})).toHaveCount(0);
});}
