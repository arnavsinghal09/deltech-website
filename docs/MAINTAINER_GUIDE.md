# Maintainer Guide

This is the operating runbook for staff using the DelTech MUN admin console. The permanent in-product version lives at `/admin/guide`.

## Roles

### Maintainer

Maintainers run normal conference operations. They can:

- edit delegate details;
- create and update committees and portfolios;
- allot available portfolios;
- open or close registration;
- parse and commit cross-delegation imports;
- score recruitment rounds;
- moderate blog posts and operate quizzes;
- create and update team members;
- edit non-payment conference content.

Maintainers cannot perform the highest-risk actions. An admin is required to:

- delete records;
- revoke an allotment;
- mark a delegate paid offline, comp a fee, or cancel a delegate;
- change payment routing;
- change staff roles or users.

### Admin

Admins can perform all maintainer work plus the guarded actions above. Admin access should be limited to people responsible for financial and destructive changes.

## Conference launch order

Do not open registration first and fill in the platform later. Launch in this order:

1. **Conference brief** — set the dates, venue, public copy, contacts, awards, and matrix visibility in Conference settings.
2. **Committees** — create every active committee and confirm its agenda, type, delegation mode, and sort order.
3. **Portfolio matrix** — generate or paste portfolios, then check spelling and availability state.
4. **Fees and payment** — define all fee tiers. Ask an admin to verify the payment provider and reconciliation path.
5. **Public QA** — inspect the homepage, matrix, team, dispatch, quiz join page, and full registration form on desktop and mobile.
6. **Open intake** — open registration only when every previous step is complete.
7. **Watch the first records** — verify source attribution, email delivery, status changes, and any import quarantine entries.

The admin overview includes a live launch checklist. It remains visible to maintainers until the conference is ready.

## Daily workflows

### Registration desk

Use `/admin/registrations` to search, filter, inspect, and correct delegate records. Prefer correcting a record over creating a duplicate. Apply filters before exporting data.

Payment overrides, comping, cancellation, and destructive changes are admin-only.

### Allotment floor

Use `/admin/allotment` to match a delegate with an available portfolio. Opening the allotment dialog temporarily holds a portfolio. Confirm the delegate and portfolio before completing the allotment.

Revocation is deliberately admin-only because it changes the delegate, allotment, portfolio, and payment state together.

### Cross-delegation imports

Use `/admin/import` in four stages:

1. upload and parse the source file;
2. map source columns to platform fields;
3. inspect the preview and correct mapping problems;
4. commit clean rows and resolve quarantined rows.

Never treat a successful upload as a successful import. The preview and quarantine queue are part of the workflow.

### Publishing desk

- Moderate submitted dispatches under `/admin/blog`.
- Build and present quiz sessions under `/admin/quiz`.
- Keep the public secretariat roster current under `/admin/team`.
- Check the public routes after publishing.

## Recovery protocol

When something goes wrong:

1. **Stop the blast radius.** Close registration if new submissions could worsen the issue.
2. **Read the activity log.** Use `/admin/logs` to confirm the actor, action, record, and time.
3. **Prefer correction over deletion.** Edit the affected record or ask an admin to use the guarded action.
4. **Verify linked state.** Allotments can affect delegate, portfolio, payment, email, and public matrix state.
5. **Recheck the public surface.** Confirm the registration state, matrix, and delegate-facing status after recovery.

## Operator rules

- Do not share admin or maintainer accounts.
- Do not use destructive actions as a shortcut for incorrect data.
- Do not mark payments manually without external confirmation.
- Do not open registration with incomplete committees, fees, or payment routing.
- Treat the activity log as the source of truth for operational changes.
- Escalate unclear financial, permission, and deletion work to an admin.

## Codebase orientation

- Admin routes: `src/app/(admin)/admin`
- Public routes: `src/app/(marketing)`
- Shared UI copy: `src/content/strings.ts`
- Global visual tokens and utilities: `src/app/globals.css`
- Authorization guards: `src/lib/authz.ts`
- Audit writer: `src/lib/audit.ts`
- Payment integration: `src/lib/payments.ts`
- Email integration: `src/lib/resend.ts`

When changing permissions, update both the server action guard and the permission map in `/admin/guide` and this document.
