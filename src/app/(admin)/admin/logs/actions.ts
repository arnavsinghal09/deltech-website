"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"
import { readSettingsRollback } from "@/lib/audit-change"

type Result = { success: boolean; error?: string }

function comparable(value: unknown): string {
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(canonical)
    if (input && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, nested]) => [key, canonical(nested)]),
      )
    }
    return input
  }
  return JSON.stringify(canonical(value))
}

function refreshAffectedPages() {
  revalidatePath("/", "layout")
  revalidatePath("/admin/logs")
  revalidatePath("/admin/config")
  revalidatePath("/admin")
  revalidatePath("/availability")
  revalidatePath("/register")
  revalidatePath("/dashboard")
}

export async function rollbackAuditLog(logId: string): Promise<Result> {
  const session = await requireAdmin()
  const log = await prisma.auditLog.findUnique({ where: { id: logId } })
  if (!log) return { success: false, error: "This log entry no longer exists." }

  const rollback = readSettingsRollback(log.meta)
  if (!rollback) {
    return { success: false, error: "This entry is informational and cannot be rolled back." }
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const alreadyRolledBack = await tx.auditLog.findFirst({
          where: { action: "audit.rollback", entity: "AuditLog", entityId: log.id },
          select: { id: true },
        })
        if (alreadyRolledBack) throw new Error("ALREADY_ROLLED_BACK")

        const keys = Object.keys(rollback.after).sort()
        const currentRows = await tx.setting.findMany({ where: { key: { in: keys } } })
        const current = new Map(currentRows.map((row) => [row.key, row.value]))

        for (const key of keys) {
          if (comparable(current.get(key)) !== comparable(rollback.after[key])) {
            throw new Error("STALE_STATE")
          }
        }

        for (const key of keys) {
          await tx.setting.upsert({
            where: { key },
            update: { value: rollback.before[key] as never },
            create: { key, value: rollback.before[key] as never },
          })
        }

        await tx.auditLog.create({
          data: {
            actorEmail: session.user?.email ?? "unknown",
            action: "audit.rollback",
            entity: "AuditLog",
            entityId: log.id,
            meta: {
              originalAction: log.action,
              restoredKeys: keys,
            },
          },
        })
      },
      { isolationLevel: "Serializable" },
    )
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_ROLLED_BACK") {
      return { success: false, error: "This change has already been rolled back." }
    }
    if (error instanceof Error && error.message === "STALE_STATE") {
      return {
        success: false,
        error: "A newer change touched the same settings. Roll it back first, or keep the newer state.",
      }
    }
    return { success: false, error: "Rollback could not be completed safely. Try again." }
  }

  refreshAffectedPages()
  return { success: true }
}
