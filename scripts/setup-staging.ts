#!/usr/bin/env tsx
/**
 * One-shot, idempotent setup for the staging environment.
 *
 *   npm run setup:staging
 *
 * Staging and production run out of a single Vercel project, separated by
 * Vercel's Preview and Production env scopes. This script builds the Preview
 * side: a second Supabase project, the env vars pointing at it, a separate
 * Resend key, the test.deltechmun.in domain, the GitHub secrets the workflows
 * need, and branch protection on main.
 *
 * Everything is skip-if-exists, so re-running is safe and tells you what is
 * already in place.
 *
 * You need:
 *   VERCEL_TOKEN         (already a repo secret; export it locally too)
 *   SUPABASE_ACCESS_TOKEN  supabase.com/dashboard/account/tokens
 *   gh, authenticated
 *
 * Optional:
 *   RESEND_API_KEY       to mint a separate staging key automatically
 */
import "dotenv/config"
import { execFileSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { readFileSync } from "node:fs"

const STAGING_PROJECT_NAME = "deltech-staging"
const STAGING_DOMAIN = "test.deltechmun.in"
const OLD_PROJECT_NAME = "test-deltech-website"
const DB_REGION = "ap-southeast-2" // match production
const STAGING_EMAIL_FROM = `staging@deltechmun.in`

const changed: string[] = []
const skipped: string[] = []
const manual: string[] = []

function need(name: string): string {
  const v = process.env[name]?.trim()
  if (!v) {
    console.error(
      `\nMissing ${name}.\n` +
        (name === "SUPABASE_ACCESS_TOKEN"
          ? "Create one at https://supabase.com/dashboard/account/tokens, then:\n" +
            `  export SUPABASE_ACCESS_TOKEN=sbp_...\n`
          : `  export ${name}=...\n`),
    )
    process.exit(1)
  }
  return v
}

const VERCEL_TOKEN = need("VERCEL_TOKEN")
const SUPABASE_TOKEN = need("SUPABASE_ACCESS_TOKEN")

function sh(cmd: string, args: string[], opts: { quiet?: boolean } = {}): string {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: opts.quiet ? ["ignore", "pipe", "pipe"] : ["ignore", "pipe", "inherit"],
  }).trim()
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
const supabase = (path: string, init?: RequestInit) =>
  api(`https://api.supabase.com${path}`, SUPABASE_TOKEN, init)

