# Calgary Black Chambers: Operations Platform Requirements & Workflows

> **Scope correction, 2026-11-05:** CBC wants its **own native HubSpot-like CRM and Eventbrite-like events platform**, not API integrations with either vendor. The app must own sponsorship pipelines, event pages, registrations, tickets, check-ins and reporting. External email delivery and card-payment rails, if ever enabled, require separate provider/merchant approval. Any remaining reference to Eventbrite reflects the existing public website or optional legacy data migration, **not a dependency for the new app**. See the dedicated Codex execution work order in `docs/delivery/codex-native-cbc-platform-execution.md`.

**Status:** Discovery draft for CBC user review — not an approved specification, implementation authorization, or production access policy.  
**Prepared:** 2026-11-05  
**Basis:** CBC operational meeting notes supplied by the project owner; public CBC website pages reviewed on 2026-11-05; current prototype documentation and code on `feature/version3-reliability-operations`.  
**Scope:** CBC-owned operational platform, including a **native CRM and native event-registration/ticketing system**. No HubSpot or Eventbrite API is required for core workflows. Existing WordPress event marketing may remain separate until CBC approves a publishing approach.  
**Data rule:** Public-safe requirements only. No real records, guest lists, student data, sponsor agreement terms, staff credentials, internal budgets, or other confidential material are included.

## 1. The product we are building

CBC needs one connected workspace to manage relationships, sponsorships, events, program delivery, tasks, budgets and credible impact evidence. The CRM is the shared identity and relationship layer, not the entire product.

A sponsor may fund a speaker series and scholarships. That sponsor has contacts, meetings, a commitment, payment status, promised benefits, events, renewal dates and a report showing what was delivered. Those records must connect without copying or double-counting amounts.

An event has a separate operational lifecycle: venue comparison, approval, capacity, registration, attendance, expenses, surveys and follow-up. A registration is **not** attendance, and a commitment is **not** cash received.

CBC's **working four-pillar taxonomy** is Scholarship, Mentorship, Fellowship and Impact (per owner meeting context). Some older public pages still use three pillars or the term Advocacy. Confirm taxonomy and publication terms with CBC before changing public reports.

### Expected outcomes

1. A team member can sign in and see their assignments, today's meetings, upcoming events, and issues needing attention.
2. Event organizers can decide whether venue capacity and costs are reasonable, then measure actual turnout and attendee feedback.
3. Sponsorship owners can see what a sponsor committed, what was received, what CBC promised, what has been delivered, and what remains due.
4. Pillar leads can see people, milestones, delivery evidence, and outcomes relevant to their programs.
5. Leadership can review budget versus actual spending, operational risks, and approved metrics without manually joining spreadsheets.
6. The system clearly separates observed facts, estimates, missing data, and unapproved metrics.

### Non-goals for initial delivery

No third-party CRM/ticketing API dependency, no self-service **card** processing until a compliant merchant provider is approved, no unreviewed mass email, no production accounting ledger, no automated scholarship adjudication, no automated mentorship matching, no individual no-show punitive scoring, no speculative impact/ROI score, and no public upload of sensitive documents or participant data.

## 2. Evidence, observed needs, and uncertainty

| Evidence type | What it supports | Limits |
|---|---|---|
| Owner's November 5 meeting notes | Attendance/no-shows; over/under-capacity; variable venue cost; QR surveys; automated follow-ups; notes; shared/personal calendars; impact, awards, budget planning | User-reported operational needs, not yet validated with every CBC role |
| CBC Fellowship page | September–June 10-month monthly speaker series with RBC; Calgary Petroleum Club; Eventbrite reservation link; published 2024–25 engagement highlights | Membership tiers/benefits, pricing, attendance exports and actual workflow unverified |
| CBC Partners page | Sponsor support, event access, speaker participation, branding, media mentions and materials | Benefits and contracts vary by sponsor; do not assume every partner receives all benefits |
| CBC Scholarships page | Named awards, donor ties and Calgary Foundation-managed fund separate from CBC Society | Real awarding authority, payment reconciliation and student access rules require confirmation |
| CBC Mentorship page | Mentor/mentee program and monthly mentor commitment guideline | Consent, safeguarding, matching, application and escalation processes not confirmed |
| CBC Impact page | Healthcare, education, safety, civic representation; three-year education equity plan; curriculum, educator and institution goals | Outcomes should never be inferred from simple activity counts |
| CBC Awards page | CBAA recognition/nominations and 2027 event announcement | Historical page sections also mention 2025; confirm current schedule before calendar migration |
| Prototype code and README | Organizations, contacts, activity/follow-ups, giving, programs/recipients, mentorship, membership, reports, bounded search and RLS | Synthetic/local demonstrations are not proof of production readiness or CBC approval |
| Public event URL and two YouTube links | References supplied by owner | Direct event and video content could not be independently reviewed; do not attribute content to them |

Website findings reflect publicly visible copy, which may be stale or inconsistent. Existing `docs/project/decisions.md`, `docs/project/scope.md` and `docs/architecture/access-matrix-proposal.md` remain authoritative records of unresolved approvals. This discovery document is additive and does not silently revise those decisions.

