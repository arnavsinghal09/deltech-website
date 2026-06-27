"use client"

import { useEffect, useRef, useCallback } from "react"
import { Lock, Unlock, Eye, ChevronRight, Trophy } from "lucide-react"
import { CountdownRing } from "./countdown-ring"
import { VizMCQ } from "./viz-mcq"
import { VizWordCloud } from "./viz-wordcloud"
import { VizScale } from "./viz-scale"
import { VizOpenText } from "./viz-opentext"
import { t } from "@/content/strings"
import type { SlideData, Tally, MCQTally, WordCloudTally, ScaleTally, OpenTextTally, PresentationTheme } from "@/lib/quiz-types"
import { asMCQ, asWordCloud, asScale, asOpenText } from "@/lib/quiz-types"

interface Props {
  slide: SlideData
  slideIndex: number
  slideCount: number
  tally: Tally | null
  theme: PresentationTheme
  mode: "POLL" | "QUIZ"
  locked: boolean
  revealed: boolean
  revealedIndices: number[]
  timerRunning: boolean
  onLock: () => void
  onUnlock: () => void
  onReveal: () => void
  onNext: () => void
  onPrev: () => void
  onLeaderboard: () => void
  onTimerExpire: () => void
}

export function QuestionScreen({
  slide,
  slideIndex,
  slideCount,
  tally,
  theme,
  mode,
  locked,
  revealed,
  revealedIndices,
  timerRunning,
  onLock,
  onUnlock,
  onReveal,
  onNext,
  onPrev,
  onLeaderboard,
  onTimerExpire,
}: Props) {
  const config = slide.config
  const type = slide.type
  const timerSeconds =
    type !== "CONTENT"
      ? (config as { timerSeconds?: number | null }).timerSeconds ?? null
      : null

  const voteCount = tally?.totalVotes ?? 0

  function renderViz() {
    if (!tally) return null
    switch (type) {
      case "MCQ":
        return (
          <VizMCQ
            tally={tally as MCQTally}
            config={asMCQ(config)}
            theme={theme}
            revealedIndices={revealed ? revealedIndices : undefined}
            layout={asMCQ(config).layout}
          />
        )
      case "WORDCLOUD":
        return <VizWordCloud tally={tally as WordCloudTally} theme={theme} />
      case "SCALE":
        return <VizScale tally={tally as ScaleTally} config={asScale(config)} theme={theme} />
      case "OPEN_TEXT":
        return <VizOpenText tally={tally as OpenTextTally} config={asOpenText(config)} theme={theme} />
      default:
        return null
    }
  }

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: theme.background, color: theme.textColor, fontFamily: theme.font }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-4 border-b px-6 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <span className="text-xs opacity-50">
          {t("quiz.slideProgress", { n: slideIndex + 1, total: slideCount })}
        </span>
        <span className="flex-1" />
        <span className="text-xs opacity-50">
          {t("quiz.voteCount", { voted: voteCount, total: "?" })}
        </span>
        {timerSeconds && (
          <CountdownRing
            durationSeconds={timerSeconds}
            running={timerRunning && !locked}
            accentColor={theme.accentColor}
            onExpire={onTimerExpire}
          />
        )}
      </div>

      {/* Prompt */}
      <div className="px-8 py-6">
        <h1 className="text-3xl font-bold leading-snug">{slide.prompt || t("quiz.builder.promptPlaceholder")}</h1>
      </div>

      {/* Viz */}
      <div className="flex-1 overflow-auto">
        {renderViz()}
        {type === "CONTENT" && (
          <div className="px-8 text-xl opacity-80" style={{ lineHeight: 1.6 }}>
            {(config as { body?: string }).body}
          </div>
        )}
      </div>

      {/* Host controls */}
      <div
        className="flex items-center gap-2 border-t px-6 py-3"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <button
          onClick={onPrev}
          disabled={slideIndex === 0}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-30 hover:opacity-80"
          style={{ borderColor: theme.accentColor, color: theme.accentColor }}
        >
          {t("quiz.prevSlide")}
        </button>

        {type !== "CONTENT" && !locked && (
          <button
            onClick={onLock}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
            style={{ background: "#f59e0b", color: "#fff" }}
          >
            <Lock className="size-3" /> {t("quiz.lockVoting")}
          </button>
        )}

        {type !== "CONTENT" && locked && !revealed && (
          <button
            onClick={onUnlock}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ borderColor: theme.accentColor, color: theme.accentColor }}
          >
            <Unlock className="size-3" /> Unlock
          </button>
        )}

        {type === "MCQ" && mode === "QUIZ" && locked && !revealed && (
          <button
            onClick={onReveal}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
            style={{ background: "#22c55e", color: "#fff" }}
          >
            <Eye className="size-3" /> {t("quiz.revealResults")}
          </button>
        )}

        {mode === "QUIZ" && (
          <button
            onClick={onLeaderboard}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ borderColor: theme.accentColor, color: theme.accentColor }}
          >
            <Trophy className="size-3" /> {t("quiz.leaderboard")}
          </button>
        )}

        <span className="flex-1" />

        <button
          onClick={onNext}
          className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: theme.accentColor, color: "#fff" }}
        >
          {t("quiz.nextSlide")} <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
