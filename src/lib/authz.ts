import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import type { Session } from "next-auth"

const STAFF_ROLES = new Set(["ADMIN", "MAINTAINER"])

// ADMIN or MAINTAINER — the default guard for admin server actions.
export async function requireStaff(): Promise<Session> {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session || !role || !STAFF_ROLES.has(role)) redirect("/signin")
  return session
}

// ADMIN only — destructive / money / role actions.
export async function requireAdmin(): Promise<Session> {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") redirect("/signin")
  return session
}
