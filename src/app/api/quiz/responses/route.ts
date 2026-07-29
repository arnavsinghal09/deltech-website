import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseConfig } from "@/lib/quiz-types"
import type { MCQConfig, SlideType } from "@/lib/quiz-types"

// POST — participant submits an answer
export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId: string
    slideId: string
    nickname: string
    avatar: string
    answer: unknown
    submittedAt: number   // unix ms — for speed scoring
  }

  const { sessionId, slideId, nickname, avatar, answer, submittedAt } = body

  // These three are independent, so one round trip instead of three. On a
  // phone at the venue that is most of the perceived latency of answering.
  const [session, slide, existing] = await Promise.all([
    prisma.quizSession.findUnique({
      where: { id: sessionId },
      select: { status: true, presentationId: true },
    }),
    prisma.slide.findUnique({
      where: { id: slideId },
      select: { type: true, config: true },
    }),
    prisma.response.findFirst({ where: { sessionId, slideId, nickname } }),
  ])

  if (!session || session.status === "ended") {
    return NextResponse.json({ error: "session_not_active" }, { status: 400 })
  }
  if (!slide) return NextResponse.json({ error: "slide_not_found" }, { status: 404 })
  // Friendly path only; the unique index is the actual guard on the create.
  if (existing) {
    return NextResponse.json({ error: "already_submitted" }, { status: 409 })
  }

  // Score (QUIZ mode — check correctness)
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

  // Current rank for this participant (total points).
  //
  // This used to groupBy every nickname in the session and filter in JS, so a
  // 200-person 20-slide quiz aggregated over a table growing to 4000 rows on
  // every single submission, all to show one number the participant sees again
  // on the real leaderboard 15 seconds later. Two aggregates instead.
  let rank: number | null = null
  if (correct !== null) {
    const mine = await prisma.response.aggregate({
      where: { sessionId, nickname },
      _sum: { points: true },
    })
    const myTotal = mine._sum.points ?? points

    const ahead = await prisma.response.groupBy({
      by: ["nickname"],
      where: { sessionId },
      _sum: { points: true },
      having: { points: { _sum: { gt: myTotal } } },
    })
    rank = ahead.length + 1
  }

  return NextResponse.json({ correct, points, rank })
}
