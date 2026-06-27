"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
}

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createOrGetSession(presentationId: string): Promise<string> {
  await requireAdmin()

  const existing = await prisma.quizSession.findFirst({
    where: { presentationId, status: { in: ["lobby", "active"] } },
    select: { id: true },
  })
  if (existing) return existing.id

  let roomCode = generateRoomCode()
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.quizSession.findFirst({ where: { roomCode }, select: { id: true } })
    if (!clash) break
    roomCode = generateRoomCode()
  }

  const session = await prisma.quizSession.create({
    data: { presentationId, roomCode, status: "lobby" },
    select: { id: true },
  })
  return session.id
}

export async function endSession(sessionId: string): Promise<void> {
  await requireAdmin()
  await prisma.quizSession.update({
    where: { id: sessionId },
    data: { status: "ended", endedAt: new Date() },
  })
}

export async function computeLeaderboard(
  sessionId: string,
): Promise<{ nickname: string; avatar: string; totalPoints: number; rank: number }[]> {
  await requireAdmin()

  const rows = await prisma.response.groupBy({
    by: ["nickname"],
    where: { sessionId },
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
  })

  // Grab avatars: take the most recent response per nickname that has avatar info
  // (avatar stored separately — look it up from a recent session presence snapshot)
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
