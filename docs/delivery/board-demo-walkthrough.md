# Synthetic board walkthrough — REQ-001/002/003/004/005/006/008/009/010/011/012/013/014

Use only the isolated local Supabase stack. No hosted resources or real CBC records are authorized. Automated browser scenarios exercise these workflows; a human CBC board walkthrough and named sign-off remain separate and unchecked.

## Launch

From the repository root:

```sh
node scripts/demo/stack.mjs start
node scripts/demo/stack.mjs migrate
node scripts/demo/seed.mjs
# Optional for an older local test database with generic fixture labels:
node scripts/demo/refresh-fictional-labels.mjs
node scripts/demo/run.mjs
```

Open **http://localhost:3140/login**. Generated accounts and passwords are in the ignored, mode-600 **`.local/cbc-demo/accounts.json`**, within a mode-700 directory. Select the `admin` account locally; never paste passwords into chat, documentation or a public artifact. Staff, Finance and Viewer accounts are in that same file. Browser automation uses `127.0.0.1:3140` with the same stack; keep cookie domains consistent in a manual session. Seeding is repeatable; browser tests create additional synthetic records, so global totals can increase after tests. Use named seed records and scoped reports to reproduce exact examples.

## Sequence and expected behavior

1. **Administrator login:** sign in with the locally generated Admin account. Show Settings identity/role and sign-out. Role management/password changes are explicitly unavailable.
2. **Executive dashboard:** open `/dashboard`. Show organization/contact counts and relationship statuses, recent interactions, Action Queue, financial summary, Sponsor Interests, program/enrollment identities, membership date status and upcoming renewals, mentorship pair/check-in activity. Open the linked directories/reports. An unavailable panel indicates a query error; it must never be described as zero.
3. **Organizations/contacts:** open Prairie Lantern Ventures and Amara Okafor. Edit notes; create an explicitly synthetic contact if desired. Demonstrate affiliated primary contact and restricted inherited ownership. Admin can assign active Staff; Finance/Viewer cannot change ownership.
4. **Interaction/follow-up:** record a Meeting with explicit organization and participants; create a due action, complete it and reopen it. Show overdue versus upcoming Calgary dates and the contact/organization history. Future meetings do not advance Last Contact.
5. **Sponsorship/receipt:** use Admin or Finance to create a CAD Cash commitment and record a partial receipt. Show outstanding separately from receipt-based cash; void a synthetic correction with a reason. An unpaid pledge never becomes cash revenue. In-kind stays separate.
6. **Interests/alignment:** open the seeded interest; demonstrate organization-bound contact/opportunity, explicit Program alignment, discussion links and next linked action. Opportunity estimates do not enter Giving totals. Archive/restore requires Admin.
7. **Programs/cohorts/recipients:** open Horizon Scholars Program. The named seed program has two distinct recipient identities, three enrollments, declared support **CAD 1,500.30**, two known amounts and one unknown. Repeated cohorts do not duplicate participant count. Add/edit synthetic recipient/enrollment and demonstrate rejection of an incompatible cohort. Show manual outcomes and person-wide alumni cash; no graduation/alignment rate is inferred.
8. **Membership lifecycle:** open `/membership`. Amara Okafor has an overdue recorded term and a current term renewing in 20 days; the corporate seed starts tomorrow and has an unknown fee/renewal. Create/edit a term, search, open history and the next-30-day view. Show contact versus organization identity, optional explicit affiliation, manual fee/payment label, inherited owner and source participation/interaction history. Status is provisional and independent of payment; no automatic renewal occurs.
9. **Mentorship:** open seeded mentor/mentee pair. Show shared organization/program/cohort, manual status/cadence, start/end dates, issues and next action/due date. Record a nonfuture completed check-in with raw feedback; edit it. Last Check-In and completed count reflect recorded check-ins; latest feedback uses date descending then UUID ascending. Pair Health stays Definition pending. Try an incompatible cohort and correct the form without losing entries.
10. **Document metadata:** open `/documents`; create/edit a synthetic metadata record with type, explicit source links, version, dates and classification. Explain that creator/registration/update timestamps describe metadata. No binary file was uploaded. Staff/Finance/Viewer cannot read Admin-only metadata; no public bucket exists.
11. **Six reports:** visit Executive Performance, Sponsor Relationship, Scholarship Impact, Mentorship, Membership and Financial Performance. Apply organization/program/cohort/status/search filters where relevant. Follow source records and download the supported filtered CSV. Invalid scope or query failure withholds totals/export; successful empty scope is explicit. Financial CSV exports selected-period nonvoid receipts; Sponsor CSV exports agreement dates; operational CSV exports displayed rows.
12. **Financial/impact reconciliation:** use Financial year/organization filters and compare the receipt ledger to selected-period cash. All-time pledged/outstanding are current balances, not historical year-end values. Program support is declared enrollment support, not cash disbursement. Membership fees and opportunity estimates do not inflate revenue. Explain unknown support and all pending rates/scores.

Repeat reader checks as Finance and Viewer. Staff may edit operational records but cannot record cash receipts. Anonymous/inactive users are denied. Automated coverage is in `tests/integration-browser`, `scripts/demo/verify-*.mjs` and SQL assertions; exact executed counts are in [progress](progress.md).

## Deferred and acceptance

No binary files, public hosting, real records, imports, production account administration, immutable audit ledger, automatic renewal/payment collection, refunds/accounting reconciliation, approved retention/growth/health/risk/alignment/ROI formulas or event attendance workflow. Pending displays are not completed calculations. Record reviewer, date, commit, environment, observed results and named CBC acceptance in the demo checklist before claiming board approval.
