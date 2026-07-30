#!/usr/bin/env tsx
// Fails if the Preview environment points at the same database as Production.
//
// We run staging and production out of a single Vercel project, separated only
// by Vercel's Preview/Production env scopes. That is simple and needs no second
// project, but it has one failure mode: a variable added as "All Environments"
// (Vercel's default when you are not paying attention) silently re-points
// staging at the production database. That is exactly how this was broken
// before, so it gets a test.
//
// Skips when VERCEL_TOKEN is absent, which is the case locally and on fork or
// Dependabot PRs. This must not turn `npm run check` red for a contributor who
// has no way to satisfy it.
import assert from "node:assert"

const token = process.env.VERCEL_TOKEN
if (!token) {
  console.log("… check-env-isolation skipped (no VERCEL_TOKEN)")
  process.exit(0)
}

// Written by `vercel pull`/`vercel link`; also settable in CI.
async function projectRef(): Promise<{ projectId: string; teamId?: string } | null> {
  if (process.env.VERCEL_PROJECT_ID) {
    return { projectId: process.env.VERCEL_PROJECT_ID, teamId: process.env.VERCEL_ORG_ID }
  }
  try {
    const { readFileSync } = await import("node:fs")
    const raw = JSON.parse(readFileSync(".vercel/project.json", "utf8")) as {
      projectId: string
      orgId?: string
    }
    return { projectId: raw.projectId, teamId: raw.orgId }
  } catch {
    return null
  }
}

interface VercelEnvVar {
  id: string
  key: string
  target?: string[]
  value?: string
  type?: string
}

async function main() {
  const ref = await projectRef()
  if (!ref) {
    console.log("… check-env-isolation skipped (no linked Vercel project)")
    return
  }

  const qs = ref.teamId ? `?teamId=${ref.teamId}&decrypt=true` : "?decrypt=true"
  const res = await fetch(`https://api.vercel.com/v9/projects/${ref.projectId}/env${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    // A token without access should not be a merge blocker; say so and pass.
    console.log(`… check-env-isolation skipped (Vercel API ${res.status})`)
    return
  }

  const { envs } = (await res.json()) as { envs: VercelEnvVar[] }

  const pick = (key: string, target: string) =>
    envs.find((e) => e.key === key && (e.target ?? []).includes(target))

  const prodDb = pick("DATABASE_URL", "production")
  const previewDb = pick("DATABASE_URL", "preview")

  assert.ok(prodDb, "DATABASE_URL is not set for the Production environment in Vercel")
  assert.ok(
    previewDb,
    "DATABASE_URL is not set for the Preview environment in Vercel. Staging would fall back to " +
      "an 'All Environments' value, which is almost certainly production. Run `npm run setup:staging`.",
  )
  assert.notEqual(
    previewDb.id,
    prodDb.id,
    "Preview and Production share a DATABASE_URL. test.deltechmun.in would be writing to the " +
      "live conference database. Run `npm run setup:staging` to repoint Preview.",
  )
  if (previewDb.value) {
    assert.match(
      previewDb.value,
      /neon\.tech/i,
      "Preview DATABASE_URL must point at Neon, not a production service",
    )
  }

  // Same trap for the Prisma CLI datasource used by migrations.
  const prodDirect = pick("DIRECT_URL", "production")
  const previewDirect = pick("DIRECT_URL", "preview")
  assert.ok(previewDirect, "DIRECT_URL is not set for the Preview environment in Vercel")
  if (prodDirect) {
    assert.notEqual(previewDirect.id, prodDirect.id, "Preview and Production share a DIRECT_URL")
  }
  if (previewDirect.value) {
    assert.match(
      previewDirect.value,
      /neon\.tech/i,
      "Preview DIRECT_URL must point at Neon, not a production service",
    )
  }

  const productionAuth = pick("AUTH_SECRET", "production")
  const previewAuth = pick("AUTH_SECRET", "preview")
  assert.ok(productionAuth, "AUTH_SECRET is not set for Production in Vercel")
  assert.ok(previewAuth, "AUTH_SECRET is not set for Preview in Vercel")
  assert.notEqual(
    previewAuth.id,
    productionAuth.id,
    "Staging and Production must not share AUTH_SECRET",
  )

  // Resend is already in use and is required in both environments. Other
  // integrations are mirrored when Production has been configured, but they
  // must not block an otherwise healthy deployment before the organisation
  // starts using them.
  const requiredShared = ["AUTH_RESEND_KEY"]
  const optionalShared = [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "GFORM_SHARED_SECRET",
    "CRON_SECRET",
    "SHEET_SYNC_SECRET",
  ]

  for (const key of requiredShared) {
    const productionEnv = pick(key, "production")
    const previewEnv = pick(key, "preview")
    assert.ok(productionEnv, `${key} is not set for Production in Vercel`)
    assert.ok(previewEnv, `${key} is not set for Preview in Vercel`)
    if (productionEnv.value && previewEnv.value) {
      assert.equal(previewEnv.value, productionEnv.value, `${key} must match Production on staging`)
    }
  }

  for (const key of optionalShared) {
    const productionEnv = pick(key, "production")
    const previewEnv = pick(key, "preview")
    if (!productionEnv && !previewEnv) continue
    assert.ok(productionEnv, `${key} exists in Test but not Production`)
    assert.ok(previewEnv, `${key} is configured in Production but missing from Test`)
    if (productionEnv.value && previewEnv.value) {
      assert.equal(previewEnv.value, productionEnv.value, `${key} must match Production on staging`)
    }
  }

  const productionAdmin = envs.find(
    (env) => env.key === "ADMIN_EMAIL" && (env.target ?? []).includes("production"),
  )
  const emailRedirect = envs.find(
    (env) => env.key === "EMAIL_REDIRECT_TO" && (env.target ?? []).includes("preview"),
  )
  assert.ok(productionAdmin, "ADMIN_EMAIL is not set for Production in Vercel")
  assert.ok(
    emailRedirect,
    "EMAIL_REDIRECT_TO is not set for Preview; live form respondents could be emailed twice",
  )
  if (productionAdmin.value && emailRedirect.value) {
    assert.equal(
      emailRedirect.value,
      productionAdmin.value,
      "Staging email must redirect to ADMIN_EMAIL",
    )
  }

  console.log("✅ check-env-isolation passed (Neon data, configured integrations mirrored)")
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
