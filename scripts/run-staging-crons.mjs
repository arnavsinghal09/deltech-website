#!/usr/bin/env node
// Vercel only schedules crons for Production deployments. This invokes the
// same protected routes on the stable Preview deployment so they operate on
// Neon staging data. The shared CRON_SECRET is read from Vercel and never
// written to logs or GitHub outputs.
import { readFileSync } from "node:fs"

const token = process.env.VERCEL_TOKEN
if (!token) throw new Error("VERCEL_TOKEN is required")

const stagingOrigin = process.env.STAGING_ORIGIN ?? "https://test.deltechmun.in"
const { projectId, orgId } = JSON.parse(readFileSync(".vercel/project.json", "utf8"))
const envResponse = await fetch(
  `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${orgId}&decrypt=true`,
  { headers: { Authorization: `Bearer ${token}` } },
)
if (!envResponse.ok) {
  throw new Error(`Could not read Vercel Preview env (${envResponse.status})`)
}

const { envs } = await envResponse.json()
const cronSecret = envs.find(
  (env) => env.key === "CRON_SECRET" && (env.target ?? []).includes("preview"),
)?.value
if (!cronSecret) throw new Error("CRON_SECRET is not configured for Vercel Preview")

for (const path of ["/api/cron/payment-reminder", "/api/cron/gform-sync"]) {
  const response = await fetch(`${stagingOrigin}${path}`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
    signal: AbortSignal.timeout(60_000),
  })
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`${path} failed (${response.status}): ${body.slice(0, 500)}`)
  }
  console.log(`${path}: ${response.status} ${body.slice(0, 500)}`)
}
