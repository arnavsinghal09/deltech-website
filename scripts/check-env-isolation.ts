#!/usr/bin/env tsx
// Fails if the Preview environment points at the same database as Production.
//
// We run staging and production out of a single Vercel project, separated only
// by Vercel's Preview/Production env scopes. That is simple and needs no second
// project, but it has one failure mode: a variable added as "All Environments"
// (Vercel's default when you are not paying attention) silently re-points every
// PR preview at the production database. That is exactly how this was broken
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
    envs.find((e) => e.key === key && (e.target ?? []).includes(target))?.value

  const prodDb = pick("DATABASE_URL", "production")
  const previewDb = pick("DATABASE_URL", "preview")

  assert.ok(prodDb, "DATABASE_URL is not set for the Production environment in Vercel")
  assert.ok(
    previewDb,
    "DATABASE_URL is not set for the Preview environment in Vercel. Previews would fall back to " +
      "an 'All Environments' value, which is almost certainly production. Run `npm run setup:staging`.",
  )
  assert.notEqual(
    previewDb,
    prodDb,
    "Preview and Production share a DATABASE_URL. Every PR preview and test.deltechmun.in would " +
      "be writing to the live conference database. Run `npm run setup:staging` to repoint Preview.",
  )

  // Same trap for the Prisma CLI datasource used by migrations.
  const prodDirect = pick("DIRECT_URL", "production")
  const previewDirect = pick("DIRECT_URL", "preview")
  if (prodDirect && previewDirect) {
    assert.notEqual(previewDirect, prodDirect, "Preview and Production share a DIRECT_URL")
  }

  // Staging must not be able to run the cron routes or write the public sheet.
  for (const key of ["CRON_SECRET", "SHEET_SYNC_SECRET"]) {
    const onPreview = envs.find((e) => e.key === key && (e.target ?? []).includes("preview"))
    assert.ok(
      !onPreview,
      `${key} is set on Preview. Leave it unset so staging fails closed: with it set, anyone ` +
        `holding the value could fire the cron routes against a public preview URL.`,
    )
  }

  console.log("✅ check-env-isolation passed (Preview and Production are on different databases)")
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
