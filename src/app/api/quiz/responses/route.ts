import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
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
  }

  // NOTE: the body used to carry `submittedAt`, which fed the speed bonus
  // directly. Anyone could POST 0 and score full marks on every correct
  // answer regardless of how long they actually took. Elapsed time is now
  // derived from QuizSession.currentSlideStartedAt and the request body's
  // clock is ignored entirely.
  const { sessionId, slideId, nickname, answer } = body

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limit = await rateLimit(RATE_LIMITS.quizAnswer, `${sessionId}:${ip}`)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    )
  }

  // These three are independent, so one round trip instead of three. On a
  // phone at the venue that is most of the perceived latency of answering.
  const [session, slide, existing] = await Promise.all([
    prisma.quizSession.findUnique({
      where: { id: sessionId },
      select: {
        status: true,
        presentationId: true,
        currentSlideId: true,
        currentSlideStartedAt: true,
      },
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

  // Answers are only accepted for the slide the presenter has actually put on
  // screen. Without this, any slide could be answered at any time, including
  // ones already past.
  if (session.currentSlideId && session.currentSlideId !== slideId) {
    return NextResponse.json({ error: "slide_not_active" }, { status: 409 })
  }

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
        // Speed bonus: max 1000, scaling with how quickly they answered
        // relative to the timer. Measured against the server's own record of
        // when the slide went live, clamped into range so a missing or skewed
        // start time degrades to the no-bonus score rather than a free 1000.
        const startedAt = session.currentSlideStartedAt
        if (mcqConfig.timerSeconds && startedAt) {
          const elapsedS = (Date.now() - startedAt.getTime()) / 1000
          const clamped = Math.min(Math.max(elapsedS, 0), mcqConfig.timerSeconds)
          points = Math.round(1000 * (1 - (clamped / mcqConfig.timerSeconds) * 0.5))
        } else {
          points = 1000
        }
      }
    }
  }

  // The findFirst above is only for the friendly 409. This is the real guard:
  // two taps milliseconds apart both cleared that check and scored twice.
  try {
    await prisma.response.create({
      data: {
        sessionId,
        slideId,
        nickname,
        answer: answer as never,
        points,
      },
    })
  } catch (err) {
    if (
      typeof err === "object" && err !== null && "code" in err &&
      (err as { code: unknown }).code === "P2002"
    ) {
      return NextResponse.json({ error: "already_submitted" }, { status: 409 })
    }
    throw err
  }

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
