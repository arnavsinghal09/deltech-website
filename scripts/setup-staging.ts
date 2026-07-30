#!/usr/bin/env tsx
/**
 * One-shot, idempotent setup for the staging environment.
 *
 *   npm run setup:staging
 *
 * Staging and production run out of a single Vercel project, separated by
 * Vercel's Preview and Production env scopes. This script builds the Preview
 * side: the Preview-scoped env vars pointing at the staging database, the
 * test.deltechmun.in domain, the GitHub secrets the workflows need, and
 * branch protection on main. It also deletes the stray test-deltech-website
 * project that was double-deploying every PR.
 *
 * Everything is skip-if-exists, so re-running is safe and tells you what is
 * already in place.
 *
 * You need:
 *   VERCEL_TOKEN          (already a repo secret; export it locally too)
 *   STAGING_DIRECT_URL    Neon unpooled connection string
 *   STAGING_DATABASE_URL  Neon pooled connection string
 *   gh, authenticated
 */
import "dotenv/config"
import { execFileSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { readFileSync } from "node:fs"
import { parse } from "dotenv"

const STAGING_DOMAIN = "test.deltechmun.in"
const OLD_PROJECT_NAME = "test-deltech-website"
const STAGING_EMAIL_FROM = "staging@deltechmun.in"
const DATABASE_ONLY = process.env.DATABASE_ONLY === "1"

// Refuse outright if a "staging" URL is actually the production database.
const PROD_DB_REF = "hktvvxtiobeaphzfmpbf"

const changed: string[] = []
const skipped: string[] = []
const manual: string[] = []

function need(name: string, hint: string): string {
  const v = process.env[name]?.trim()
  if (!v) {
    console.error(`\nMissing ${name}.\n  ${hint}\n`)
    process.exit(1)
  }
  return v
}

const VERCEL_TOKEN = need("VERCEL_TOKEN", "export VERCEL_TOKEN=... (or run `npx vercel login`)")

// Staging Postgres. Supabase free tier caps a user at 2 active projects and
// this account is at the limit, so staging lives on Neon instead. Neon's
// endpoints are IPv4-reachable, which also sidesteps the IPv6 problem that
// makes Supabase's direct host unusable from GitHub runners.
//
//   STAGING_DIRECT_URL    unpooled endpoint, for `prisma migrate deploy`
//   STAGING_DATABASE_URL  -pooler endpoint, for the app at runtime
const STAGING_DIRECT_URL = need(
  "STAGING_DIRECT_URL",
  "Neon dashboard > Connect > uncheck 'Connection pooling'. Ends in .neon.tech/<db>?sslmode=require",
)
const STAGING_DATABASE_URL = need(
  "STAGING_DATABASE_URL",
  "Neon dashboard > Connect > WITH 'Connection pooling'. Host contains '-pooler'.",
)

for (const [name, url] of [
  ["STAGING_DIRECT_URL", STAGING_DIRECT_URL],
  ["STAGING_DATABASE_URL", STAGING_DATABASE_URL],
] as const) {
  if (url.includes(PROD_DB_REF)) {
    console.error(`\n${name} points at the PRODUCTION database. Refusing.\n`)
    process.exit(1)
  }
}
if (!STAGING_DATABASE_URL.includes("-pooler")) {
  manual.push(
    "STAGING_DATABASE_URL does not look pooled (no '-pooler' in the host). Serverless " +
      "functions open a lot of short-lived connections; use the pooled endpoint for runtime.",
  )
}
if (STAGING_DIRECT_URL.includes("-pooler")) {
  console.error(
    "\nSTAGING_DIRECT_URL is the POOLED endpoint. Migrations need the unpooled one:\n" +
      "PgBouncer in transaction mode cannot run DDL.\n",
  )
  process.exit(1)
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sh(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
}

async function api(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  let body: unknown = text
  try {
    body = JSON.parse(text)
  } catch {
    /* non-JSON */
  }
  return { ok: res.ok, status: res.status, body }
}

const vercel = (path: string, init?: RequestInit) =>
  api(`https://api.vercel.com${path}`, VERCEL_TOKEN, init)

/**
 * Written by `vercel pull` / `vercel link`, or passed explicitly.
 *
 * The env override matters: the production Vercel project lives on a different
 * account from most contributors', so a local CLI login cannot see it and the
 * API returns 404. The usable token is the VERCEL_TOKEN repo secret, which is
 * only readable inside Actions, so this also runs from setup-staging.yml.
 */
function linkedProject(): { projectId: string; orgId: string } {
  const projectId = process.env.VERCEL_PROJECT_ID?.trim()
  const orgId = process.env.VERCEL_ORG_ID?.trim()
  if (projectId && orgId) return { projectId, orgId }

  try {
    return JSON.parse(readFileSync(".vercel/project.json", "utf8")) as {
      projectId: string
      orgId: string
    }
  } catch {
    console.error(
      "\nNo Vercel project. Either run `npx vercel link`, or set VERCEL_PROJECT_ID " +
        "and VERCEL_ORG_ID.\n",
    )
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// 2. Vercel Preview env
// ---------------------------------------------------------------------------

interface VercelEnv {
  id: string
  key: string
  target?: string[]
  value?: string
}

async function setPreviewEnv(projectId: string, orgId: string) {
  const qs = `?teamId=${orgId}`
  const current = await vercel(`/v9/projects/${projectId}/env${qs}&decrypt=true`)
  if (!current.ok) {
    console.error(`Vercel env read failed (${current.status}):`, current.body)
    process.exit(1)
  }
  const envs = (current.body as { envs: VercelEnv[] }).envs

  const productionEnvFile = process.env.PROD_ENV_FILE?.trim()
  const pulledProduction = productionEnvFile
    ? parse(readFileSync(productionEnvFile))
    : {}
  const prodValue = (key: string) =>
    process.env[`PROD_${key}`]?.trim() ||
    pulledProduction[key]?.trim() ||
    envs.find((e) => e.key === key && (e.target ?? []).includes("production"))?.value
  const previewOnlyValue = (key: string) =>
    envs.find(
      (e) =>
        e.key === key &&
        (e.target ?? []).includes("preview") &&
        !(e.target ?? []).includes("production"),
    )?.value
  const desired: Record<string, string> = {
    DATABASE_URL: STAGING_DATABASE_URL,
    DIRECT_URL: STAGING_DIRECT_URL,
    // Auth.js prefers AUTH_URL/NEXTAUTH_URL over the incoming request host.
    // Keep this in the always-repaired set: a Production-scoped/shared value
    // otherwise turns every Test magic link into a deltechmun.in link.
    AUTH_URL: `https://${STAGING_DOMAIN}`,
    NEXT_PUBLIC_APP_URL: `https://${STAGING_DOMAIN}`,
  }

  if (!DATABASE_ONLY) {
    const stagingEmailRecipient = prodValue("ADMIN_EMAIL")
    if (!stagingEmailRecipient) {
      manual.push("ADMIN_EMAIL: required to redirect staging mail away from real form respondents")
    }

    Object.assign(desired, {
      // Distinct from production so a staging session cannot be replayed there.
      // Preserve it on re-runs so configuring staging does not sign everyone out.
      AUTH_SECRET: previewOnlyValue("AUTH_SECRET") ?? randomBytes(32).toString("base64"),
      EMAIL_FROM: STAGING_EMAIL_FROM,
      ...(stagingEmailRecipient ? { EMAIL_REDIRECT_TO: stagingEmailRecipient } : {}),
    })

    // Application data stays on Neon, while configured integrations use the
    // same credentials as Production so their complete flows can be exercised.
    const copyFromProd = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "AUTH_RESEND_KEY",
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
      "RAZORPAY_WEBHOOK_SECRET",
      "GFORM_SHARED_SECRET",
      "CRON_SECRET",
      "SHEET_SYNC_SECRET",
      "GROQ_API_KEY",
      "GROQ_MODEL",
      "ADMIN_EMAIL",
    ]
    for (const key of copyFromProd) {
      const v = prodValue(key)
      if (v) desired[key] = v
      else if (key === "AUTH_RESEND_KEY") {
        manual.push(`${key}: missing from Production, so staging cannot copy it`)
      }
    }
  }

  for (const [key, value] of Object.entries(desired)) {
    const existing = envs.find((e) => e.key === key && (e.target ?? []).includes("preview"))

    // A row shared with Production must NEVER be PATCHed here. Vercel replaces
    // the target list rather than merging it, so writing target: ["preview"]
    // strips Production off the row and it silently loses the variable. That
    // happened: production lost DATABASE_URL, DIRECT_URL, AUTH_SECRET and
    // EMAIL_FROM in one go, and the next deploy would have shipped with no
    // database. Narrow the shared row to Production, then add a separate
    // Preview row alongside it.
    if (existing && (existing.target ?? []).includes("production")) {
      const others = (existing.target ?? []).filter((t) => t !== "preview")
      const narrow = await vercel(`/v9/projects/${projectId}/env/${existing.id}${qs}`, {
        method: "PATCH",
        body: JSON.stringify({ target: others }),
      })
      if (!narrow.ok) {
        console.error(`  ! ${key}: could not narrow shared row (${narrow.status})`, narrow.body)
        if (DATABASE_ONLY) throw new Error(`Could not isolate Preview ${key}`)
        manual.push(`${key}: narrow to Production by hand, then re-run`)
        continue
      }
      changed.push(`${key} narrowed to ${others.join("+")} (was shared with Preview)`)
      const add = await vercel(`/v10/projects/${projectId}/env${qs}`, {
        method: "POST",
        body: JSON.stringify({ key, value, type: "encrypted", target: ["preview"] }),
      })
      if (add.ok) changed.push(`Preview env ${key} added`)
      else {
        console.error(`  ! ${key}: ${add.status}`, add.body)
        if (DATABASE_ONLY) throw new Error(`Could not add Preview ${key}`)
      }
      continue
    }

    if (existing) {
      const upd = await vercel(`/v9/projects/${projectId}/env/${existing.id}${qs}`, {
        method: "PATCH",
        body: JSON.stringify({ value, target: ["preview"] }),
      })
      if (upd.ok) changed.push(`Preview env ${key} updated`)
      else {
        console.error(`  ! ${key}: ${upd.status}`, upd.body)
        if (DATABASE_ONLY) throw new Error(`Could not update Preview ${key}`)
      }
    } else {
      const add = await vercel(`/v10/projects/${projectId}/env${qs}`, {
        method: "POST",
        body: JSON.stringify({ key, value, type: "encrypted", target: ["preview"] }),
      })
      if (add.ok) changed.push(`Preview env ${key} added`)
      else {
        console.error(`  ! ${key}: ${add.status}`, add.body)
        if (DATABASE_ONLY) throw new Error(`Could not add Preview ${key}`)
      }
    }
  }

}

// ---------------------------------------------------------------------------
// 3. Domain, old project, GitHub secrets, branch protection
// ---------------------------------------------------------------------------

async function ensureDomain(projectId: string, orgId: string) {
  const res = await vercel(`/v10/projects/${projectId}/domains?teamId=${orgId}`, {
    method: "POST",
    body: JSON.stringify({ name: STAGING_DOMAIN }),
  })
  if (res.ok) {
    changed.push(`Added ${STAGING_DOMAIN} to the Vercel project`)
  } else if (JSON.stringify(res.body).includes("already")) {
    skipped.push(`${STAGING_DOMAIN} already on the project`)
  } else {
    manual.push(`Add ${STAGING_DOMAIN} in Vercel by hand (API said ${res.status})`)
  }
  manual.push(`Point ${STAGING_DOMAIN} at Vercel in DNS if you have not already.`)
}

async function removeOldProject(orgId: string) {
  const list = await vercel(`/v9/projects?teamId=${orgId}`)
  const projects = (list.body as { projects?: Array<{ id: string; name: string }> }).projects ?? []
  const old = projects.find((p) => p.name === OLD_PROJECT_NAME)
  if (!old) {
    skipped.push(`${OLD_PROJECT_NAME} not found (already gone)`)
    return
  }
  const res = await vercel(`/v9/projects/${old.id}?teamId=${orgId}`, { method: "DELETE" })
  if (res.ok) {
    changed.push(`Deleted ${OLD_PROJECT_NAME}, which was double-deploying every PR`)
  } else {
    manual.push(`Delete the ${OLD_PROJECT_NAME} Vercel project by hand (API said ${res.status})`)
  }
}

function setSecret(name: string, value: string) {
  // GITHUB_TOKEN cannot write Actions secrets, so inside a workflow this is
  // expected to fail; the secrets are set from a maintainer's machine instead.
  if (process.env.SKIP_GH_SECRETS === "1") {
    skipped.push(`GitHub secret ${name} (SKIP_GH_SECRETS=1)`)
    return
  }
  try {
    execFileSync("gh", ["secret", "set", name, "--body", value], { stdio: "ignore" })
    changed.push(`GitHub secret ${name} set`)
  } catch {
    manual.push(`Set the GitHub secret ${name} by hand`)
  }
}

function protectMain() {
  if (process.env.SKIP_GH_SECRETS === "1") {
    skipped.push("Branch protection (SKIP_GH_SECRETS=1)")
    return
  }
  try {
    const repo = sh("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"])
    execFileSync(
      "gh",
      [
        "api",
        "-X", "PUT",
        `repos/${repo}/branches/main/protection`,
        "-H", "Accept: application/vnd.github+json",
        "--input", "-",
      ],
      {
        input: JSON.stringify({
          required_status_checks: { strict: true, contexts: ["check"] },
          enforce_admins: false,
          required_pull_request_reviews: null,
          restrictions: null,
        }),
        stdio: ["pipe", "ignore", "ignore"],
      },
    )
    changed.push("Branch protection on main now requires the `check` status")
  } catch {
    manual.push(
      "Enable branch protection on main requiring the `check` status " +
        "(needs admin rights; migrations now run against production on merge).",
    )
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const { projectId, orgId } = linkedProject()
  console.log(`Vercel project ${projectId}\n`)

  await setPreviewEnv(projectId, orgId)
  if (DATABASE_ONLY) {
    changed.forEach((item) => console.log(`  ${item}`))
    return
  }
  await ensureDomain(projectId, orgId)
  await removeOldProject(orgId)

  setSecret("STAGING_DIRECT_URL", STAGING_DIRECT_URL)
  setSecret("STAGING_DATABASE_URL", STAGING_DATABASE_URL)

  const prodDirect = process.env.PROD_DIRECT_URL?.trim() ?? process.env.DIRECT_URL?.trim()
  if (prodDirect && prodDirect.includes("pooler.supabase.com:5432")) {
    setSecret("PROD_DIRECT_URL", prodDirect)
  } else {
    manual.push(
      "Set the GitHub secret PROD_DIRECT_URL to the production SESSION pooler URL " +
        "(port 5432 on pooler.supabase.com). Your local DIRECT_URL is the IPv6-only " +
        "db.<ref>.supabase.co host, which GitHub runners cannot reach.",
    )
  }

  protectMain()

  const line = (s: string) => console.log(`  ${s}`)
  console.log("\n── Changed ───────────────────────────────")
  changed.forEach(line)
  console.log("\n── Already in place ──────────────────────")
  skipped.forEach(line)
  console.log("\n── Still needs you ───────────────────────")
  manual.forEach(line)
  console.log(
    "\nThen run the 'Reset Test Data' workflow once to migrate and seed the Test database.\n",
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
