"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ConfettiBurst } from "./confetti-burst"
import { t } from "@/content/strings"
import type { LBEntry, PresentationTheme } from "@/lib/quiz-types"

interface Props {
  entries: LBEntry[]
  final: boolean
  theme: PresentationTheme
  onNext?: () => void
  onEnd?: () => void
}

export function LeaderboardScreen({ entries, final, theme, onNext, onEnd }: Props) {
  const top = entries.slice(0, 10)

  return (
    <div
      className="relative flex h-full flex-col items-center justify-start gap-6 overflow-hidden px-8 py-10"
      style={{ background: theme.background, color: theme.textColor, fontFamily: theme.font }}
    >
      <ConfettiBurst active={final} />

      <h2 className="text-3xl font-bold" style={{ color: theme.accentColor }}>
        {final ? t("quiz.finalResults") : t("quiz.leaderboard")}
      </h2>

      <div className="w-full max-w-xl space-y-2">
        <AnimatePresence>
          {top.map((entry, i) => (
            <motion.div
              key={entry.nickname}
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 180, damping: 20 }}
              className="flex items-center gap-4 rounded-xl px-4 py-3"
              style={{
                background: i === 0 ? theme.accentColor + "33" : "rgba(255,255,255,0.08)",
                border: i === 0 ? `1px solid ${theme.accentColor}66` : "1px solid transparent",
              }}
            >
              <span className="w-8 text-center text-lg font-bold" style={{ color: theme.accentColor }}>
                {t("quiz.rankN", { n: entry.rank })}
              </span>
              <span className="text-2xl">{entry.avatar || "👤"}</span>
              <span className="flex-1 font-medium">{entry.nickname}</span>
              <span className="font-bold tabular-nums" style={{ color: theme.accentColor }}>
                {entry.totalPoints.toLocaleString()}
              </span>
              {entry.delta !== undefined && (
                <span
                  className="text-xs tabular-nums"
                  style={{ color: entry.delta > 0 ? "#22c55e" : entry.delta < 0 ? "#ef4444" : undefined, opacity: 0.7 }}
                >
                  {entry.delta > 0 ? `▲${entry.delta}` : entry.delta < 0 ? `▼${Math.abs(entry.delta)}` : "-"}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-auto flex gap-3">
        {!final && onNext && (
          <button
            onClick={onNext}
            className="rounded-xl px-8 py-2.5 font-semibold transition-opacity hover:opacity-90"
            style={{ background: theme.accentColor, color: "#fff" }}
          >
            {t("quiz.nextSlide")}
          </button>
        )}
        {onEnd && (
          <button
            onClick={onEnd}
            className="rounded-xl border px-8 py-2.5 font-semibold transition-opacity hover:opacity-80"
            style={{ borderColor: theme.accentColor, color: theme.accentColor }}
          >
            {t("quiz.endSession")}
          </button>
        )}
      </div>
    </div>
  )
}