## 3. Operating model and shared relationships

```text
Organization / person
  -> contact and relationship owner
  -> meetings / notes / tasks / calendar items
  -> sponsor opportunities -> agreements -> commitments -> cash receipts
                                     -> promised benefits -> verified delivery
  -> funded events -> registrations -> check-ins -> surveys -> follow-up
  -> supported programs -> cohorts -> participants / award records -> evidence
  -> aggregate reporting (respect permissions and approved metric definitions)
```

A record may participate in several workflows. Use explicit links and stable IDs, not inferred matches based on names or email addresses. Store source-system IDs for imports. Design in a way that lets one person attend many events and belong to several program cohorts without duplicate identities.

## 4. User workspaces and access

Workspaces indicate responsibility, **not** automatic access rights. The four implemented baseline auth roles are Admin, Staff, Finance and Viewer; program-level capabilities below are *proposals*, not already enforced.

| Workspace / typical user | Default homepage | Common actions | Sensitive access |
|---|---|---|---|
| Leadership | Sponsorship commitments, delivery risks, upcoming events, budgets, pillar summaries, approvals | Review reports, assign work, approve decisions | Only approved summary/detail scopes |
| Fellowship / event organizer | Event timeline, venue decisions, registration/capacity, check-in, surveys, members | Plan event, track attendance, close event | Attendee fields needed to deliver event only |
| Sponsorship / relationship owner | My sponsors, upcoming renewals, overdue deliverables, contacts, next meetings | Log interaction, draft proposal, complete benefits | Financial details only as explicitly granted |
| Scholarship lead | Award cycles, named scholarships, milestones, aggregate awards | Confirm approved awards, link funding and recipients | Student records only with explicit authorization |
| Mentorship lead | Cohorts, pairing queue, meetings/check-ins, flagged follow-ups | Arrange match, review check-ins, manage cadence | Restricted mentee notes/safeguarding separated |
| Impact lead | Initiatives, institutions, milestones, evidence and outcome approvals | Record activity, attach evidence, approve narrative | Restricted source evidence only as required |
| Program coordinator | My calendar, shared calendar, events, tasks, notes, venue logistics | Schedule, add notes, assign tasks, export operational checklists | No automatic access to confidential financial/student data |
| Finance | Budget vs actual, approved commitments, cash receipts, vendor expenses, exceptions | Reconcile, review and export | Finance capability separately enforced |
| Viewer / board summary | Approved aggregate dashboards and reports | Filter/export only approved report views | No raw restricted student records |

**Personal dashboard settings:** store an account-scoped preference for widget visibility, order, favorite filters, start page, timezone and notification frequency. Safe defaults come from roles/assignment. Preferences must never bypass RLS or expose restricted totals. The user's role and active status come from trusted auth/profile sources, never self-edited client state.

## 5. Prioritized requirements register

Priority: **P0** = first useful operations release; **P1** = second release; **P2** = later or approval-dependent. Status **existing** means an underlying local prototype capability exists but may need expansion; **new** means the workflow is not implemented in the current prototype; **decision** means an authoritative business rule is missing. All rows are **proposed** until CBC approval.

