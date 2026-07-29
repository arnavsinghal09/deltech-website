"use server"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { audit } from "@/lib/audit"


// A failed notification must not undo a completed review, but it also must not
// vanish: EmailLog records it and the failed-email card on /admin surfaces it.
async function notifyAuthor(send: () => Promise<void>): Promise<void> {
  try {
    await send()
  } catch (err) {
    console.error("[blog review] author notification failed", err)
  }
}

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
  await notifyAuthor(() => import("@/lib/resend").then((m) => m.sendBlogApproved(postId)))
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
  await notifyAuthor(() => import("@/lib/resend").then((m) => m.sendBlogChangesRequested(postId)))
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
  // Rejection used to send nothing at all, unlike approve and requestChanges.
  // The author saw a red badge with no reason and could not resubmit.
  await notifyAuthor(() => import("@/lib/resend").then((m) => m.sendBlogRejected(postId)))
  redirect("/admin/blog")
}
