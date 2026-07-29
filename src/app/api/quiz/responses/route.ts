import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseConfig } from "@/lib/quiz-types"
import type { MCQConfig, SlideType } from "@/lib/quiz-types"

// POST, participant submits an answer
export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId: string
    slideId: string
    nickname: string
    avatar: string
    answer: unknown
    submittedAt: number   // unix ms, for speed scoring
  }

  const { sessionId, slideId, nickname, avatar, answer, submittedAt } = body

  // Verify session is active
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    select: { status: true, presentationId: true },
  })
  if (!session || session.status === "ended") {
    return NextResponse.json({ error: "session_not_active" }, { status: 400 })
  }

  // Get slide for scoring
  const slide = await prisma.slide.findUnique({
    where: { id: slideId },
    select: { type: true, config: true },
  })
  if (!slide) return NextResponse.json({ error: "slide_not_found" }, { status: 404 })

  // Prevent double submission
  const existing = await prisma.response.findFirst({ where: { sessionId, slideId, nickname } })
  if (existing) {
    return NextResponse.json({ error: "already_submitted" }, { status: 409 })
  }

  // Score (QUIZ mode, check correctness)
  let points = 0
  let correct: boolean | null = null

  const type = slide.type as SlideType
  const config = parseConfig(slide.config, type)

  if (type === "MCQ") {
    const mcqConfig = config as MCQConfig
    if (mcqConfig.correct && mcqConfig.correct.length > 0) {
      const submitted = (answer as { selectedIndices: number[] }).selectedIndices ?? []
      const correctSet = new Set(mcqConfig.correct)
      const submittedSet = new Set(submitted)
      correct =
        submittedSet.size === correctSet.size &&
        [...submittedSet].every((i) => correctSet.has(i))

      if (correct) {
        // Speed bonus: max 1000, scales by how quickly answered relative to timer
        if (mcqConfig.timerSeconds) {
          const elapsed = Math.min(submittedAt / 1000, mcqConfig.timerSeconds)
          points = Math.round(1000 * (1 - (elapsed / mcqConfig.timerSeconds) * 0.5))
        } else {
          points = 1000
        }
      }
    }
  }

  await prisma.response.create({
    data: {
      sessionId,
      slideId,
      nickname,
      answer: answer as never,
      points,
    },
  })

  // Current rank for this participant (total points)
  let rank: number | null = null
  if (correct !== null) {
    const allNicknames = await prisma.response.groupBy({
      by: ["nickname"],
      where: { sessionId },
      _sum: { points: true },
    })
    const myTotal = allNicknames.find((r) => r.nickname === nickname)?._sum.points ?? points
    const aheadOf = allNicknames.filter((r) => (r._sum.points ?? 0) > myTotal).length
    rank = aheadOf + 1
  }

  return NextResponse.json({ correct, points, rank })
}
