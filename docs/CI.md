# CI, deployments and the staging environment

## Three environments, one Vercel project

| | Vercel env scope | Database | URL |
|---|---|---|---|
| Production | Production | prod Supabase | `deltechmun.in` |
| Staging (tracks `main`) | Preview | **staging** Supabase | `test.deltechmun.in` |
| Per-PR preview | Preview | **staging** Supabase | unique `*.vercel.app`, commented on the PR |

Staging and production are separated by Vercel's env scopes rather than by two
projects: no second project to keep in sync, no extra project-ID secrets, and
`preview.yml` needs no special targeting. The one failure mode is a variable
added as "All Environments", which silently re-points every preview at
production. That is exactly how this used to be broken, so
`scripts/check-env-isolation.ts` fails the build if Preview and Production ever
resolve to the same `DATABASE_URL`.

**Nothing on staging can reach production.** Different database, different
`AUTH_SECRET`, its own Resend key, and `CRON_SECRET`/`SHEET_SYNC_SECRET`
deliberately unset so the cron routes and the Google Sheet mirror fail closed.

Email and Razorpay are **live** on staging, on purpose: you cannot test a
registration flow whose emails are stubbed out. The containment is the data, not
a kill switch, so the staging seed only ever uses `staging+*@deltechmun.in`
addresses. **Never copy production data into staging.**

## Workflows

| Workflow | Trigger | Does |
|---|---|---|
| `check.yml` (CI) | PR, and called by `deploy.yml` | `tsc --noEmit`, `npm run check`, `next build`. The gate. |
| `preview.yml` | PR | Migrates staging, deploys a preview, comments the URL. |
| `deploy.yml` | push `main` | `ci` → then `staging` → then `production`. |
| `reset-staging.yml` | manual | Wipes and reseeds the staging database. |

```
push main
  └─ ci            reuses check.yml
      └─ staging      migrate staging → deploy → alias test.deltechmun.in
          └─ production  migrate prod → deploy --prod
```

Production depends on staging, so a migration that is going to fail does so
against the scratch database first. `deploy.yml` has a `concurrency` group, so
two quick merges queue rather than racing two migrations at the same database.

`check.yml` has no `push: [main]` trigger. `deploy.yml` calls it instead;
adding both would run CI twice per merge and, because they share a concurrency
group, the two runs would cancel each other.

`npm run check` globs `scripts/check-*.ts`, so new assert scripts are picked up
with no workflow edit.

## The IPv6 trap

Migrations run `prisma migrate deploy` against `DIRECT_URL`
(`prisma.config.ts:8`). Both `*_DIRECT_URL` secrets **must** be the Supabase
**session pooler**:

```
postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres
```

- `db.<ref>.supabase.co:5432` is **IPv6-only**, and GitHub runners have no IPv6.
  Using it fails with `P1001 Can't reach database server`.
- Port **6543** is the transaction pooler and **cannot run DDL**. Migrations need
  5432 (session mode). The app's runtime `DATABASE_URL` uses 6543, which is correct.

### Before setup has run

The pipeline degrades instead of blocking. With `STAGING_DIRECT_URL` and
`PROD_DIRECT_URL` unset, both migration steps emit a warning and skip, the
staging deploy still produces `test.deltechmun.in`, and production deploys
exactly as it did before. The PR comment says plainly that the preview is still
on the production database. Nothing is gated on the staging environment
existing, so this could be merged without freezing deployments; run the setup
below to turn the warnings into real gates.

## Setup

**Staging Postgres lives on Neon, not Supabase.** Supabase's free tier caps a
*user* at 2 active projects across all organisations, and this account is at the
limit (`deltech-mun` + `health-care-optimization`), so no third project can be
created anywhere. Neon's free tier has no such cap, and its endpoints are
IPv4-reachable, which sidesteps the IPv6 problem below entirely.

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

It writes the Preview-scoped env vars (copying what it can from Production),
adds `test.deltechmun.in`, deletes the stray `test-deltech-website` project,
sets the `STAGING_*` GitHub secrets, and turns on branch protection requiring
`check`. It refuses if either URL points at production, or if the two are the
wrong way round (PgBouncer cannot run DDL). It prints what it changed, what was
already in place, and what still needs you.

Then run **Reset staging** once to migrate and seed the new database.

### What it cannot do

- **The Neon project itself.** Sign up and create one; the two connection
  strings are on the Connect panel.
- **DNS.** Point `test.deltechmun.in` at Vercel yourself.
- **`PROD_DIRECT_URL`.** Your local `DIRECT_URL` is the IPv6-only host, so the
  script will not use it. Set the secret to the production *session pooler* URL.
- **Razorpay test keys**, and only when you want them. Staging does not need
  them on day one: `paymentProvider` seeds to `upi_qr`, so nothing calls
  Razorpay until you flip that setting. When you do, add `rzp_test_…` keys and a
  test-mode webhook at `https://test.deltechmun.in/api/webhooks/razorpay`; test
  cards then drive the real webhook, the real status transition and the real
  confirmation email, with no money moving.

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

Staging is shared, so PR branches apply their own migrations to it. Migrations
from PRs that are never merged accumulate; `migrate deploy` ignores
applied-but-absent migrations so nothing breaks, but the schema drifts. Reset
when it gets untidy.

## Deployment protection

Preview URLs must be publicly reachable for reviewers, so Vercel Authentication
is off (Project → Settings → **Deployment Protection**). Previews now run
against staging, so a public preview URL no longer exposes the production
database, which was the standing risk this whole setup removes.

## Link URLs in emails

`src/lib/app-url.ts` resolves `NEXT_PUBLIC_APP_URL || NEXT_PUBLIC_VERCEL_URL`.
Set it to the production origin on Production and leave it **unset on Preview**,
so each PR preview's emails link back to that preview rather than to production.
`scripts/check-app-url.ts` pins the fallback order and stops any consumer going
back to reading the env directly.

## Dependency updates (Dependabot)

- **Minor + patch grouped** weekly; **majors individually**. An earlier
  `patterns: ["*"]` group put 30 updates in one PR that failed CI purely because
  of the TypeScript major, blocking 29 good ones.
- **`typescript` majors ignored.** Next.js needs the TS 6 compiler API; TS 7 (the
  Go rewrite) fails `next build`. Revisit when Next.js supports it.
- **`@types/node` majors ignored.** Keep it on the major matching the runtime.
- **`preview` is skipped for Dependabot and fork PRs.** GitHub does not expose
  repository secrets to them, so `vercel --token=` would be empty. `check` still
  gates them, and `check-env-isolation` skips itself for the same reason.

## Moving to a society-owned Vercel account later

Re-import the repo, copy the env vars **keeping the Preview/Production split**,
delete the old project, and update `VERCEL_TOKEN`. These workflows are
account-agnostic and carry over unchanged.
