"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
}

export async function approvePost(postId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await prisma.post.update({
      where: { id: postId },
      data: { status: "PUBLISHED", publishedAt: new Date(), reviewNote: null },
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to approve." }
  }
  void import("@/lib/resend")
    .then(({ sendBlogApproved }) => sendBlogApproved(postId))
    .catch(() => {})
  redirect("/admin/blog")
}

export async function requestChanges(
  postId: string,
  reviewNote: string,
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await prisma.post.update({
      where: { id: postId },
      data: { status: "CHANGES_REQUESTED", reviewNote },
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed." }
  }
  void import("@/lib/resend")
    .then(({ sendBlogChangesRequested }) => sendBlogChangesRequested(postId))
    .catch(() => {})
  redirect("/admin/blog")
}

export async function rejectPost(
  postId: string,
  reason: string,
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await prisma.post.update({
      where: { id: postId },
      data: { status: "REJECTED", reviewNote: reason },
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to reject." }
  }
  redirect("/admin/blog")
}
