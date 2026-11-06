# Codex work order: CBC-owned CRM + native events platform

**Created:** 2026-11-05  
**Repo:** https://github.com/jokwkuon/cbcprototype  
**Planning branch:** \`feature/cbc-operations-discovery-2026-11-05\`  
**Source of truth:** \`docs/product/cbc-operations-platform-requirements-2026-11-05.md\` (its scope correction supersedes any legacy Eventbrite integration language)  
**Build branch:** create \`feature/cbc-native-crm-events-v1\` from planning branch, unless the name already exists; never overwrite another contributor's work.  
**Instruction:** Execute, not just suggest. Build working code, migrations, synthetic fixtures, tests, and walkthrough evidence in small coherent commits. Do not merge or deploy the app without approval.

## 0. Mission and definition of done

Build CBC's **own** internal and public-facing platform using the existing Next.js 16/Supabase/PostgreSQL codebase.

The target is **HubSpot-like CRM functionality** tailored to nonprofit sponsorships plus **Eventbrite-like event management functionality** native to CBC's app. **No HubSpot or Eventbrite API calls are needed or desired.** Neither vendor is a source of truth for new workflows. Optional legacy CSV import is a later migration exercise and not a blocker.

A real, tested vertical slice should work locally:

1. Staff logs in and sees their own work.
2. Staff creates an organization, contact, and sponsorship opportunity, moves it through an explicit pipeline, logs a meeting, and assigns a follow-up.
3. Staff creates and publishes a CBC-owned speaker-series event, selects a venue, sets capacity/ticket types, and sees its public event page.
4. A fictional visitor registers for a **free/complimentary** ticket through that public page. The system creates an order, one or more individual admissions, and unique opaque QR ticket code(s) with a confirmation page. Registration lives entirely in CBC's database.
5. Staff checks tickets in on a phone-size screen. Scanning twice does not add attendance twice. Cancellation/transfer rules and sold-out/last-seat concurrency are correct.
6. Staff associates a sponsor benefit with that event and marks fulfillment against evidence.
7. Leadership sees accurate registrations vs actual attendance vs no-shows, capacity, financial commitments vs receipts, sponsor deliverables, and assigned next steps.
8. Finance edits existing giving/receipt records only under existing finance authorization.
9. Staff can view their meetings/tasks and event milestones on their personal/team calendars, and account-specific dashboard preferences persist.
10. SQL/RLS, API, browser, validation, build, lint, and typecheck tests pass against isolated fictional local environments.

Build the slice in phases, with a green test checkpoint after each. No static-only mock buttons, disconnected cards, fake real-time feeds or falsely successful forms.

## 1. Mandatory read-only baseline inspection

Read before modifying code:

- \`README.md\`
- \`docs/product/cbc-operations-platform-requirements-2026-11-05.md\`
- \`docs/project/decisions.md\`, \`docs/project/scope.md\`
- \`docs/architecture/access-matrix-proposal.md\`, \`docs/architecture/release-and-recovery.md\`
- \`docs/audits/version3-engineering-remediation.md\`, \`docs/delivery/version3-reliability-verification.md\`
- \`database/migrations/*\`, \`database/hosted/README.md\`, \`database/tests/*\`
- \`apps/frontend/app/dashboard/page.tsx\`, \`components/navigation.ts\`, \`components/workspace.tsx\`, \`lib/crm-context.ts\`
- All relevant organization/contact/activities/giving/interests/membership/programs/reports pages/actions/libs
- \`scripts/schema/rehearse.mjs\`, \`scripts/schema/catalog.sql\`, \`scripts/demo/*\`, the existing Playwright suites and CI.

Verified baseline as of 2026-11-05:
- \`main\` still points at original scaffold commit \`64c74ab\`. Do **not** build from main.
- Latest reliable implementation commit \`7be47f4\` on \`feature/version3-reliability-operations\`; the planning branch is its descendant plus product spec.
- Next.js 16.4.3, React 19.3, Supabase JS 2.117.3, @supabase/ssr 0.12.7, Supabase CLI 2.120.0; use pinned lockfile and review new package compatibility.
- Current \`opportunities\` table only stores organization/name/manual estimate, **not a pipeline**; extend it carefully instead of creating a competing deal identity.
- \`contributions.event_id\` links to \`funding_initiatives(kind='Event')\`, not an operational event. Keep this invariant and make a stable **explicit mapping** between native events and funding event references, e.g. \`events.funding_initiative_id\` with a unique FK; never repoint existing columns blindly or duplicate money.
- Existing \`activities\` + \`tasks\` and \`cash_receipts\` contain working business logic; reuse them and preserve UTC/Calgary rules and exact CAD decimal math.
- Existing 24 public tables, ten \`security_invoker\` views and verified current RLS. All four roles: Admin, Staff, Finance, Viewer. Current broad access to programs/student content is **not approved for real data**.
- Hosted Supabase project \`cbcprototype\` (\`sywfyjaqzziyqhgulvjp\`) is **active, not empty**: 1 Auth user, 1 profile, 1 organization, 1 contact, and no hosted events. Do not inspect or publish confidential row values; do not delete, rename, reseed or overwrite them.
- Hosted currently has 14 migration versions vs 15 local canonical on latest reliability branch. Hosted catalog audit previously found 48 differences: 44 current-object service-role ACLs, three default-ACL differences, one unapplied local activity reader policy optimization; avoid blind replay or overwriting historical migrations.
- Hosted security advisor: leaked-password protection disabled; plan remediation/approval, do not claim production security. Unused indexes in a mostly empty database are not automatic drop candidates.
- Existing local tests: 36 frontend unit tests, 285 SQL/RLS assertions, 335 Auth/API checks, 55 real Supabase browser scenarios, 37 synthetic browser scenarios (latest documented reliable checkpoint). These are historical results to preserve/re-run, not automatic proof that the new work passes.

Produce \`docs/delivery/native-platform-baseline-and-gap.md\` with: exact commit, repo state, module/code paths, entity boundaries, hosted counts/drift, security warnings, and a list of what is already functioning vs proposed.

## 2. Product design: one identity graph, not two cloned apps

### Native sponsor CRM (HubSpot-like, nonprofit-specific)

Implement these in progressively useful order:
- Organization and contact profiles, roles/affiliations, tags or segments, recent activity and engagement history, ownership, duplicate-candidate suggestions (no automatic destructive merge).
- A **real sponsorship opportunity pipeline** on the existing \`opportunities\`: configurable reviewable stages (e.g. prospect/qualified/meeting/proposal/negotiation/committed/lost; provisional until CBC confirms), amount *estimate* distinct from financial commitment, owner, optional expected close date, sponsor contact, event/program interest, stage history, and required next step.
- Kanban/list views with drag/drop **and** accessible keyboard/list fallback; persist stage server-side after authorization, don't optimistically claim success.
- Sponsor agreements/benefits: owner, promised deliverable, event/program link, due date, source/document reference, status, completion evidence, overdue queue; reuse \`contributions\` and \`cash_receipts\` for commitment/actual money.
- Meeting notes/interaction timeline, follow-up tasks, due dates, reusable note templates, account assignment and renewal reminders.
- Saved filtered views, user dashboard widgets, actionable empty states and sponsor-specific reports.
- Internal activity/reminder rule engine with audit/outbox; no external email sending until sender, consent and deliverability approval.

Do not add vague AI deal scoring, send automated outreach, or calculate forecast probabilities without CBC-approved semantics. Basic stage and amount summaries must say they are estimates.

### Native event management (Eventbrite-like, CBC-specific)

Implement:
- Internal event builder and **CBC-owned public event details/registration page** (title, date/time, venue, description, optional speaker, event series, approved capacity, images with allowed provenance, status: draft/published/cancelled/completed, accessibility details).
- Recurring series support as a grouping record; individual events are separate identities with separate inventories.
- Free/complimentary ticket types: price field can exist but **paid online checkout is disabled** until a PCI-compliant payment processor/merchant and refund policy is explicitly approved. Do not implement or store raw card data or fabricate paid transactions. Approved offline collection later must be labeled as such.
- Public registration with attendee information minimization, privacy text, group order vs individual ticket/admission identity, validation, optional approved custom fields, consent and repeat-visit confirmation.
- Race-safe seat inventory: hold capacity and ticket-type allocation checked **transactionally** using row locks or equivalent DB invariant. Two people racing for the last ticket must result in at most one success. Set timeouts on abandoned holds if holds are implemented.
- Cancellation, sold out, waitlist and optional organizer-controlled waitlist promotion; prevent overselling and preserve status history. Draft, unpublished and cancelled events cannot take new registrations.
- Generate unique opaque high-entropy ticket QR links. A QR must not disclose attendee name/email or act as a record-read capability. Store token hash; check-in handler validates event, admission state, caller staff role and duplicates **atomically**, with audit of corrections and manual check-in fallback.
- Mobile-first organizer check-in (scanner if browser permission works, otherwise manual code lookup), show immediate success/already scanned/invalid/cancelled/connection error.
- Event organizer dashboard: active admissions vs ticket purchasers vs unique people vs checked-in admissions; complimentary/sponsor/staff seats separate; reported no-show denominator documented; capacity alerts and event closeout.
- Event/venue budgets and quote comparisons (fixed and per-person fees, taxes, deposit, capacity, attendance scenarios), approval/actual vs estimates, vendor line items. No assumption that a pledge is revenue.
- Event-specific QR survey (after first slice), anonymous/identified modes with explicit consent and no PII leakage in public analytics.
- Event-specific reminders/thank-you workflow **drafts and queued local outbox only** until a mail delivery provider and sender permission are approved.
- Member admission benefits are modeled as entitlements but only enforce actual rules after CBC confirms prices/terms.

A public registration system does NOT require visitor Supabase employee accounts. Keep staff Auth separate. Public routes/actions must be carefully scoped, rate-limited, abuse-resistant, and use server-only code or narrowly constrained invoker RPCs; never grant broad \`anon\` CRUD on internal contacts/events/tickets, and never expose privileged keys to the browser.

### Other CBC operations

- **Personal/team calendar:** read native scheduled events, meetings and task deadlines from their canonical records. Avoid duplicating due-date source of truth. Use \`America/Edmonton\` for display and date-only business rules; store instant timestamps correctly and test DST.
- **Four working pillars:** Scholarship, Mentorship, Fellowship, Impact. Link event/program/sponsor activities to one or more pillars with explicit classification. No invented impact outcomes.
- Scholarship funds may be Calgary Foundation-administered; don't treat awarded amounts as CBC bank receipts. Student records need separate capability permissions before live data.
- Reports should use source records, authorized sums and clearly marked unknown/error/partial states. Never double-count ticket prices, contributions and cash receipts.

## 3. Database: canonical additive migration sequence

Implement migration SQL **in the repository first**, with local reproducible tests before any hosted rollout. Use the project's current migration conventions/CLI. Preserve the original migration files and checksums.

Proposed normalized entities, refine after reading actual schema:

**CRM:** extend \`opportunities\` add lifecycle stage, assignee, contact, next step/expected close date and separate \`opportunity_stage_history\`; \`sponsorship_benefits\` with org/opportunity/contribution/event association, evidence and completion lifecycle; \`user_dashboard_preferences\` scoped to profile.

**Events:** \`event_series\`, \`venues\`, \`venue_quotes\`, \`events\` (optional unique FK to existing Event-kind \`funding_initiatives\`), \`event_ticket_types\`, \`event_orders\` (one purchaser or guest), \`event_admissions\` (one ticket/seat each), \`event_checkins\`, \`event_waitlist\` and event audit history. Choose one clear capacity invariant and one canonical ticket identity. Use exact money where needed. Document what happens to registrations when cancelling or moving an event.

**Budgets:** \`budgets\`, \`budget_versions\`, \`budget_lines\`, \`event_expenses\` (or consistent minimal design). Forecast, approved, committed, actual, refunded/void must not be conflated.

**Later:** \`event_survey_forms\`, \`event_survey_responses\`, \`notification_templates\`, \`notification_outbox\`, \`impact_initiatives\`, \`impact_milestones\`, \`impact_evidence\`, structured \`scholarship_awards\`, only if the slice is green and role policy approved.

Database requirements:
- UUID primary keys, enforce non-empty fields and sane state transitions; FKs and indexes on join/filter paths; unique constraints for attendee ticket/token, receipt association, event/funding-reference link, idempotency keys.
- Use PostgreSQL \`numeric\` exact cents for CAD; don't do JS floats for finance; zero/null/missing distinctions.
- No insecure profile display names as authorization. Keep auth role and account activation server authoritative.
- Every exposed table has explicit grants and RLS; default deny for new sensitive/public data. Staff/Finance/Viewer boundaries verified at DB and API layers. No invented student access policies.
- Any \`security_invoker\` views should enforce caller RLS. Avoid public security-definer functions and broad execute privileges; avoid client \`service_role\`.
- Use safe transactional server actions/RPC for multi-record registration/checkin and benefit state changes. Concurrency tests mandatory. Verify policy \`USING\` and \`WITH CHECK\`.
- Record meaningful mutation/audit actor, timestamp, state, reason with no unnecessary PII in logs.
- All migrations forward-only, reversible where practical, no drop/rewrite/reset of existing identities.

## 4. Work phases and implementation order

**A — foundation / local-only:**
1. Confirm checked-out branch and latest reference; create separate branch \`feature/cbc-native-crm-events-v1\` based on the planning branch.
2. Run existing tests and inspect docs/schema, write gap and security findings.
3. Design authoritative data relationships and migrations. Create canonical migrations, SQL/RLS/anti-abuse/concurrency tests and a deterministic **fictional-only local** seed with reserved addresses; no hosted writes.
4. Implement first working CRM pipeline enhancement and sponsor benefit record screens, with accurate links to contributions and activity history.

**B — complete native event slice:**
5. Build event/venue/ticket-type internal pages and native public registration route, mobile confirmation and QR ticket generator.
6. Implement atomic inventory, cancellation, waitlist (if needed), mobile staff check-in, safe correction and event reports.
7. Connect native event with sponsorship benefit, existing funding initiative references, and existing dashboard.
8. Add venue quotes/budget and event closeout, preserving financial semantics.
9. Build the end-to-end realistic fictional speaker series demonstration and use it for browser tests. Include sponsor organization/contact, sponsor deal and benefit, 100-capacity event, 80 admissions, 10 cancellations, 52 attendees, 18 no-shows, and accurate budget/receipt examples. Don't hardcode metrics or create fixture pollution.

**C — personalized operations:**
10. Personal dashboard widgets, permissions-scoped preferences, actionable home page and per-role defaults.
11. Personal/team calendar reusing canonical events, activities and tasks. Connected meeting notes to assigned follow-ups.
12. Reporting filters/CSV, reliable empty/error/unknown states, responsive navigation and keyboard accessibility.

**D — follow-up modules if A–C truly pass:**
13. Survey QR and protected anonymous response stats; internal local notification draft/outbox and consent controls; membership/event entitlement display only with confirmed rules; scholarship/mentorship/Impact reporting foundations. Do not misrepresent these as implemented until verified.
14. Ticket payment acceptance requires a separate explicit merchant/processor, refund and security decision. A native ticketing app can own checkout UX, but real card processing cannot be invented and must not be self-hosted.

At each phase, update docs with actual results and limitations. If the slice is large, favor one fully functioning user flow over ten unfinished pages. Continue within available access, but never conceal a blocker or invent evidence.

## 5. Hosted Supabase treatment — critical

Target: existing project \`cbcprototype\` / \`sywfyjaqzziyqhgulvjp\`. It has unknown-provenance existing records. The user wants the database filled out **with the software's proper schema and working data**; that does **not** mean permission to overwrite unknown records, copy CBC live data, or flood public production with fake attendees.

1. First perform **read-only** hosted preflight: list columns, constraints, policies, grants, views, migration history, row counts, auth count, and the 14-vs-15 migration drift. Report exact differences without printing confidential field values.
2. Use isolated local Supabase for migrations and full synthetic fixtures. Verify all role checks and schema reproducibility. Detect/unwind test fixture pollution, keep presentation and test isolated.
3. Prepare an explicit **hosted rollout plan** with ordered additive migrations, backup/recovery instructions, preflight exact-check predicates and postflight checks. Do not replay \`database/hosted/reconcile-version3.sql\`; it has already run.
4. Before applying to hosted, verify with CBC/project owner that it is an authorized development/staging target; confirm backup/recovery, classify existing records, reconcile permissions/default-ACL differences, and obtain explicit approval for hosted schema/data changes. If any gate is missing, **stop hosted writes only** and report precisely what is ready and what is blocked; keep local code implementation moving.
5. If all gates are met, run only reviewed additive migrations, verify post-application schema/policies/role boundaries, and record applied versions; **never** seed fictional records into a live or unknown-provenance tenant. Use a separately approved demo tenant or isolated local instance for sample data.
6. No new paid Supabase projects/branches, no edge-function deployment, real email sending, billing changes, profile/role updates or production data deletion without separate approval.

Hosted Supabase Auth has one existing user; do not create/reset or publish credentials, and do not assume remote login was browser-tested. Explicitly show hosted vs local readiness separately.

## 6. Acceptance suite (must execute, don't just author)

**Backend invariants:**
- Last seat: two concurrent registration attempts, only one succeeds. Registered count never exceeds approved allocation; include sponsor-reserved capacity and cancellations.
- One order with three tickets creates three separate valid admissions, not three purchasers. Repeated submit/idempotency key creates no duplicate order.
- QR ticket replay twice: first accepted, second already checked in; cancelled or unknown ticket rejected; correction audit preserved; raw ticket token absent from public logs and stored hash only.
- Event changed to draft/cancelled/finished cannot take new registration. Unauthorized write rejected via direct API and forged Server Action.
- No-show: 80 valid tickets, cancel ten, check in 52 of remaining 70 => 18 no-shows and 25.7% (rounded to one decimal). Clearly label exact eligible denominator and reporting period.
- Ticket sales, donations, pledges, receipts, event expenses, membership fees all remain financially distinct.
- Sponsor pipeline stage and benefit links survive contact edits and organization history; only Finance/Admin can mutate giving receipts. Deal estimate never turns into received cash.
- Revoked/inactive users cannot see cached protected data, CSV, event attendee lists, sponsor agreements or student details.
- Public registration validates malicious fields, spam/rate limits, duplicate submissions and unauthorized event IDs; anonymous cannot query internal attendee roster. Existing internal RLS remains intact.
- UTC/Calgary date and DST boundary; accessibility for mobile check-in and keyboard navigation.
- Export CSV is authorized and neutralizes spreadsheet formula injection; errors do not become zero counts.

**Run exactly available checks, then extend:**
- \`npm --prefix apps/frontend test\`, \`run typecheck\`, \`run lint\`, \`run build\`.
- Local database SQL verification and full \`scripts/demo/verify-*.mjs\` suites, including new ticketing/sponsorship tests.
- \`npm --prefix apps/frontend run test:e2e\` and \`run test:integration\` with isolated local Supabase, sequential as documented.
- \`node scripts/schema/rehearse.mjs\` or updated equivalent for canonical/reconciled schema drift and checksum validation.
- Security advisors (local and read-only hosted) and review for privilege/function/view exposure.
- Screenshots/Playwright evidence for desktop 1440x1000 and mobile 390x844: admin dashboard, pipeline, event builder, public event page, registration, QR confirmation, check-in, event budget/closeout, and role-denied states. Zero console/runtime errors and unintended horizontal body scrolling.
- One recorded user-focused walkthrough with actual clicks for a nontechnical CBC staff member, not only test counts.

Do not claim exact tests have passed until the command actually runs. If a test cannot run, say why and show alternatives used, if any.

## 7. UI acceptance: useful, not static

Use the existing CBC navy/purple/white design tokens, stronger typography and working components. Left nav proposal:
- Home
- Calendar
- Relationships: Organizations, Contacts, Sponsorship Pipeline, Interactions
- Sponsors: Commitments & Giving, Benefits, Renewals
- Events: Event List, Series, Venue & Budget, Registrations, Staff Check-in, Reports
- Programs: Scholarships, Mentorship, Fellowship, Impact
- Reports
- Settings / My Dashboard

Adapt role-specific shortcuts. The current app has a unified navigation in \`components/navigation.ts\` and account menu in \`components/workspace.tsx\`; extend rather than duplicate. Make event creation and registration forms efficient and coherent; show errors next to fields, retain selections and prevent silent partial saves. Every button must work. No dummy account values or false "sent" notifications.

## 8. Delivery report and stopping conditions

Commit meaningful increments on the feature branch. Do not merge. Finish with:

1. Exact branch/head SHA and changed file list.
2. Before/after capability matrix: complete / partial / gated / not started with actual routes and behaviors.
3. Canonical migration names, DB tables/constraints/RLS rules, local seed data counts.
4. Screenshots and precise end-to-end demo script including staff and public attendee views.
5. Test command/result table with totals, security evidence and known failures.
6. Hosted project preflight/rollout status, whether any hosted writes happened, existing records preserved, and exact approval blockers.
7. Remaining CBC business decisions, ranked, and the next small slice.
8. No ungrounded claim of production readiness, CBC acceptance or real payment/email delivery.

**Central rule:** Own the workflows and data inside the CBC app. Do not reconstruct HubSpot/Eventbrite integrations. Build the smallest end-to-end native CRM + event system that really works, then extend it safely.
