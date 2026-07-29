"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"
import { audit } from "@/lib/audit"
import type { Role } from "@/generated/prisma/client"

const ASSIGNABLE: Role[] = ["ADMIN", "MAINTAINER", "AUTHOR", "REGISTERER"]

// Creates the User row with the right role, then emails a pointer to the
// staff door. No hand-minted tokens, the normal magic-link flow signs them in.
export async function inviteStaff(
  email: string,
  role: Role,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()
  const normalized = email.trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return { success: false, error: "Enter a valid email." }
  }
  if (!ASSIGNABLE.includes(role)) return { success: false, error: "Invalid role." }

  try {
    const user = await prisma.user.create({ data: { email: normalized, role } })
    await audit(session.user?.email ?? "unknown", "user.invite", "User", user.id, {
      email: normalized,
      role,
    })
    void import("@/lib/resend")
      .then(({ sendStaffInvite }) => sendStaffInvite(normalized, role))
      .catch(() => undefined)
    return { success: true }
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "P2002") {
      return { success: false, error: "A user with this email already exists, change their role below instead." }
    }
    return { success: false, error: "Failed to invite." }
  }
}

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
