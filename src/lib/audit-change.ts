import type { Prisma } from "@/generated/prisma/client"

type PlainRecord = Record<string, unknown>

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function pickValues(source: PlainRecord, keys: string[]): PlainRecord {
  return Object.fromEntries(keys.map((key) => [key, source[key]]))
}

export function reversibleSettingsMeta({
  summary,
  before,
  after,
}: {
  summary: string
  before: PlainRecord
  after: PlainRecord
}): Prisma.InputJsonValue {
  return jsonSafe({
    summary,
    rollback: {
      kind: "settings",
      before,
      after,
    },
  }) as Prisma.InputJsonValue
}

export function detailedChangeMeta({
  summary,
  before,
  after,
}: {
  summary: string
  before: PlainRecord
  after: PlainRecord
}): Prisma.InputJsonValue {
  return jsonSafe({ summary, before, after }) as Prisma.InputJsonValue
}

export interface SettingsRollbackSpec {
  kind: "settings"
  before: PlainRecord
  after: PlainRecord
}

export function readSettingsRollback(meta: unknown): SettingsRollbackSpec | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null
  const rollback = (meta as PlainRecord).rollback
  if (!rollback || typeof rollback !== "object" || Array.isArray(rollback)) return null
  const candidate = rollback as PlainRecord
  if (
    candidate.kind !== "settings" ||
    !candidate.before ||
    typeof candidate.before !== "object" ||
    Array.isArray(candidate.before) ||
    !candidate.after ||
    typeof candidate.after !== "object" ||
    Array.isArray(candidate.after)
  ) {
    return null
  }
  return {
    kind: "settings",
    before: candidate.before as PlainRecord,
    after: candidate.after as PlainRecord,
  }
}

export function readAuditChange(
  meta: unknown,
): { before: PlainRecord; after: PlainRecord } | null {
  const rollback = readSettingsRollback(meta)
  if (rollback) return { before: rollback.before, after: rollback.after }
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null
  const record = meta as PlainRecord
  if (
    !record.before ||
    typeof record.before !== "object" ||
    Array.isArray(record.before) ||
    !record.after ||
    typeof record.after !== "object" ||
    Array.isArray(record.after)
  ) {
    return null
  }
  return { before: record.before as PlainRecord, after: record.after as PlainRecord }
}
