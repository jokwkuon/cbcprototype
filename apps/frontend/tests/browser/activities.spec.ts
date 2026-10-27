import { test,expect,type Page,type APIRequestContext } from "@playwright/test";
const api="http://127.0.0.1:54339";
async function signIn(page:Page,role="admin") {
 await page.goto("/login");await page.getByLabel("Email",{exact:true}).fill(`${role}@example.test`);await page.getByLabel("Password",{exact:true}).fill("synthetic-test-password");await page.getByRole("button",{name:"Sign in",exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);
}
async function seed(request:APIRequestContext) {
 const auth=await (await request.post(`${api}/auth/v1/token?grant_type=password`,{data:{email:"admin@example.test",password:"synthetic-test-password"}})).json();
 const headers={Authorization:`Bearer ${auth.access_token}`};
 const org=(await (await request.post(`${api}/rest/v1/organizations`,{headers,data:{name:"Synthetic Activity Partner",relationship_status:"Prospect"}})).json())[0];
 const contacts=[];
 for(const last_name of ["One","Two"]) contacts.push((await(await request.post(`${api}/rest/v1/contacts`,{headers,data:{organization_id:org.id,first_name:"Participant",last_name}})).json())[0]);
 return {org,contacts,headers};
}
async function addActivity(page:Page) {
 await page.goto("/activities/new");await page.getByLabel("Date / Time").fill("2020-07-15T14:30");await page.getByLabel("Activity Type").fill("Meeting");
 await page.getByLabel("Purpose",{exact:true}).fill("Synthetic quarterly check-in");await page.getByLabel("Location",{exact:true}).fill("Demo room");
 await page.getByLabel("Organization",{exact:true}).selectOption({label:"Synthetic Activity Partner"});await page.getByLabel("Contact(s)",{exact:true}).selectOption([{label:"Participant One"},{label:"Participant Two"}]);
 await page.getByLabel("Key Discussion",{exact:true}).fill("Synthetic discussion");await page.getByLabel("Sponsor Needs",{exact:true}).fill("Synthetic sponsor needs");
 await page.getByLabel("CBC Opportunity",{exact:true}).fill("Synthetic opportunity");await page.getByLabel("Outcome",{exact:true}).fill("Synthetic outcome");
 await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByRole("heading",{name:"Synthetic quarterly check-in",exact:true})).toBeVisible();
}
async function addFollowUp(page:Page,description:string,date:string) {
 await page.getByLabel("Next Action").fill(description);await page.getByLabel("Action Owner",{exact:true}).selectOption({label:"Demo staff 2"});await page.getByLabel("Due Date",{exact:true}).fill(date);await page.getByRole("button",{name:"Save record"}).click();
 await expect(page.locator("article").filter({hasText:description})).toBeVisible();
}
test.beforeEach(async({request})=>{await request.post(`${api}/__reset`);});
test("REQ-005: all fields, multiple participants/actions, edit, completion/reopen and related histories",async({page,request})=>{
 await seed(request);await signIn(page);await addActivity(page);const activityUrl=page.url();
 for(const label of ["Date / Time","Activity Type","Organization","Contact(s)","Location","Purpose","Key Discussion","Sponsor Needs","CBC Opportunity","Outcome","Last Contact"])await expect(page.locator("dt").filter({hasText:new RegExp(`^${label.replace(/[()]/g,"\\$&")}$`)})).toBeVisible();
 await expect(page.getByText("Synthetic discussion",{exact:true})).toBeVisible();await expect(page.getByRole("link",{name:"Participant Two",exact:true})).toBeVisible();
 await addFollowUp(page,"Synthetic overdue proposal","2000-01-01");await expect(page.locator("article").filter({hasText:"Synthetic overdue proposal"})).toContainText("Overdue");
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Edmonton",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 await addFollowUp(page,"Synthetic due today",today);await expect(page.locator("article").filter({hasText:"Synthetic due today"})).toContainText("Open");
 await page.goto("/dashboard");await expect(page.getByRole("link",{name:"Synthetic overdue proposal",exact:true})).toBeVisible();await expect(page.getByRole("link",{name:"Synthetic due today",exact:true})).toBeVisible();
 await page.goto(activityUrl);await page.locator("article").filter({hasText:"Synthetic overdue proposal"}).getByRole("link",{name:"Edit follow-up"}).click();await expect(page.getByRole("heading",{name:"Edit follow-up",exact:true})).toBeVisible();
 await page.getByLabel("Completion",{exact:true}).selectOption("complete");await page.getByRole("button",{name:"Save record"}).click();await expect(page.locator("article").filter({hasText:"Synthetic overdue proposal"})).toContainText("Complete");
 await page.goto("/dashboard");await expect(page.getByRole("link",{name:"Synthetic overdue proposal",exact:true})).toHaveCount(0);
 await page.goto(activityUrl);await page.locator("article").filter({hasText:"Synthetic overdue proposal"}).getByRole("link",{name:"Edit follow-up"}).click();await expect(page.getByRole("heading",{name:"Edit follow-up",exact:true})).toBeVisible();await page.getByLabel("Completion",{exact:true}).selectOption("open");await page.getByRole("button",{name:"Save record"}).click();await expect(page.locator("article").filter({hasText:"Synthetic overdue proposal"})).toContainText("Overdue");
 await page.getByRole("link",{name:"Edit activity",exact:true}).click();await expect(page.getByRole("heading",{name:"Edit activity",exact:true})).toBeVisible();await page.getByLabel("Outcome",{exact:true}).fill("Updated synthetic outcome");await page.getByLabel("Contact(s)",{exact:true}).selectOption({label:"Participant Two"});await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByText("Updated synthetic outcome",{exact:true})).toBeVisible();await expect(page.getByRole("link",{name:"Participant One",exact:true})).toHaveCount(0);
 await page.getByRole("link",{name:"Synthetic Activity Partner",exact:true}).click();await expect(page.getByRole("link",{name:"Synthetic quarterly check-in",exact:true})).toBeVisible();await expect(page.getByText("2020-07-15 14:30:00 UTC",{exact:true}).first()).toBeVisible();
 await page.goto(activityUrl);await page.getByRole("link",{name:"Participant Two",exact:true}).click();await expect(page.getByRole("link",{name:"Synthetic quarterly check-in",exact:true})).toBeVisible();
 await page.goto("/activities");await page.getByLabel("Search activities").fill("quarterly");await page.getByLabel("Follow-up status",{exact:true}).selectOption("Overdue");await page.getByRole("button",{name:"Search",exact:true}).click();await expect(page.getByRole("link",{name:"Synthetic quarterly check-in",exact:true})).toBeVisible();
 await expect(page.locator("section.card").filter({has:page.locator("p").filter({hasText:/^Due this week$/})}).locator("b")).toHaveText("1");
 await expect(page.locator("section.card").filter({has:page.locator("p").filter({hasText:/^Overdue$/})}).locator("b")).toHaveText("1");
 await expect(page.locator("section.card").filter({has:page.locator("p").filter({hasText:/^Upcoming meetings$/})}).locator("b")).toHaveText("0");
});
for(const role of ["finance","viewer"]){test(`REQ-008: ${role} can read but cannot edit activities/actions`,async({page,request})=>{
 const {org,contacts,headers}=await seed(request);
 const response=await request.post(`${api}/rest/v1/rpc/save_activity`,{headers,data:{p_id:null,p_values:{organization_id:org.id,occurred_at:"2020-07-15T14:30:00Z",activity_type:"Call",purpose:"Read-only synthetic activity"},p_contacts:[contacts[0].id]}});const id=await response.json();
 await signIn(page,role);await page.goto(`/activities/${id}`);await expect(page.getByRole("heading",{name:"Read-only synthetic activity",exact:true})).toBeVisible();await expect(page.getByRole("link",{name:"Edit activity",exact:true})).toHaveCount(0);await expect(page.getByRole("button",{name:"Save record"})).toHaveCount(0);
 await page.goto("/activities");await expect(page.getByRole("link",{name:"+ Add activity",exact:true})).toHaveCount(0);
});}
test("REQ-005: staff sees only permitted action owners and queue errors stay explicit",async({page,request})=>{
 await seed(request);await signIn(page,"staff2");await addActivity(page);await expect(page.getByLabel("Action Owner",{exact:true}).locator("option")).toHaveCount(2);
 const activityUrl=page.url();await page.getByLabel("Next Action").fill(" ");await page.getByRole("button",{name:"Save record"}).click();await expect(page.getByRole("alert").filter({hasText:"Please correct"})).toBeVisible();
 await page.getByLabel("Next Action").fill("Undated synthetic action");await page.getByRole("button",{name:"Save record"}).click();await expect(page.locator("article").filter({hasText:"Undated synthetic action"})).toContainText("No due date");
 await request.post(`${api}/__fail-activities`,{data:{fail:true}});await page.goto("/dashboard");await expect(page.getByRole("heading",{name:"Action Queue unavailable",exact:true})).toBeVisible();
 await request.post(`${api}/__fail-activities`,{data:{fail:false}});await page.goto(activityUrl);await expect(page.getByRole("heading",{name:"Synthetic quarterly check-in",exact:true})).toBeVisible();
});