| ID | Priority | Capability and acceptance test | Current basis |
|---|---|---|---|
| PERS-01 | P0 | Display signed-in person's name, assigned tasks/events/relationships and role-appropriate actions; switching user changes visible context | Partial: auth and my-task filter |
| PERS-02 | P0 | Let each person hide/reorder allowed widgets and persist preferences across sessions; revoke access and widgets no longer reveal protected data | New |
| CAL-01 | P0 | Shared organizational calendar showing approved meetings, events, due dates and program milestones; filters by team/pillar/owner | New |
| CAL-02 | P0 | Personal calendar and task view for items assigned/invited to current user, with timezone-safe dates in America/Edmonton | New |
| NOTE-01 | P0 | Meeting record with date, attendees, linked contact/org/event, purpose, decisions and actions with owners/due dates | Extend activities |
| NOTE-02 | P0 | Edit notes with attribution and history; an action created from notes appears once on the owner dashboard | Extend activities, new history |
| EVT-01 | P0 | Create an event with series/category/pillar, start/end, timezone, coordinator, location, venue, state, capacity and publishing source | New |
| EVT-02 | P0 | Compare venue options: quoted fixed cost, per-person cost, catering/AV/taxes/fees, accessible capacity, deposit terms and decision | New |
| EVT-03 | P0 | Distinguish capacity from ticket allocation, active registrations, invitations, waitlisted, cancellations and confirmed check-ins | New |
| EVT-04 | P0 | Offer **CBC-hosted public event page and registration form**, free/complimentary ticket types, capacity-safe inventory, confirmation and unique tickets; any legacy Eventbrite CSV is optional one-time migration only | New |
| EVT-05 | P0 | Enable authorized manual/QR check-in with duplicate-scan protection, timestamp, ticket type and undo with audit reason | New |
| EVT-06 | P0 | Show capacity risk, actual attendance/no-show, ticket type and walk-in counts; no-show excludes cancelled/invalid tickets | New; definitions to confirm |
| EVT-07 | P0 | Event closeout links cost lines, sponsorship benefits, attendance totals, note summaries and required follow-ups | New |
| SPN-01 | P0 | Sponsor detail joins contacts, interests, engagements, linked events/programs, commitments, receipts and future renewal dates | Extend existing |
| SPN-02 | P0 | Record promised sponsor benefit with owner, due date, contract source, linked event, fulfillment evidence, status | New |
| SPN-03 | P0 | Flag overdue deliverables and renewal windows without assuming every sponsor has identical packages | New |
| BUD-01 | P0 | Event budget tracks planned, approved, committed and actual costs separately, with distinct vendor quote/expense statuses | New |
| BUD-02 | P0 | View event cost by venue and capacity scenario, with explicit assumptions; never silently treat estimates as actual | New |
| BUD-03 | P0 | Show sponsor funding, ticket income and event expenditure as separate components, using existing exact CAD cash logic where applicable | Extend giving + new expense model |
| SUR-01 | P1 | Publish event-specific survey, provide QR/link, and record anonymous/identified responses based on consent | New |
| SUR-02 | P1 | Calculate response counts and approved summary measures; keep free-text answers restricted and prevent accidental identification in small groups | New |
| AUTO-01 | P1 | Admin/coordinator can set approved reminder and post-event follow-up templates, test/schedule sends, and review delivery outcomes | New |
| AUTO-02 | P1 | Messages respect opt-in, suppression, unsubscribe, deduplication, rate limits and send approval; no silent bulk mail | New |
| MEM-01 | P1 | Link membership terms to eligible speaker-series/event benefits only after terms, price and rules are confirmed | Extend membership; decision |
| MEM-02 | P1 | Show attendance history and renewal context with sourced event check-ins, not inferred registration or engagement score | Extend membership; new event links |
| SCH-01 | P1 | Manage named scholarship programs, award cycles, partner/donor links and externally confirmed awards | Extend programs/recipients; new award ledger |
| SCH-02 | P1 | Separate nominated, selected, awarded, paid/confirmed by fund administrator and publicized states | New; approval model |
| MEN-01 | P1 | Connect mentorship pairing to scheduled meetings, check-in completion and follow-up with restricted notes | Extend mentorship |
| IMP-01 | P1 | Manage Impact initiative with focus area, institution/partner, owner, three-year milestones, activities, deliverables, evidence and outcomes | New |
| IMP-02 | P1 | Require definition, period, source and reviewer for any reported impact outcome; unknowns are not zeros | New; approval needed |
| RPT-01 | P1 | Filter reports by date, event series, sponsor, pillar and owner; export only authorized rows with definitions included | Extend reports |
| CBAA-01 | P2 | Manage CBAA nomination cycle, categories, nominees, reviewers, honorees, judging privacy and event tables | New; specialized governance |
| INT-01 | P2 | Google Calendar integration with named source-of-truth, synchronization/duplicate rules and account permission boundaries | New |
| INT-02 | P2 | Approved document storage, versioning and access logging; existing metadata alone is not uploaded content | Extend documents |
| GOV-01 | P0 gate | Before real participant data, approve least-privilege security, student/minor data handling, consent, retention, incident response and export controls | Existing proposed matrix; not approved |
| GOV-02 | P0 gate | Before deployment, approve production ownership, data controller, support, backups, migrations, hosted config and source-document publication | Open repository decisions |

## 6. End-to-end operating workflows

### WF-01: Speaker series and other events

**Actor:** Fellowship director or program coordinator.  
**Trigger:** Approved idea or recurring series date.

1. Create a series (e.g. Monthly Speaker Series) or one-off event (e.g. a dinner or gala); link pillar, sponsor, coordinator and series year.
2. Record tentative dates and venue options. Compare seating limits, fixed fee, per-head minimum, catering, AV, deposit, tax/fees and availability. Mark quote expiry and approval.
3. Select approved venue and capacity. Separate total safety capacity from saleable seats, held sponsor seats, accessible seating, staff/volunteer spots and public allocation; do not over-sell beyond approved rules.
4. Set event budget, native free/complimentary ticket categories and sponsor commitments. Paid-ticket charging is a separate approval gate requiring a compliant payment processor.
5. Publish an accessible CBC-owned event page and open native registration. Create orders/admissions atomically; send only locally recorded confirmation previews until email sending is approved. Optional legacy CSV import is migration-only, idempotent and reviewable.
6. Show active registrations vs usable capacity, waitlist, expected turnout and outstanding tasks. Attendance forecast is an estimate with method/period displayed; it must not automatically change ticket allocations.
7. Check in valid attendees using the source registration/ticket identifier or authorized manual entry. Duplicate scans do not create duplicate attendees. Support walk-in and correction flow.
8. Close event; freeze an auditable attendance snapshot, reconcile costs, issue survey links, create approved follow-up tasks and mark sponsor benefits delivered with evidence.
9. Produce event closeout: registration/ticket count, unique check-ins, no-shows, venue comparison, approved cost, actual cost, sponsor obligations and follow-up status.