function linkedProject(): { projectId: string; orgId: string } {
  try {
    const raw = JSON.parse(readFileSync(".vercel/project.json", "utf8")) as {
      projectId: string
      orgId: string
    }
    return raw
  } catch {
    console.error(
      "\nNo .vercel/project.json. Run `npx vercel link` first so this script knows " +
        "which project to configure.",
    )
    process.exit(1)
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------------------
// 1. Staging Supabase project
// ---------------------------------------------------------------------------

interface StagingDb {
  ref: string
  password: string
  anonKey: string
  poolerHost: string
}

async function ensureSupabase(): Promise<StagingDb> {
  const list = await supabase("/v1/projects")
  if (!list.ok) {
    console.error(`Supabase API ${list.status}:`, list.body)
    process.exit(1)
  }
  const projects = list.body as Array<{ id: string; name: string; region: string }>
  const existing = projects.find((p) => p.name === STAGING_PROJECT_NAME)

  // The DB password is only visible at creation time, so a pre-existing project
  // means we cannot rebuild the connection strings and must ask.
  if (existing) {
    skipped.push(`Supabase project "${STAGING_PROJECT_NAME}" already exists (${existing.id})`)
    const pw = process.env.STAGING_DB_PASSWORD?.trim()
    if (!pw) {
      console.error(
        `\nSupabase project "${STAGING_PROJECT_NAME}" already exists, but its database\n` +
          "password cannot be read back from the API. Either:\n" +
          "  - reset it in the dashboard and re-run with STAGING_DB_PASSWORD=... , or\n" +
          `  - delete the project and let this script recreate it.\n`,
      )
      process.exit(1)
    }
    const keys = await supabase(`/v1/projects/${existing.id}/api-keys`)
    const anon =
      (keys.body as Array<{ name: string; api_key: string }> | undefined)?.find(
        (k) => k.name === "anon",
      )?.api_key ?? ""
    return {
      ref: existing.id,
      password: pw,
      anonKey: anon,
      poolerHost: `aws-1-${existing.region}.pooler.supabase.com`,
    }
  }

  const orgs = await supabase("/v1/organizations")
  const orgId = (orgs.body as Array<{ id: string }>)[0]?.id
  if (!orgId) {
    console.error("No Supabase organization found for this token.")
    process.exit(1)
  }

  const password = randomBytes(24).toString("base64url")
  console.log(`Creating Supabase project "${STAGING_PROJECT_NAME}" in ${DB_REGION}…`)
  const created = await supabase("/v1/projects", {
    method: "POST",
    body: JSON.stringify({
      name: STAGING_PROJECT_NAME,
      organization_id: orgId,
      region: DB_REGION,
      db_pass: password,
      plan: "free",
    }),
  })
  if (!created.ok) {
    console.error(`Supabase create failed (${created.status}):`, created.body)
    if (created.status === 402 || JSON.stringify(created.body).includes("limit")) {
      console.error("\nFree tier allows 2 active projects. Pause or delete one and re-run.")
    }
    process.exit(1)
  }
  const ref = (created.body as { id: string }).id
  changed.push(`Created Supabase project ${STAGING_PROJECT_NAME} (${ref})`)

  process.stdout.write("Waiting for it to provision")
  for (let i = 0; i < 60; i++) {
    await sleep(5000)
    process.stdout.write(".")
    const status = await supabase(`/v1/projects/${ref}`)
    if ((status.body as { status?: string })?.status === "ACTIVE_HEALTHY") break
  }
  console.log(" ready")

  const keys = await supabase(`/v1/projects/${ref}/api-keys`)
  const anonKey =
    (keys.body as Array<{ name: string; api_key: string }> | undefined)?.find(
      (k) => k.name === "anon",
    )?.api_key ?? ""

  console.log(`\n  Save this database password somewhere safe: ${password}\n`)
  manual.push(`Staging DB password (shown once): ${password}`)

  return { ref, password, anonKey, poolerHost: `aws-1-${DB_REGION}.pooler.supabase.com` }
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

async function setPreviewEnv(projectId: string, orgId: string, db: StagingDb) {
  const qs = `?teamId=${orgId}`
  const current = await vercel(`/v9/projects/${projectId}/env${qs}&decrypt=true`)
  if (!current.ok) {
    console.error(`Vercel env read failed (${current.status}):`, current.body)
    process.exit(1)
  }
  const envs = (current.body as { envs: VercelEnv[] }).envs

  const prodValue = (key: string) =>
    envs.find((e) => e.key === key && (e.target ?? []).includes("production"))?.value

  // Session pooler (5432) for migrations: db.<ref>.supabase.co is IPv6-only and
  // GitHub runners have no IPv6. Transaction pooler (6543) for the app.
  const directUrl = `postgresql://postgres.${db.ref}:${db.password}@${db.poolerHost}:5432/postgres`
  const databaseUrl = `postgresql://postgres.${db.ref}:${db.password}@${db.poolerHost}:6543/postgres`

  const desired: Record<string, string> = {
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
    NEXT_PUBLIC_SUPABASE_URL: `https://${db.ref}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: db.anonKey,
    // Distinct from production so a staging session cannot be replayed there.
    AUTH_SECRET: randomBytes(32).toString("base64"),
    // Makes staging mail obvious in an inbox.
    EMAIL_FROM: STAGING_EMAIL_FROM,
  }

  // Copy the rest from Production so nothing has to be retyped. Deliberately
  // omitted: CRON_SECRET and SHEET_SYNC_SECRET (staging must fail closed), and
  // NEXT_PUBLIC_APP_URL (unset on Preview so each PR preview's emails link back
  // to itself; the staging alias sets it separately below).
  const copyFromProd = [
    "AUTH_RESEND_KEY",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "GFORM_SHARED_SECRET",
    "GROQ_API_KEY",
    "GROQ_MODEL",
    "ADMIN_EMAIL",
  ]
  for (const key of copyFromProd) {
    const v = prodValue(key)
    if (v) desired[key] = v
  }

  const stagingResend = await ensureResendKey()
  if (stagingResend) desired.AUTH_RESEND_KEY = stagingResend

  for (const [key, value] of Object.entries(desired)) {
    const existing = envs.find((e) => e.key === key && (e.target ?? []).includes("preview"))
    if (existing) {
      const upd = await vercel(`/v9/projects/${projectId}/env/${existing.id}${qs}`, {
        method: "PATCH",
        body: JSON.stringify({ value, target: ["preview"] }),
      })
      if (upd.ok) changed.push(`Preview env ${key} updated`)
      else console.error(`  ! ${key}: ${upd.status}`, upd.body)
    } else {
      const add = await vercel(`/v10/projects/${projectId}/env${qs}`, {
        method: "POST",
        body: JSON.stringify({ key, value, type: "encrypted", target: ["preview"] }),
      })
      if (add.ok) changed.push(`Preview env ${key} added`)
      else console.error(`  ! ${key}: ${add.status}`, add.body)
    }
  }

  // Anything scoped to all three environments would override the Preview value
  // we just set. That is the exact failure this whole change exists to prevent.
  const leaky = envs.filter(
    (e) => (e.target ?? []).includes("preview") && (e.target ?? []).includes("production"),
  )
  for (const e of leaky) {
    if (e.key in desired) {
      manual.push(
        `${e.key} is scoped to BOTH Preview and Production. Narrow it to Production in the ` +
          `Vercel dashboard, or previews will keep reading the production value.`,
      )
    }
  }

  // Staging's own stable origin, used only by the aliased main deployment.
  manual.push(
    `Set NEXT_PUBLIC_APP_URL=https://${STAGING_DOMAIN} on Preview ONLY if you want every PR ` +
      `preview to link to the staging domain rather than to itself. Left unset by default.`,
  )
}

// ---------------------------------------------------------------------------
// 3. A separate Resend key so staging sends are distinguishable
// ---------------------------------------------------------------------------

async function ensureResendKey(): Promise<string | null> {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) {
    skipped.push("Resend staging key not created (set RESEND_API_KEY to automate)")
    manual.push(
      "Optional: create a second Resend API key for staging so its sends are separable " +
        "from production in the dashboard.",
    )
    return null
  }
  const res = await api("https://api.resend.com/api-keys", key, {
    method: "POST",
    body: JSON.stringify({ name: "deltech-staging", permission: "sending_access" }),
  })
  if (!res.ok) {
    skipped.push(`Resend key creation failed (${res.status}); reusing the production key`)
    return null
  }
  changed.push("Created a separate Resend API key for staging")
  return (res.body as { token: string }).token
}

// ---------------------------------------------------------------------------
// 4. Domain, old project, GitHub secrets, branch protection
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
  try {
    execFileSync("gh", ["secret", "set", name, "--body", value], { stdio: "ignore" })
    changed.push(`GitHub secret ${name} set`)
  } catch {
    manual.push(`Set the GitHub secret ${name} by hand`)
  }
}

function protectMain() {
  try {
    const repo = sh("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], {
      quiet: true,
    })
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

  const db = await ensureSupabase()
  await setPreviewEnv(projectId, orgId, db)
  await ensureDomain(projectId, orgId)
  await removeOldProject(orgId)

  const direct = `postgresql://postgres.${db.ref}:${db.password}@${db.poolerHost}:5432/postgres`
  const pooled = `postgresql://postgres.${db.ref}:${db.password}@${db.poolerHost}:6543/postgres`
  setSecret("STAGING_DIRECT_URL", direct)
  setSecret("STAGING_DATABASE_URL", pooled)

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
    "\nThen run the 'Reset staging' workflow once to migrate and seed the new database.\n",
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
