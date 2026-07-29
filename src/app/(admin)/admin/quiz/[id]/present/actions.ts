"use server"

import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { createOrGetQuizSession } from "@/lib/quiz-session"

export async function createOrGetSession(presentationId: string): Promise<string> {
  await requireStaff()
  const session = await createOrGetQuizSession(presentationId)
  return session.id
}

// Records which slide is live and when it went live, so scoring does not have
// to trust the participant's clock. The presenter broadcasts GOTO over
// Realtime for latency; this is the authoritative record.
export async function startSlide(sessionId: string, slideId: string): Promise<void> {
  await requireStaff()
  await prisma.quizSession.update({
    where: { id: sessionId },
    data: { currentSlideId: slideId, currentSlideStartedAt: new Date(), status: "active" },
  })
}

export async function endSession(sessionId: string): Promise<void> {
  await requireStaff()
  await prisma.quizSession.update({
    where: { id: sessionId },
    data: { status: "ended", endedAt: new Date() },
  })
}

export async function computeLeaderboard(
  sessionId: string,
): Promise<{ nickname: string; avatar: string; totalPoints: number; rank: number }[]> {
  await requireStaff()

  const rows = await prisma.response.groupBy({
    by: ["nickname"],
    where: { sessionId },
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
  })

  // Grab avatars: take the most recent response per nickname that has avatar info
  // (avatar stored separately, look it up from a recent session presence snapshot)
  // We store avatars in nickname responses via the response table only if we add avatar field.
  // Since the Response model doesn't have avatar, we use the presence state from the broadcast.
  // This action only returns scores; the caller supplies avatar from presence state.
  return rows.map((r, i) => ({
    nickname: r.nickname ?? "Anonymous",
    avatar: "",
    totalPoints: r._sum.points ?? 0,
    rank: i + 1,
  }))
}