**Exceptions:** cancelled event, postponed event, late registrations, no internet during check-in, volunteers/staff, transfers, multi-ticket purchases, waitlisted guests, missing check-in file, refunds, sponsor-reserved seats, inaccessible venue capacity. Do not label an event as finished when closeout reconciliation is pending.

**Acceptance demonstration:** Create a fictional speaker event with 80 registrations, 52 check-ins, 100 saleable seats and two competing venue quotes. Show a 35% no-show rate under the provisional unique-valid-admission rule, remaining saleable capacity, vendor selection, survey draft and sponsor benefit linked to the event. Change cancellations and verify the denominator changes appropriately.

### WF-02: Sponsorship relationship to delivery and renewal

**Actor:** Relationship owner / finance / leadership.

1. Create or reuse one organization and associated contacts.
2. Record meeting, sponsor interests, next action and opportunity.
3. Attach an approved agreement reference and exact monetary or in-kind commitment; do not create cash received from a pledge.
4. Register separate cash receipts through approved finance role; retain receipt correction/void semantics.
5. Add sponsor-benefit obligations: event access, speaker participation, branding, acknowledgment, materials, etc. Each has due date, owner, contract reference and evidence.
6. Link benefits to events/programs and track pending, in progress, fulfilled, waived or at risk with reason.
7. Show sponsor's view of cash received, outstanding committed cash, verified benefits delivered, expiring agreement and required relationship follow-up.
8. Prepare review/renewal record based on actual deliveries and approved impact evidence.

**Exceptions:** cancelled commitment, in-kind support, funding restricted to another entity, one sponsor supporting multiple pillars, a third-party receipting organization, contract amendment, unfulfilled benefit. Never merge support types into one fabricated total.

**Acceptance:** Finance records one partial payment; relationship owner sees the payment read-only, marks one benefit complete and one at risk; executive view lists upcoming obligations without exposing confidential attachment contents.

### WF-03: Shared meetings, decisions, calendar and personal work

**Actor:** Staff member / coordinator.

1. Schedule a personal or team meeting with a subject, attendees, record links and local time.
2. Add notes and decisions (who decided, when, what evidence/source) to the meeting.
3. Convert action items to tasks with one owner, due date and status; add followers/watchers only if approved.
4. Show the task on the assignee's dashboard and due-date calendar; keep the original meeting link.
5. Send reminders only through approved notification channels/templates; show sent/failed/cancelled status.
6. Complete/reopen a task; retain decision and edit history.

**Exceptions:** recurring meeting updates, organizer leaves, attendee not in CRM, confidential agenda, time zone/DST, duplicate invite, cancellation, revoked access.

### WF-04: Event survey and post-event outreach

**Actor:** Event coordinator.

1. Create a small versioned survey attached to an event with a privacy notice and response setting (anonymous or identified).
2. Generate a stable event-specific QR code/URL; allow response on mobile without requiring a CBC staff account.
3. Validate response once per approved respondent policy without tracking unnecessarily; permit optional free text and consent.
4. Report responses received against an approved denominator, including unknown/partial cases. Do not use small groups to reveal respondents.
5. Review summary before sending sponsors or using testimonials. Testimonials and contact permissions require separate consent.
6. Optionally schedule an approved thank-you or next-event invitation, respecting email preferences.

**Acceptance:** Scan QR from phone, submit anonymous answer, see updated count without identifying the respondent; disabled/revoked survey stops accepting new responses.

### WF-05: Budget planning and venue cost management

**Actor:** Coordinator and Finance.

1. Select event/program/annual budget period and owner.
2. Enter forecast lines by category, vendor/venue, quantity, unit cost, tax and contingency. Every amount has CAD currency, source and estimate/actual label.
3. Compare venue A/B with fixed and per-attendee charges, minimum spend, deposits and capacity. Store scenario assumptions and quote date.
4. Submit for approval. Approval has reviewer, timestamp and frozen version; revisions create a new version rather than overwriting prior approval.
5. Record contractual commitments/purchase orders and actual eligible expenses separately; attach secure references.
6. Reconcile actual spend and ticket/cash receipts to approved budget, including event net cash position and source.
7. Show over-budget variance and who must act; do not invent value of unpaid pledges or in-kind donations as cash income.

**Acceptance:** A quote change adjusts forecast but not recorded actual; all values retain cents; event cancellation does not erase committed non-refundable costs.

### WF-06: Scholarship funding and confirmed awards

**Actor:** Scholarship lead, approved reviewer, finance liaison.

1. Define named award and award cycle with donor relationship and external award administrator.
2. Log funding commitment separately from Calgary Foundation-administered holdings and actual receipts controlled by the correct organization.
3. Record applications only after legal/privacy and data-controller approval; until then use aggregate or reference metadata, not full student files.
4. Capture selection/award confirmation from the authorized administrator and award date, value, cohort and source evidence.
5. Record external disbursement confirmation separately from CBC cash, if available and approved.
6. Produce number and value of **confirmed awards** by year; only publish recipient names with approved permissions and verified source.
7. Allow follow-up/outcome records if the recipient consent and purpose support them.

