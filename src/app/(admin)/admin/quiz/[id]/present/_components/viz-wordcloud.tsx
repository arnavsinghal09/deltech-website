"use client"

import { motion } from "framer-motion"
import type { WordCloudTally, PresentationTheme } from "@/lib/quiz-types"

interface Props {
  tally: WordCloudTally
  theme: PresentationTheme
}

const COLORS = ["#0f766e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#22c55e", "#f97316", "#06b6d4"]

export function VizWordCloud({ tally, theme }: Props) {
  const words = tally.words.slice(0, 40)
  if (words.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm opacity-50" style={{ color: theme.textColor }}>
        No responses yet
      </div>
    )
  }

  const maxCount = words[0]?.count ?? 1
  const minCount = words[words.length - 1]?.count ?? 1

  function fontSize(count: number) {
    if (maxCount === minCount) return 32
    const pct = (count - minCount) / (maxCount - minCount)
    return Math.round(14 + pct * 52)
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 py-4">
      {words.map((w, i) => (
        <motion.span
          key={w.text}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.9 }}
          transition={{ delay: i * 0.03, type: "spring", stiffness: 200, damping: 20 }}
          className="cursor-default select-none font-semibold leading-none"
          style={{
            fontSize: fontSize(w.count),
            color: COLORS[i % COLORS.length],
          }}
          title={`${w.text}: ${w.count}`}
        >
          {w.text}
        </motion.span>
      ))}
    </div>
  )
}
