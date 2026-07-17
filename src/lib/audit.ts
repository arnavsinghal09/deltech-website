import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

// Best-effort audit trail. Never throws — an audit failure must not break the action.
export async function audit(
  actorEmail: string,
  action: string,
  entity: string,
  entityId?: string,
  meta?: Prisma.InputJsonValue,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { actorEmail, action, entity, entityId, meta },
    })
  } catch (err) {
    console.error("[audit]", action, entity, err)
  }
}