**Acceptance:** A committed fund amount does not appear as a paid scholarship; one recipient with two awards is one person but two award records.

### WF-07: Mentorship program

**Actor:** Mentorship lead.

1. Open application cycle; track mentor availability and mentee intake with explicit permissions.
2. Approve pairing through a human review. Avoid name-based auto-matching or public profile exposure.
3. Set program/cohort, agreed cadence and meetings (the public site cites 2–4 mentor hours per month as a guideline).
4. Log completed check-ins, private feedback and assigned next actions with separate privacy classifications.
5. Alert program owner about missed follow-ups without exposing safeguarding details to general staff.
6. Close pair and capture reviewed outcome summary without inventing a Pair Health score.

### WF-08: Impact initiatives and evidence

**Actor:** Impact director.

1. Create initiative with strategic focus (healthcare, education, community safety, civic/economic representation, etc.), multi-year timeframe, owner and institutional partners.
2. Create outcomes with explicit definitions and measurable milestones.
3. Record activities (meetings, workshops, consultations), outputs (resources delivered, agreements produced) and outcomes (verified adoption/change) separately.
4. Link evidence to each milestone, including source, observation date, institution and reviewer approval.
5. Track milestone state and blocker. Unknown result is not zero/complete.
6. Publish only approved, aggregated narratives; preserve distinction between CBC contribution and externally attributable change.

**Concrete first template:** Education Equity plan: institutions engaged, curriculum/resource proposals, educator training, adoption/approval evidence, responsible partner and three-year milestones. Avoid claiming curriculum adoption solely because a meeting occurred.

### WF-09: CBAA awards and gala (later)

Use an awards cycle with nominations, consent, eligibility, judging roles, conflict-of-interest tracking, final honoree approvals, sponsors, seating/tables, event costs and communications. Keep nomination/judging information restricted and distinct from scholarship selection. The public awards page currently references a June 25, 2027 return; verify in the events calendar before importing as authoritative.

## 7. Proposed KPI dictionary — owner approval required

The system should carry a formula version, reporting period, source, included/excluded states, data-quality notice and reviewer for each metric.

| Metric | Proposed formula / rule | Approval needed |
|---|---|---|
| Active registrations | Sum of valid, not cancelled/refunded/void admissions for the event; distinguish ticket quantity from distinct purchasers | Ticket transfer, complimentary and capacity rules |
| Available public seats | Approved public ticket allocation minus active public admissions; show held/sponsor/accessible seats separately | Capacity reservation and release rules |
| Attendees | Distinct valid admissions checked in for event/session | Multiple sessions, companion tickets, walk-ins |
| No-show rate | (eligible admissions minus those checked in) / eligible admissions, only after close; show numerator and denominator | Registrant-vs-ticket denominator, grace period and transfers |
| Attendance rate | Checked-in eligible admissions / eligible admissions | Same denominator rules |
| Survey response rate | Valid responses / eligible invited population | Anonymous distribution denominator may be unknown |
| Event budget variance | Actual eligible expenditure minus approved budget; include period and scope | Accrual, tax treatment, refunds |
| Venue cost per attendee | Relevant actual venue cost / verified actual attendees, when denominator > 0 | Venue-only vs full-event cost |
| Event net cash | Actual eligible cash revenue minus actual eligible cash costs; separately show pledges and in-kind | Source-of-truth, settlement and reporting period |
| Sponsor fulfillment | Approved completed benefits / due benefits, with waived/excluded states explicit | Benefit weights, evidence and contractual terms |
| Sponsor outstanding cash | Reuse approved giving logic for committed/invoiced cash minus nonvoid receipts; do not count in-kind as cash | Production finance policy |
| Scholarships awarded | Number of individually confirmed awards in period; distinct recipient count is separate | Award authority, cycle, effective date |
| Scholarship funds disbursed | Confirmed administrator disbursements only, explicitly classified as third-party if applicable | External reconciliation rights |
| Mentorship engagement | Actual completed check-ins and schedule adherence, no inferred health/satisfaction score | Approved cadence and data scope |
| Impact outcomes | Count of independently reviewed, evidenced milestones within a defined reporting period | Source quality and attribution policy |

Keep **missing**, **pending approval**, **query unavailable**, **not applicable**, **zero**, and **estimate** visibly distinct. Do not import public-site historical totals as authoritative operational values until reconciled.

## 8. Data and integration design sketch (proposal only)

### Reuse the existing identities and rules

Retain existing `organizations`, `contacts`, `profiles`, `activities`, `tasks`/follow-ups, `opportunities`, `contributions`, `cash_receipts`, programs/cohorts/recipients/enrollments, memberships, mentorship pairs/check-ins, documents metadata and reports. Reuse documented exact-CAD semantics and RLS. Do not replace the working model or create competing totals.

### Candidate additive entities

