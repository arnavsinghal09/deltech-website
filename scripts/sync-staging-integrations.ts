#!/usr/bin/env tsx
/**
 * Copies integration configuration—not application/user data—from Production
 * into the freshly seeded Neon staging database.
 *
 * Google Form reconciliation needs sheetPullSources + ImportPreset mappings,
 * and the public matrix mirror needs sheetSyncUrl. These records live in the
 * database rather than Vercel env, so sharing only the secrets is insufficient.
 */
import "dotenv/config"
import { randomUUID } from "node:crypto"
import { Pool } from "pg"

function need(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

function databaseIdentity(connectionString: string): string {
  const url = new URL(connectionString)
  return `${url.hostname}:${url.port || "5432"}${url.pathname}`
}

async function main() {
  const productionUrl = need("PROD_DATABASE_URL")
  const stagingUrl = need("STAGING_DATABASE_URL")

  if (databaseIdentity(productionUrl) === databaseIdentity(stagingUrl)) {
    throw new Error("Production and staging resolve to the same database; refusing")
  }
  if (!new URL(stagingUrl).hostname.endsWith(".neon.tech")) {
    throw new Error("STAGING_DATABASE_URL must point at Neon; refusing")
  }

  const production = new Pool({ connectionString: productionUrl, max: 1 })
  const staging = new Pool({ connectionString: stagingUrl, max: 1 })
  const settingKeys = ["sheetSyncUrl", "recruitmentSheetUrl", "sheetPullSources"]

  try {
    const settings = await production.query<{ key: string; value: unknown }>(
      `SELECT "key", "value"
         FROM "Setting"
        WHERE "key" = ANY($1::text[])`,
      [settingKeys],
    )
    const presets = await production.query<{
      name: string
      partner: string | null
      mapping: unknown
    }>(
      `SELECT "name", "partner", "mapping"
         FROM "ImportPreset"
        ORDER BY "name"`,
    )

    const client = await staging.connect()
    try {
      await client.query("BEGIN")

      for (const row of settings.rows) {
        await client.query(
          `INSERT INTO "Setting" ("key", "value", "updatedAt")
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT ("key") DO UPDATE
           SET "value" = EXCLUDED."value", "updatedAt" = NOW()`,
          [row.key, JSON.stringify(row.value)],
        )
      }

      const presetNames = presets.rows.map((preset) => preset.name)
      await client.query(
        `DELETE FROM "ImportPreset"
          WHERE NOT ("name" = ANY($1::text[]))`,
        [presetNames],
      )
      for (const preset of presets.rows) {
        await client.query(
          `INSERT INTO "ImportPreset"
             ("id", "name", "partner", "mapping", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())
           ON CONFLICT ("name") DO UPDATE
           SET "partner" = EXCLUDED."partner",
               "mapping" = EXCLUDED."mapping",
               "updatedAt" = NOW()`,
          [randomUUID(), preset.name, preset.partner, JSON.stringify(preset.mapping)],
        )
      }

      await client.query("COMMIT")
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }

    console.log(
      `Synced ${settings.rowCount ?? 0} integration settings and ` +
        `${presets.rowCount ?? 0} import presets into Neon staging.`,
    )
  } finally {
    await Promise.all([production.end(), staging.end()])
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
