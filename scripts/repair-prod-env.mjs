#!/usr/bin/env node
// Restores Production-scoped Vercel env vars.
//
// setup-staging.ts found the rows for DATABASE_URL / DIRECT_URL / AUTH_SECRET /
// EMAIL_FROM already carrying BOTH "production" and "preview" targets, and
// PATCHed them with target: ["preview"]. Vercel replaces the target list rather
// than merging, so production silently lost all four: the next production
// deploy would have shipped with no database and no NextAuth secret.
//
// This creates separate production-scoped rows. It never touches the
// preview-scoped ones, and it skips any key that already has a production row,
// so it is safe to re-run.
import { readFileSync } from "node:fs"

const token = process.env.VERCEL_TOKEN
if (!token) {
  console.error("VERCEL_TOKEN is required")
  process.exit(1)
}

const { projectId, orgId } = JSON.parse(readFileSync(".vercel/project.json", "utf8"))
const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

const WANT = {
  DATABASE_URL: process.env.PROD_DATABASE_URL,
  DIRECT_URL: process.env.PROD_DIRECT_URL,
  AUTH_URL: "https://deltechmun.in",
  AUTH_SECRET: process.env.PROD_AUTH_SECRET,
  EMAIL_FROM: process.env.PROD_EMAIL_FROM,
  NEXT_PUBLIC_APP_URL: "https://deltechmun.in",
  ADMIN_EMAIL: process.env.PROD_ADMIN_EMAIL,
  AUTH_RESEND_KEY: process.env.PROD_AUTH_RESEND_KEY,
  RAZORPAY_KEY_ID: process.env.PROD_RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.PROD_RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.PROD_RAZORPAY_WEBHOOK_SECRET,
  GFORM_SHARED_SECRET: process.env.PROD_GFORM_SHARED_SECRET,
  CRON_SECRET: process.env.PROD_CRON_SECRET,
  SHEET_SYNC_SECRET: process.env.PROD_SHEET_SYNC_SECRET,
  NEXT_PUBLIC_SUPABASE_URL: process.env.PROD_NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.PROD_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  GROQ_API_KEY: process.env.PROD_GROQ_API_KEY,
  GROQ_MODEL: process.env.PROD_GROQ_MODEL,
}

const res = await fetch(
  `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${orgId}`,
  { headers: H },
)
if (!res.ok) {
  console.error(`Could not read env (${res.status})`, await res.text())
  process.exit(1)
}
const { envs } = await res.json()

let failed = 0
for (const [key, value] of Object.entries(WANT)) {
  if (!value) {
    console.log(`SKIP ${key}: no value supplied`)
    continue
  }
  if (envs.some((e) => e.key === key && (e.target ?? []).includes("production"))) {
    console.log(`OK   ${key}: already scoped to production`)
    continue
  }
  const add = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${orgId}`,
    {
      method: "POST",
      headers: H,
      body: JSON.stringify({ key, value, type: "encrypted", target: ["production"] }),
    },
  )
  if (add.ok) {
    console.log(`FIX  ${key}: restored to production`)
  } else {
    failed++
    console.error(`FAIL ${key}: ${add.status}`, await add.text())
  }
}

console.log("\nProduction env after repair:")
const after = await fetch(
  `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${orgId}`,
  { headers: H },
).then((r) => r.json())
for (const e of after.envs.sort((a, b) => a.key.localeCompare(b.key))) {
  console.log(`  ${e.key.padEnd(38)} ${JSON.stringify(e.target)}`)
}

process.exit(failed > 0 ? 1 : 0)
