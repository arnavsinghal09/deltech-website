import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseConfig } from "@/lib/quiz-types"
import type { SlideType, MCQConfig, ScaleConfig, Tally } from "@/lib/quiz-types"

export async function GET(
  _request: Request,
  props: { params: Promise<{ sessionId: string; slideId: string }> },
) {
  const { sessionId, slideId } = await props.params

  const slide = await prisma.slide.findUnique({
    where: { id: slideId },
    select: { type: true, config: true },
  })
  if (!slide) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const responses = await prisma.response.findMany({
    where: { sessionId, slideId },
    select: { answer: true, nickname: true },
  })

  const type = slide.type as SlideType
  const config = parseConfig(slide.config, type)
  const total = responses.length

  let tally: Tally

  switch (type) {
    case "MCQ": {
      const mcq = config as MCQConfig
      const counts = new Array<number>(mcq.options.length).fill(0)
      for (const r of responses) {
        const ans = r.answer as { selectedIndices?: number[] }
        for (const idx of ans.selectedIndices ?? []) {
          if (idx >= 0 && idx < counts.length) counts[idx]++
        }
      }
      tally = {
        type: "MCQ",
        totalVotes: total,
        counts,
        percentages: counts.map((c) => (total > 0 ? Math.round((c / total) * 100) : 0)),
      }
      break
    }
    case "WORDCLOUD": {
      const freq: Record<string, number> = {}
      for (const r of responses) {
        const ans = r.answer as { words?: string[] }
        for (const w of ans.words ?? []) {
          const key = w.trim().toLowerCase()
          if (key) freq[key] = (freq[key] ?? 0) + 1
        }
      }
      const words = Object.entries(freq)
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 60)
      tally = { type: "WORDCLOUD", totalVotes: total, words }
      break
    }
    case "SCALE": {
      const sc = config as ScaleConfig
      const statCount = sc.statements.length
      const sums = new Array<number>(statCount).fill(0)
      const distCounts = sc.statements.map(() =>
        new Array<number>(sc.max - sc.min + 1).fill(0),
      )
      let voters = 0
      for (const r of responses) {
        const ans = r.answer as { values?: number[] }
        if (!ans.values?.length) continue
        voters++
        for (let i = 0; i < statCount; i++) {
          const v: number = ans.values[i] ?? sc.min
          sums[i] += v
          const tickIdx = v - sc.min
          if (tickIdx >= 0 && tickIdx < distCounts[i].length) distCounts[i][tickIdx]++
        }
      }
      tally = {
        type: "SCALE",
        totalVotes: total,
        averages: sums.map((s) => (voters > 0 ? Math.round((s / voters) * 10) / 10 : sc.min)),
        distributions: distCounts,
      }
      break
    }
    case "OPEN_TEXT": {
      const textResponses = responses
        .map((r) => ({
          text: ((r.answer as { text?: string }).text ?? "").trim(),
          nickname: r.nickname ?? "",
        }))
        .filter((r) => r.text)
      tally = { type: "OPEN_TEXT", totalVotes: total, responses: textResponses }
      break
    }
    default:
      tally = { type: "CONTENT", totalVotes: 0 }
  }

  return NextResponse.json(tally)
}