| New entity | Key fields / links | Key invariant |
|---|---|---|
| `event_series` | id, name, pillar, coordinator, season, external_source | Series does not imply a ticket sale |
| `events` | id, series_id?, type, start/end, zone, venue_id?, status, capacity settings, owner | Dates and status changes are audited |
| `venues` and `venue_quotes` | name, location, quote version, capacity, fixed/per-person cost, deposit, expiry | Quote is not invoice/actual |
| `event_ticket_types`, `event_admissions` | event_id, source_system, source_event_id, source_ticket_id, holder reference?, quantity/state, import status | Unique external IDs; cancellation history retained |
| `event_checkins` | admission_id?, event_id, timestamp, actor, channel, correction reason | No duplicate active check-in per eligible admission/session |
| `event_survey_forms`, `event_survey_responses` | event_id, form/version, response mode, consent, response metadata | Anonymous responses cannot silently map to person |
| `sponsorship_benefits` | sponsor/org, agreement ref, event/program, description, owner, due, status, evidence ref | No benefit inferred from donation amount |
| `meeting_records`, `meeting_attendees` | activity link, participant, decision, classification | Notes remain under record access controls |
| `calendar_items`, `calendar_attendees` | item type/linked record, start/end, zone, external IDs, visibility | Personal visibility not equivalent to record access |
| `budgets`, `budget_versions`, `budget_lines` | period, cost centre, event/program, approval, amount/source | Approved version is immutable |
| `vendors`, `expense_records` | payee, category, event/program, invoice reference, due/paid, approved amount | Expenses never mixed with giving receipts |
| `award_programs`, `award_cycles`, `award_records` | recipient, donor, cycle, review status, confirmed amount, administrator | Awarded != paid != CBC cash |
| `impact_initiatives`, `impact_milestones`, `impact_evidence` | pillar/focus, org partner, owner, activity/output/outcome, reviewer and source | Unverified impact is never reported as achieved |
| `user_dashboard_preferences` | profile ID, schema version, widgets, order, default scope | Self-only writes and permission intersection |
| `integration_connections`, `sync_runs` | provider, tenant/event, cursor, status, errors | No external secret stored in client-visible rows |
| `notification_templates`, `message_jobs`, `communication_consent` | approved version, channel, recipient, status, reason | No send without authorization and consent decision |

These are candidates, not an instruction to create all tables or run migrations now. Avoid unnecessary new profile identities and generic polymorphic IDs without referential checks. Document event-source ownership before choosing one-way or two-way sync.

### Integration priorities

1. **Native registration and ticketing (CBC owns the authority)**: Event pages, custom fields, orders/admissions, inventory, waitlist, QR codes, check-in, cancellations and reports live in CBC's own system. Do not call Eventbrite APIs or rely on Eventbrite as an operational source. Optional Eventbrite CSV files may be migrated later after CBC approval, with source identifiers and explicit deduplication. Card payments require a separately approved compliant processor; do not store card numbers. Never claim real-time sync until proven.
2. **Calendars**: Start internal calendar over native event/task records. Later, evaluate Google Workspace sync with consent, OAuth/organization approvals, per-user scopes, retry and duplicate policies.
3. **Surveys**: First-party mobile survey/QR can be a standalone secure module; consider existing survey tools only if CBC already uses them. Do not leak form responses into analytics vendors by default.
4. **Email**: Transactional reminders and approved templates only. Check Google Workspace sending limitations and deliverability before choosing sender. Audit recipient authorization, bounce/suppression and unsubscribe.
5. **Scholarship administrator**: Prefer approved manual reference/aggregate import before any student-level direct integration.
6. **Accounting/expense systems**: Keep financial source of truth and approval boundaries explicit; no shadow ledger portrayed as audited accounts.

## 9. Interface / navigation proposal

- **Home**: My work, upcoming meetings, assigned sponsor obligations, upcoming events, recent linked records; switch to approved team view.
- **Calendar**: My calendar / Team calendar; filter events, meetings and task deadlines.
- **Relationships**: Organizations, People, Sponsor pipeline, Sponsorship benefits, Interactions.
- **Events**: Upcoming, Series, Venue & budget, Registrations, Check-in, Surveys, Closeout.
- **Programs**: Scholarships, Mentorship, Fellowship, Impact initiatives, CBAA.
- **Operations**: Tasks, Meeting notes, Budget planning, Communications.
- **Reports**: Events & attendance, Sponsorship performance, Financial overview, Membership, Pillar delivery & impact, Executive.
- **Settings**: Dashboard preferences, account/permissions, notification choices; authorized admins may later see integration management.

Use one stable navigation system with optional workspace shortcuts. Do not hide the existence of a module solely because it is unassigned; instead show only routes and records the user is allowed to access. Every count links to its correct filtered source. Mobile event check-in needs a genuinely usable one-handed UI, large controls, clear feedback and weak-network handling.

## 10. Privacy, security and operational controls

