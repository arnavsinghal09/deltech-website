# CI, deployments and the staging environment

## Two environments, one Vercel project

|                         | Vercel env scope | Database         | URL                  |
| ----------------------- | ---------------- | ---------------- | -------------------- |
| Production              | Production       | prod Supabase    | `deltechmun.in`      |
| Staging (tracks `main`) | Preview          | **staging Neon** | `test.deltechmun.in` |

Staging and production are separated by Vercel's env scopes rather than by two
projects: no second project to keep in sync and no extra project-ID secrets.
Pull requests run CI but do not deploy; Vercel Hobby's upload allowance is too
small for a deployment on every PR. The one failure mode is a variable added as
"All Environments", which silently re-points staging at production. That is
exactly how this used to be broken, so
`scripts/check-env-isolation.ts` fails the build if Preview and Production ever
resolve to the same `DATABASE_URL`.

**Application data is isolated; integrations are deliberately shared.** The
website reads and writes delegates, users, payments, settings, and logs in Neon,
with a different `AUTH_SECRET`. It shares Production's Resend, Razorpay, Google
Form, cron, public-sheet, Supabase Realtime/Storage, and Groq credentials so the
complete flows can be tested.

This means staging uses the real Resend API, can create real Razorpay payment
links, consumes live Google Form responses, and updates the public Google
Sheet. To prevent duplicate messages to live form respondents,
`EMAIL_REDIRECT_TO` sends every staging email to `ADMIN_EMAIL` and prefixes the
subject with its intended recipient. **Never copy production database records
into staging.**

## Workflows

| Workflow            | Trigger                        | Does                                                                                      |
| ------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `check.yml` (CI)    | PR, and called by `deploy.yml` | `tsc --noEmit`, `npm run check`, `next build`. The gate.                                  |
| `deploy.yml`        | push `main`; manual            | Push: `ci` → `staging` → `production`. Manual: `ci` → `staging` only.                     |
| `setup-staging.yml` | manual                         | Repairs/configures Vercel env; can optionally deploy and smoke-test staging before merge. |
| `reset-staging.yml` | manual                         | Wipes and reseeds Neon, then copies integration configuration.                            |
| `staging-cron.yml`  | daily/manual                   | Invokes both protected cron routes on staging.                                            |

```
push main
  └─ ci            reuses check.yml
      └─ staging      migrate → deploy → alias → smoke-test test.deltechmun.in
          └─ production  migrate prod → deploy --prod
```

Production depends on staging, so a migration that is going to fail does so
against the scratch database first. `deploy.yml` has a `concurrency` group, so
two quick merges queue rather than racing two migrations at the same database.
There is no human pause: once the staging deployment succeeds, Production
deploys immediately. Use `test.deltechmun.in` for ongoing functional testing,
not as a manual promotion gate.

`check.yml` has no `push: [main]` trigger. `deploy.yml` calls it instead;
adding both would run CI twice per merge and, because they share a concurrency
group, the two runs would cancel each other.

`npm run check` globs `scripts/check-*.ts`, so new assert scripts are picked up
with no workflow edit.

## The IPv6 trap

Migrations run `prisma migrate deploy` against `DIRECT_URL`
(`prisma.config.ts:8`).

- `STAGING_DIRECT_URL` is Neon's **unpooled** connection string. The running
  application uses the separate pooled `STAGING_DATABASE_URL`.
- `PROD_DIRECT_URL` must be Supabase's **session pooler**:

  ```
  postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres
  ```

  `db.<ref>.supabase.co:5432` is IPv6-only, and GitHub runners have no IPv6.
  Port 6543 is the transaction pooler and cannot run DDL.

The pipeline fails closed when either migration URL is missing. Production also
stays untouched when staging cannot migrate, deploy, claim its stable alias, or
serve its database-backed homepage and availability routes.

## Setup

**Staging Postgres lives on Neon, not Supabase.** Supabase's free tier caps a
_user_ at 2 active projects across all organisations, and this account is at the
limit (`deltech-mun` + `health-care-optimization`), so no third project can be
created anywhere. Neon's free tier has no such cap, and its endpoints are
IPv4-reachable, which sidesteps the IPv6 problem above entirely.

Supabase is still used by staging for **Realtime** (the quiz) and **Storage**
(blog images): `NEXT_PUBLIC_SUPABASE_*` are not database credentials. Staging
copies production's values for those, so blog images uploaded on staging land in
the production `blog-images` bucket, and a quiz room code colliding across
environments would share a Realtime channel. Both are noise, not corruption.

Create a Neon project, then grab both connection strings from **Connect**:

