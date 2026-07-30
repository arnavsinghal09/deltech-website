#!/usr/bin/env tsx

function need(name: string): URL {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return new URL(value)
}

function identity(url: URL): string {
  return `${url.hostname.replace("-pooler", "")}${url.pathname}`
}

const stagingDirect = need("STAGING_DIRECT_URL")
const stagingRuntime = need("STAGING_DATABASE_URL")
const productionDirect = need("PROD_DIRECT_URL")
const productionRuntime = need("PROD_DATABASE_URL")

for (const [name, url] of [
  ["STAGING_DIRECT_URL", stagingDirect],
  ["STAGING_DATABASE_URL", stagingRuntime],
] as const) {
  if (!url.hostname.endsWith(".neon.tech")) {
    throw new Error(`${name} must point at the Neon Test database`)
  }
}

if (stagingDirect.hostname.includes("-pooler")) {
  throw new Error("STAGING_DIRECT_URL must use the unpooled Neon endpoint")
}
if (!stagingRuntime.hostname.includes("-pooler")) {
  throw new Error("STAGING_DATABASE_URL must use the pooled Neon endpoint")
}
if (identity(stagingDirect) !== identity(stagingRuntime)) {
  throw new Error("The Test migration and runtime URLs point at different Neon databases")
}

for (const production of [productionDirect, productionRuntime]) {
  if (identity(stagingDirect) === identity(production)) {
    throw new Error("Test and Production resolve to the same database; refusing")
  }
}

console.log("✅ Test and Production databases are separate")