- Public GitHub repo: synthetic fixture data only. Do not commit sponsor agreements, attendees, contact exports, student applications, meeting minutes, financial documents, secrets, QR response identifiers, screenshots with real records or videos/transcripts without permission.
- **Production gate:** CBC approves data purposes, access model, real-student data handling (including minors), consent and retention; consult appropriate privacy/security advisers on applicable Canadian/Alberta rules. No implied legal compliance from using Supabase.
- Use row-level and field-level authorization appropriate to program assignments. Do not equate workspace choice with permission. Approved aggregated Board views must not expose raw restricted records.
- Record who created, edited, confirmed, voided or approved significant operations; preserve audit history for check-in corrections, expense approvals, award confirmation, and outbound email.
- Export is a separate capability from read, with sensitive-data checks and short-lived links. Survey response exports require an approved purpose.
- Notification and survey flows have explicit consent/suppression and unsubscribed handling; student and sponsor communication rules may differ.
- Rate-limit unauthenticated QR survey endpoints, add anti-abuse controls, and keep identifiers unguessable. A QR code must not expose guest data or authorize record access by itself.
- Multi-tenant risks: although this is one CBC workspace, never trust user-provided organization IDs or client-side scopes. All server/database actions validate.
- Robustness: idempotent imports, retry-safe webhooks, duplicated event/source ticket handling, timezone/DST, pagination, error vs empty, stale quote dates, and backup/restore paths.
- Accessibility: mobile, keyboard, screen-reader semantics, contrast and privacy-aware printing/export need manual acceptance.
- No unattended production sends, destructive data resets, financial actions, hosted migrations or policy widening without explicit authorized approval.

## 11. Recommended delivery sequence and gates

**Release A — useful daily operations (P0):** role/assignment-aware personalized homepage; personal/team calendar; linked meeting notes and actions; **CBC-owned event publishing, free ticket registration, inventory and QR check-in**; event venue/capacity/budget; an improved sponsor pipeline and benefit ledger; simple event closeout. Optional CSV import is not the primary registration route. Use local fictional data. Build a thin end-to-end flow, not isolated pretty modules.

**Release B — engagement and reporting (P1):** QR survey and protected aggregate results; approved follow-up/reminder automation; membership/event participation; scholarship confirmed award records; mentorship scheduling; impact milestone/evidence workflows; expanded reports; optional ticket payment setup only if an approved merchant provider exists.

**Release C — specialized and external (P2):** CBAA nomination/judging/table workflow, deeper calendar and provider integration, stronger document workflows, finance connectors, advanced analyses only with approved definitions.

**Release gates:** (1) CBC user-owner review of each workflow, (2) privacy/security role decision, (3) separate source-system access approval, (4) tested fake-data demonstrations, (5) operator-approved deployment/recovery plan, (6) explicit production acceptance. Do not treat the existing 133/133 field presentation audit as coverage for these new requirements.

## 12. Executable test / acceptance walkthroughs

**T1 Staff personalization:** sign in as two synthetic users with different assignments and roles; Home widgets and worklists differ. Reorder widgets; preferences survive sign-out/sign-in. Direct URL/API/CSV cannot bypass role restrictions.

**T2 Event registration and no-show:** create fictional event; select venue; set 100 approved public seats; register 80 valid admissions through CBC-owned public forms; cancel 10; check in 52 of the remaining 70; after close show exactly 18 eligible no-shows and 25.7% provisional no-show. Keep purchaser/order/admission/person counts distinct. Race two concurrent registrations for the last seat: only one can succeed.

**T3 Check-in:** first ticket scan succeeds; repeat scan is clearly flagged, not added. A documented correction reopens the admission and records actor/time/reason. A disabled/nonexistent ticket fails safely.

**T4 Venue planning:** create two quotes with different fixed/per-head costs; switch forecast attendance; venue forecasts update, approved versions and actual expense amounts do not.

**T5 Sponsor lifecycle:** one sponsor funds two events; one commitment has partial cash received and two benefits, one fulfilled and one overdue. Executive dashboard shows correct outstanding amounts/benefits; Staff cannot modify receipts.

**T6 Meeting-to-calendar-to-task:** create meeting, log decision and assigned action; assignee sees it on their calendar and work queue, completes it and remains linked to original contact/sponsor.

**T7 Survey:** anonymous QR survey works on mobile; counts update without linking identity; opt-out/suppression respected; export denied for roles without permission.

**T8 Scholarships:** approved award recorded as externally administered; it increments confirmed award totals but does not increase CBC bank cash or mark disbursement without evidence.

**T9 Impact:** initiative with one meeting, one published resource and one *unapproved* adoption claim; reports show activity/output but not an achieved adoption outcome until approved evidence exists.

**T10 Security/degradation:** anonymous, inactive, Staff, Finance and Viewer role boundaries; sensitive student record denied; financial edits denied to Staff; query failure displays unavailable not zero; lost integration connectivity does not silently alter historical data.

## 13. Decision log to take back to CBC

Ranked from blockers to nice-to-haves:

