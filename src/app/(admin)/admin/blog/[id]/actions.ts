"use server"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { audit } from "@/lib/audit"

export async function approvePost(postId: string): Promise<{ error?: string }> {
  const session = await requireStaff()
  try {
    await prisma.post.update({
      where: { id: postId },
      data: { status: "PUBLISHED", publishedAt: new Date(), reviewNote: null },
    })
    await audit(session.user?.email ?? "unknown", "post.approve", "Post", postId)
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
  const session = await requireStaff()
  try {
    await prisma.post.update({
      where: { id: postId },
      data: { status: "CHANGES_REQUESTED", reviewNote },
    })
    await audit(session.user?.email ?? "unknown", "post.requestChanges", "Post", postId)
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
  const session = await requireStaff()
  try {
    await prisma.post.update({
      where: { id: postId },
      data: { status: "REJECTED", reviewNote: reason },
    })
    await audit(session.user?.email ?? "unknown", "post.reject", "Post", postId)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to reject." }
  }
  redirect("/admin/blog")
}
