# Programs & Recipients — REQ-010

**Status:** Provisional MVP implementation under [ADR-014](../../project/decisions.md), pending CBC approval. Explicit repository-owner implementation request supersedes the earlier planning-only worksheet for this slice. Baseline register priority remains historical; student/production decisions are not settled.

Source: physical pages 11–12 and the [field matrix](../field-matrix.md). The PDF and extracted text remain permission-restricted outside Git. No illustrated source identities/numbers are used as fixtures.

## Screens and relationships

`/programs` lists programs and the recipient enrollment directory, with search/program/cohort filters and the four illustrated KPI labels. Program, cohort, recipient and enrollment entities each have create/detail/edit screens; recipient/cohort directories make standalone records reachable. Contact and organization details show related enrollments. Desktop/mobile navigation uses the shared shell; forms reuse shared validation, preserved values and error/empty/unavailable states.

Operational `programs` optionally link an existing typed funding Program reference (Program Alignment). `program_cohorts` belong to programs. `program_recipients` provide standalone or explicitly linked contact identities and optional organizations; `program_enrollments` link recipient plus matching program/cohort. This allows multiple cohorts without duplicating a person record. Existing Giving reference write permissions are not expanded.

| Source field | Implemented mapping / behavior |
|---|---|
| PRO-01 Program | Required program FK; linked list/detail, selected on enrollment form |
| PRO-02 Recipient / Participant | Required stable recipient FK; standalone name or optional unique existing contact; names read live |
| PRO-03 Cohort / Year | Required cohort FK matching program; manual cohort label and optional year |
| PRO-04 Award / Support Amount | Optional exact CAD declared total per enrollment; null unknown, explicit zero retained |
| PRO-05 Education Level | Optional manual text |
| PRO-06 Institution | Optional manual text; recipient may separately link an existing institution/organization |
| PRO-07 Field of Study | Optional manual text |
| PRO-08 Graduation Status | Optional manual text; no automatic inference |
| PRO-09 Graduation Date | Optional valid calendar date; does not establish alumni eligibility |
| PRO-10 Employment Status | Optional manual text |
| PRO-11 Employment Field | Optional manual text |
| PRO-12 Field Alignment | Read-only Definition pending; no unsupported matching rubric |
| PRO-13 CBC Engagement | Partial: explicit linked-contact past interactions supported; full membership/volunteer/mentor/donor classification pending |
| PRO-14 Alumni Giving | Supported person-wide exact cash receipts with explicit contact/alumni effective date; unknown eligibility stays pending |
| PRO-15 Last Contact | Existing latest nonfuture contact-linked activity; absent contact = unavailable, no eligible activity = no past activity |

Directory columns Recipient, Program, Cohort, Level, Field and Outcome are represented. Outcome shows raw manual graduation/employment labels; unknown is explicit. Participants counts distinct enrolled recipient IDs within selected scope. Enrollments and known CAD support totals/counts are verifiable; missing amounts remain reported. Scholarships, Graduation Rate and Employed in Field labels remain Definition pending with missing definitions explained. Program filters and cohort filters affect summaries; search narrows directory only.

## Integrity and permissions

Active Admin/Staff create/edit all four operational tables; all active named roles read. Inactive/anonymous denied, no hard deletion. One contact per linked recipient, one enrollment per recipient/cohort, unique manual cohort label within its program. Composite FKs enforce program/cohort and explicit contact/organization membership on write and prevent incompatible reparenting. Program Alignment rejects Event references. IDs immutable; creation preserved and modification times generated server-side.

No copied activity/receipt records, finance mutations, automatic contact/name matching or generated outcome percentages. Alumni Giving uses linked contact Cash receipts, excluding voids, effective date inclusive through Calgary today. It is recipient-wide and excluded from program support totals; multiple enrollments must not be summed as new alumni cash. Full audit history and outcome/alumni attribution policies remain pending.

## Verification and approval

AT-08 covers repeated cohorts and programs, education/institution/support edits, unknown outcomes, explicit affiliations, negative links, cohort isolation, exact support sums, supported engagement/alumni giving and pending definitions. AT-14 covers direct SQL/API role denial and unchanged financial permissions. AT-15 covers all fifteen labels, six directory columns and four source KPI labels. AT-16 covers real local Auth/PostgREST, SQL/browser/static checks and fixture/migration repeatability.

See [progress](../../delivery/progress.md) and [demo checklist](../../delivery/demo-checklist.md) for executed evidence. Manual CBC walkthrough/sign-off and hosted deployment are separate gates; no hosted modification is authorized.