| ID | Decision needed | Suggested owner |
|---|---|---|
| D01 | Confirm four pillars and whether Impact is a standalone pillar or cross-cutting function for reports | President + Impact director |
| D02 | Which operational users will demo/review each module; who accepts workflows for CBC? | President + coordinator |
| D03 | Which CBC-controlled domain will host native public event pages and registration? Are there prior Eventbrite rosters that require an optional CSV migration? | Event lead + website admin |
| D04 | What does "registered" mean: ticket quantity, named guest, household/group, or unique person? | Event lead |
| D05 | Which seats count in capacity: public, sponsors, staff, accessible/holds, walk-ins? | Event lead + venue |
| D06 | How are cancellations, transfers, no-shows and multi-session admissions handled? | Event lead |
| D07 | Which exact venue costs, approval thresholds and financial categories are used? Who approves? | Finance + coordinator |
| D08 | What does a Fellowship membership include: price, benefits, event admission rights, term and renewal? | Fellowship director |
| D09 | What are standard sponsor benefit packages, variable agreements and evidence of fulfillment? | Relationship owner + leadership |
| D10 | Which system is official for financial receipts, expenses, budgets and grants managed by other bodies? | Finance |
| D11 | Which types of notes can general Staff see? Who may see student and mentor feedback? | CBC governance/privacy lead |
| D12 | Calendar platform(s), account restrictions, invitation owner and bidirectional sync expectation? | Google Workspace admin + coordinator |
| D13 | Which follow-up emails are permitted, from which mailbox, under what consent/approval? | Communications + governance |
| D14 | Which existing surveys are used; should respondents be anonymous; what feedback may be shared with sponsors? | Event lead |
| D15 | Who confirms scholarships and disbursement, and what records can CBC legally hold? | Scholarship director + Calgary Foundation liaison |
| D16 | Who approves mentor pairing and confidential check-in/escalation access? | Mentorship director |
| D17 | Which impact outcomes are verified, over what period, using which source, and by whom? | Impact director |
| D18 | Is CBAA nomination/judging in immediate scope or after core event operations? | Awards lead |
| D19 | Confirm past totals, period/definitions and any discrepant public website copy before importing history | Leadership + comms |
| D20 | Confirm prototype, hosted release, repo publication, support, data protection and budget authority | CBC + instructor/project owner |

## 14. Sample documents needed (redacted or fictional only)

Request **one example each** before implementing fields and automations:
1. Sponsor agreement or benefit checklist (remove rates, parties, signatures and confidential details).
2. Actual event planning checklist and two anonymized venue quotes with cost structure.
3. Desired public registration form questions and ticket categories with fictional attendee rows, including cancellation and check-in examples; legacy Eventbrite CSV headers only if migration is needed.
4. One approved event financial report/budget template, with fictional amounts.
5. Survey questions and a sample follow-up email, with opt-in policy.
6. Meeting agenda/notes/action tracker (fictional).
7. Membership terms for speaker-series participants and ticket benefits.
8. Scholarship annual summary from an approved reporting source, not private application files.
9. Mentorship cadence/check-in template with no student names/notes.
10. Impact report showing what counts as evidence and who signs off.

## 15. Sources reviewed (public URLs, 2026-11-05)

- Impact: https://calgaryblackchambers.ca/impact/
- About: https://calgaryblackchambers.ca/about/
- Team: https://calgaryblackchambers.ca/team-2/
- Partners: https://calgaryblackchambers.ca/partners/
- Fellowship: https://calgaryblackchambers.ca/fellowship/
- Mentorship: https://calgaryblackchambers.ca/mentorship/
- Scholarships: https://calgaryblackchambers.ca/scholarship/
- Past recipients: https://calgaryblackchambers.ca/past-scholarship-recipients/
- CBAAs: https://calgaryblackchambers.ca/awards/
- Event URL supplied but not successfully accessed: https://calgaryblackchambers.ca/event/behind-the-game-emerging-leaders-fighting-for-the-starting-lineup/
- Videos supplied but content not verified: https://www.youtube.com/watch?v=wSX9chemyJU and https://www.youtube.com/watch?v=_D8z1KoBWpo
- Current repository audit/decisions: `README.md`, `docs/project/scope.md`, `docs/project/decisions.md`, `docs/architecture/access-matrix-proposal.md`, `docs/requirements/module-matrix.md` and `docs/audits/version3-engineering-remediation.md` on the parent branch.

**Public-site consistency items:** About/older Scholarship content sometimes speaks of three pillars; public Impact material supports a fourth area. Mentorship/Impact pages give different calendar wording for the 2026/27 intake. Awards page contains both old and new event announcements. Some public Impact content repeats Mentorship copy. Do not convert these inconsistencies into silent operational defaults.

---

### Notes for the next Codex work order

Before building, produce: (a) existing-code gap matrix referencing actual file/schema paths, (b) domain boundaries and an RLS-safe data migration proposal, (c) the smallest Release A vertical slice, (d) mock user walkthroughs and tests, and (e) decision gates. Do not implement all P0–P2 modules at once. Use a separate branch from latest verified reliable code, only fictional local data, no hosted changes or external email sends. Ask for CBC decisions where business rules cannot be safely inferred.
