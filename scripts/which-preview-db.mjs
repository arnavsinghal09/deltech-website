#!/usr/bin/env node
// Prints "staging", "production" or "unknown": which database the Preview
// environment scope actually points at.
//
// This deliberately queries the Vercel API rather than reading the file
// `vercel pull` writes. That file comes back with every application variable
// replaced by the same short placeholder for this project, so comparing values
// out of it always mismatches and would tell reviewers a preview was on
// production when it was not.
import { readFileSync } from "node:fs"

const token = process.env.VERCEL_TOKEN
const expected = process.env.STAGING_DATABASE_URL

if (!token) {
  console.log("unknown")
  process.exit(0)
}

try {
  const { projectId, orgId } = JSON.parse(readFileSync(".vercel/project.json", "utf8"))
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${orgId}&decrypt=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) {
    console.log("unknown")
    process.exit(0)
  }
  const { envs } = await res.json()
  const preview = envs.find(
    (e) => e.key === "DATABASE_URL" && (e.target ?? []).includes("preview"),
  )?.value
  const production = envs.find(
    (e) => e.key === "DATABASE_URL" && (e.target ?? []).includes("production"),
  )?.value

  if (!preview) console.log("unknown")
  else if (production && preview === production) console.log("production")
  else if (expected && preview === expected) console.log("staging")
  else if (/neon\.tech/.test(preview)) console.log("staging")
  else console.log("unknown")
} catch {
  console.log("unknown")
}