```bash
export VERCEL_TOKEN=...                 # or run `npx vercel login`
export STAGING_DIRECT_URL=...           # 'Connection pooling' UNCHECKED
export STAGING_DATABASE_URL=...         # 'Connection pooling' CHECKED, host has -pooler
npm run setup:staging
```

It writes the Preview-scoped Neon URLs and stable staging origin, copies the
approved integration credentials from Production, adds `test.deltechmun.in`,
deletes the stray `test-deltech-website` project, sets the `STAGING_*` GitHub
secrets, and turns on branch protection requiring `check`. It refuses if either
staging URL points at production or if the pooled/unpooled URLs are reversed.
It prints what it changed, what was already in place, and what still needs you.

Then run **Reset staging** once. After seeding fake application data, it copies
only these Production integration records into Neon:

- `sheetSyncUrl`, `recruitmentSheetUrl`, and `sheetPullSources` settings;
- `ImportPreset` column mappings.

It does not copy delegates, users, payments, email logs, or other Production
records.

### What it cannot do

- **The Neon project itself.** Sign up and create one; the two connection
  strings are on the Connect panel.
- **DNS.** Point `test.deltechmun.in` at Vercel yourself.
- **`PROD_DIRECT_URL`.** Your local `DIRECT_URL` is the IPv6-only host, so the
  script will not use it. Set the secret to the production _session pooler_ URL.
- **Google Apps Script deployment.** Copy the updated
  `docs/apps-script/gform-webhook.gs` into the live form's linked sheet so new
  submissions fan out to both Production and staging. The daily staging sync
  repairs missed deliveries.
- **Razorpay webhook registration.** Add
  `https://test.deltechmun.in/api/webhooks/razorpay` in Razorpay using the
  shared webhook secret. Unknown delegate IDs are acknowledged and ignored by
  either environment.

## Staging data

`prisma/seed-staging.ts` runs the base seed, then adds what makes the product
exercisable, because `prisma/seed.ts` creates **no portfolios and no
delegates**: five empty committees, with allotment, payment and check-in
untestable. It adds portfolios across all committees, delegates in every
`AppStatus`, a UNHRC double-delegation pair, payments in three states,
quarantined rows, blog posts in every status, and a quiz.

It truncates, so it refuses to run without `ALLOW_DESTRUCTIVE_SEED=1` **and**
refuses outright if `DATABASE_URL` matches the production project ref.

Run it via the **Reset staging** workflow (type `reset staging` to confirm), or
locally with `npm run db:seed:staging`.

Staging tracks `main`, so only merged migrations are applied to it. Reset when
test data gets untidy or when you need a clean rehearsal against the current
schema.

## Staging cron jobs

Vercel schedules `vercel.json` crons only for Production deployments. Staging
uses `.github/workflows/staging-cron.yml` once per day instead. It reads the
Preview-scoped `CRON_SECRET` through the Vercel API and calls both
`/api/cron/payment-reminder` and `/api/cron/gform-sync` on
`test.deltechmun.in`. It can also be run manually from Actions.

## Deployment protection

The staging URL must be publicly reachable for testers, so Vercel Authentication
is off (Project → Settings → **Deployment Protection**). Staging runs against
its own database, so the public URL does not expose the production database.

## Link URLs in emails

`src/lib/app-url.ts` resolves `NEXT_PUBLIC_APP_URL || NEXT_PUBLIC_VERCEL_URL`.
Set it to `https://deltechmun.in` on Production and
`https://test.deltechmun.in` on Preview, so each environment's emails link back
to its stable origin.
`scripts/check-app-url.ts` pins the fallback order and stops any consumer going
back to reading the env directly.

## Dependency updates (Dependabot)

- **Minor + patch grouped** weekly; **majors individually**. An earlier
  `patterns: ["*"]` group put 30 updates in one PR that failed CI purely because
  of the TypeScript major, blocking 29 good ones.
- **`typescript` majors ignored.** Next.js needs the TS 6 compiler API; TS 7 (the
  Go rewrite) fails `next build`. Revisit when Next.js supports it.
- **`@types/node` majors ignored.** Keep it on the major matching the runtime.
- **PRs run CI only.** `check-env-isolation` skips itself for Dependabot and
  fork PRs because GitHub does not expose `VERCEL_TOKEN` to them; the rest of
  `check` still gates them.

## Moving to a society-owned Vercel account later

Re-import the repo, copy the env vars **keeping the Preview/Production split**,
delete the old project, and update `VERCEL_TOKEN`. These workflows are
account-agnostic and carry over unchanged.
