# David’s walkthrough — Calgary Black Chambers relationship workspace

Use this with the local demonstration. Every person and organization below is fictional. The sign-in password stays in the private file `.local/cbc-presentation/accounts.json`. Do not read it aloud or put it on a slide.

Recommended sign-in: **Morgan Hayes**, administrator. Email `cbc-demo-admin@example.test`. Morgan can see the whole workspace. Jordan Ellis is the staff member who looks after Prairie Lantern Ventures.

Open `http://localhost:3140/login`.

## 30-second opening

“This is the workspace we would use to keep sponsors, members, programs and follow-ups in one place. The numbers on the first screen come from the records themselves. Where Calgary Black Chambers has not yet agreed a formula — renewal rate, pair health, event return — the screen says Pending instead of inventing a percentage.”

Click **Sign in**.

## The executive dashboard, and why it matters

You land on **Executive Dashboard**.

Point to the five tiles:

- **Sponsorship revenue** is **CAD 750.00**. That is cash actually received in 2026. The note says commitments are excluded. The change versus the comparable period last year is **CAD 550.00 (275%)**, because CAD 200.00 arrived in the earlier period.
- **Active sponsors** is **1**. That is Prairie Lantern Ventures, the only organization marked Active. We do not have a separate approved “sponsor” category, so this tile counts Active organizations.
- **Sponsor pipeline** is **CAD 3,000.00**. That is money committed or invoiced and not yet received. It is not revenue.
- **Renewal rate** says **Pending**. We will not show a percentage until CBC agrees how a renewal is counted.
- **Active members** is **1**. That is a membership term that has started and has not passed its renewal date.

Under **Sponsor & donor relationships**: Active 1, Prospects 1 (Aspen Bridge Consulting), Proposal 0. **At risk** is Pending on purpose.

Scroll to **Funding & financial health**. Received this year is CAD 750.00. Outstanding on open commitments is **CAD 2,050.00**. There is no annual goal stored, and no event return, so those are not drawn as if they were known.

Scroll to **Your upcoming work**. **Team actions** is already selected. You should see:

- **Prairie Lantern: Overdue proposal** — overdue, due Nov 15, 2026, owner Jordan Ellis
- **Prairie Lantern: Due today** — open, owner Simone Clarke

That is the point of the screen: money and the next conversation sit together.

## Open the sponsor

Click **Organizations**. In the search box type `Prairie Lantern` and press Enter.

Click **Open full record**.

Show:

- **Amara Okafor**, Community Partnerships Director, primary contact
- **Daniel Mensah**, Business Development Lead
- Owner **Jordan Ellis**, status Active, strength High
- The giving section: a Community Partner cash commitment that is **Partially Received**, linked to **Future Builders Scholarship**
- Activities, including the partnership planning check-in and the open follow-ups

## Log a meeting and assign a follow-up

Click **Activities & Follow-Ups**, then **+ Add activity**.

- Date / Time: today, for example `2026-11-16T15:00`
- Activity Type: `Meeting`
- Purpose: `Renewal conversation with Prairie Lantern`
- Organization: **Prairie Lantern Ventures**
- Contact(s): **Amara Okafor**
- Key Discussion: `Reviewed the remaining scholarship balance and the January renewal.`

Click **Save record**.

On the meeting, add the next action:

- Next Action: `Send Amara the scholarship balance`
- Action Owner: **Jordan Ellis**
- Due Date: tomorrow

Click **Save record**. The action shows as **Open**.

Click **Dashboard**. Under **Your upcoming work**, with **Team actions** selected, find **Send Amara the scholarship balance**. Open it, click **Edit follow-up**, set Completion to **complete**, and save. Back on the dashboard, that action is gone from the open list and the meeting keeps the completed note.

A finished check called **Walkthrough partnership meeting** may already be in the activity history. That was the final verification. Ignore it, or log the fresh meeting above.

## Committed money versus money received

Click **Sponsorship & Giving**. Open the **Jan 1, 2026** cash contribution for Prairie Lantern Ventures.

Say this slowly:

- The agreement amount is **CAD 2,000.00**. That is a commitment.
- **Cash received** on that agreement is **CAD 950.00** (CAD 750.00 in 2026 and CAD 200.00 from the year before). A voided duplicate is not included.
- **Outstanding** on that agreement is **CAD 1,050.00**.
- A separate **CAD 1,000.00** invoice has not been received. It sits in the pipeline and in the outstanding balance. It is not revenue.
- The **CAD 500.00** in-kind gift is listed on its own. It is not cash.
- A cancelled CAD 400.00 line and a prospect CAD 250.00 line do not create an amount owing.

The renewal date on the live agreements is **Jan 1, 2027**. That is a date someone typed. It is not a renewal-rate score.

## People served, mentorship and membership

Click **Programs & Recipients**.

- **2** participants, **4** enrollments
- Recorded support **CAD 1,550.30**, with one enrollment that has no amount
- **Amara Okafor** — Horizon Class of 2024 — Graduated, Employed, Business Administration
- **Nia Adebayo** — outcome not yet recorded
- **Launchpad Business Skills** — In Progress

Graduation rate, employment-in-field and “scholarships awarded” stay Pending until CBC decides what to count.

Click **Mentorship**. Amara Okafor mentors Daniel Mensah in Horizon Scholars, status Active, one check-in on Feb 1, 2020. **Pair health** says Definition pending. We do not color the pair Healthy or At Risk without an agreed rule.

Click **Membership**.

- Amara has a current individual term, renewal **Dec 6, 2026**, payment recorded as paid
- An earlier individual term is renewal overdue
- Prairie Lantern’s corporate term is scheduled and has not started

Retention and renewal risk are not scored.

Click **Documents**. **Prairie Lantern Partnership Agreement** is an internal record, version 1, linked to the sponsor. The page says files are not stored yet. Staff can keep the name, type, dates and who may see the record. They cannot upload the PDF in this demonstration.

## A report, then the export

Click **Reports**, then **Financial Performance**.

- Reporting year: **2026**
- Organization: **Prairie Lantern Ventures**
- Click **Apply report filters**

The selected-period cash is **CAD 750.00**. Lifetime cash received is **CAD 950.00**. Outstanding is **CAD 2,050.00**. The sentence on the page says pledges are not received revenue.

Click **Export filtered receipt CSV**. The file has two 2026 receipts: **CAD 500.00** on Jan 1 and **CAD 250.00** on Nov 16. Last year’s CAD 200.00 and the voided receipt are not in that 2026 file.

The other five reports are on the same Reports page: Executive Performance, Sponsor Relationship, Scholarship Impact, Mentorship and Membership. Each has filters and **Export filtered CSV**. Scholarship can be limited to **Horizon Scholars Program**.

## Closing

What staff can do today: add an organization and its people, record a commitment separately from cash that arrives, log a meeting, assign a follow-up with an owner and a date, and see that follow-up on the executive screen until it is done. Programs, mentorship and membership keep the people and the dates. Reports export the same records.

What is still waiting on CBC: renewal rate, at-risk sponsors, event return, graduation and employment rates, whether a job matches the field of study, pair health, member engagement and renewal risk, volunteer hours, and storing the actual document files.

How a staff member would use it on a normal day: open the dashboard, clear the overdue Prairie Lantern proposal, log the conversation before leaving the meeting, and let the cash tile move only when money is actually received.
