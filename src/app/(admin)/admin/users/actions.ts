"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"
import { audit } from "@/lib/audit"
import type { Role } from "@/generated/prisma/client"

const ASSIGNABLE: Role[] = ["ADMIN", "MAINTAINER", "AUTHOR", "REGISTERER"]

export async function setUserRole(
  userId: string,
  role: Role,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()
  if (!ASSIGNABLE.includes(role)) return { success: false, error: "Invalid role." }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!target) return { success: false, error: "User not found." }
  if (target.email === session.user?.email) {
    return { success: false, error: "You can't change your own role." }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } })
  await audit(session.user?.email ?? "unknown", "user.setRole", "User", userId, {
    email: target.email,
    role,
  })
  return { success: true }
}
