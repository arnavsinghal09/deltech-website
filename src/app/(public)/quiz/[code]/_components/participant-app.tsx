"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { t } from "@/content/strings"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AVATARS, type SlideData, type QuizBroadcast, type LBEntry, type MCQConfig, type ScaleConfig, type WordCloudConfig, type OpenTextConfig } from "@/lib/quiz-types"
import { asMCQ, asScale, asWordCloud, asOpenText } from "@/lib/quiz-types"

type AppState =
  | "nickname"
  | "avatar"
  | "lobby"
  | "question"
  | "submitted"
  | "result"
  | "leaderboard"
  | "ended"

interface ResultData { correct: boolean | null; points: number; rank: number | null }

interface Props {
  sessionId: string
  roomCode: string
  initialStatus: string
  presentationMode: "POLL" | "QUIZ"
  presentationTitle: string
}

function randomUserId() {
  return Math.random().toString(36).slice(2)
}

export function ParticipantApp({ sessionId, roomCode, initialStatus, presentationMode, presentationTitle }: Props) {
  const [appState, setAppState] = useState<AppState>(
    initialStatus === "ended" ? "ended" : "nickname"
  )
  const [nickname, setNickname] = useState("")
  const [nicknameInput, setNicknameInput] = useState("")
  const [nicknameError, setNicknameError] = useState("")
  const [avatar, setAvatar] = useState<string>("")
  const [currentSlide, setCurrentSlide] = useState<SlideData | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [slideCount, setSlideCount] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lbEntries, setLbEntries] = useState<LBEntry[]>([])
  const [lbFinal, setLbFinal] = useState(false)
  const [result, setResult] = useState<ResultData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [slideStartMs, setSlideStartMs] = useState(0)

  // MCQ state
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  // Word cloud state
  const [words, setWords] = useState<string[]>([""])
  // Scale state
  const [scaleValues, setScaleValues] = useState<number[]>([])
  // Open text state
  const [openText, setOpenText] = useState("")

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const userIdRef = useRef(randomUserId())
  const submittedRef = useRef(false)

  const joinChannel = useCallback((nick: string, ava: string) => {
    const channel = supabase.channel(`quiz:${roomCode}`)

    channel
      .on("broadcast", { event: "quiz" }, ({ payload }: { payload: QuizBroadcast }) => {
        if (payload.event === "START") {
          // Host has started — remain in lobby until GOTO
        } else if (payload.event === "GOTO") {
          submittedRef.current = false
          setCurrentSlide(payload.slide)
          setSlideIndex(payload.slideIndex)
          setSlideCount(payload.slideCount)
          setLocked(false)
          setResult(null)
          setSelectedIndices([])
          setWords([""])
          setOpenText("")
          setSlideStartMs(Date.now())

          // Initialise scale values
          if (payload.slide.type === "SCALE") {
            const sc = asScale(payload.slide.config)
            setScaleValues(sc.statements.map(() => Math.round((sc.min + sc.max) / 2)))
          }

          setAppState("question")
        } else if (payload.event === "LOCK") {
          setLocked(true)
          if (!submittedRef.current) setAppState("submitted") // didn't answer in time
        } else if (payload.event === "UNLOCK") {
          setLocked(false)
          if (!submittedRef.current) setAppState("question")
        } else if (payload.event === "REVEAL") {
          // If they submitted, we already have result — nothing extra needed
        } else if (payload.event === "LEADERBOARD") {
          setLbEntries(payload.entries)
          setLbFinal(payload.final)
          setAppState("leaderboard")
        } else if (payload.event === "END") {
          setAppState("ended")
        }
      })
      .subscribe(() => {
        channel.track({ nickname: nick, avatar: ava, userId: userIdRef.current })
      })

    channelRef.current = channel
  }, [roomCode])

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  // ── Nickname submit ────────────────────────────────────────────────────────
  function handleNicknameSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nicknameInput.trim()
    if (!trimmed) { setNicknameError(t("quiz.nicknameRequired")); return }
    setNicknameError("")
    setNickname(trimmed)
    if (presentationMode === "QUIZ") {
      setAppState("avatar")
    } else {
      const ava = AVATARS[0]
      setAvatar(ava)
      joinChannel(trimmed, ava)
      setAppState("lobby")
    }
  }

  function handleAvatarSelect(ava: string) {
    setAvatar(ava)
    joinChannel(nickname, ava)
    setAppState("lobby")
  }

  // ── Answer submit ──────────────────────────────────────────────────────────
  async function submitAnswer(answer: unknown) {
    if (submittedRef.current || !currentSlide) return
    submittedRef.current = true
    setSubmitting(true)

    const elapsed = Date.now() - slideStartMs
    const res = await fetch("/api/quiz/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        slideId: currentSlide.id,
        nickname,
        avatar,
        answer,
        submittedAt: elapsed,
      }),
    })

    setSubmitting(false)
    if (res.ok) {
      const data = (await res.json()) as ResultData
      setResult(data)
      setAppState("result")
    } else {
      setAppState("submitted")
    }
  }

  // ── MCQ submit ─────────────────────────────────────────────────────────────
  function handleMCQToggle(idx: number) {
    if (locked || submittedRef.current) return
    const config = asMCQ(currentSlide!.config)
    if (config.allowMultiple) {
      setSelectedIndices((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      )
    } else {
      setSelectedIndices([idx])
      // auto-submit on single select
      void submitAnswer({ selectedIndices: [idx] })
    }
  }

  function handleMCQSubmit() {
    if (selectedIndices.length === 0) return
    void submitAnswer({ selectedIndices })
  }

  // ── My rank from leaderboard entries ──────────────────────────────────────
  const myEntry = lbEntries.find((e) => e.nickname === nickname)

  // ─────────────────────────────────────────────────────────────────────────
  // SCREENS
  // ─────────────────────────────────────────────────────────────────────────

  if (appState === "ended") {
    return (
      <Screen>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">🎉</span>
          <h1 className="text-2xl font-bold">{t("quiz.sessionEnded")}</h1>
          {myEntry && (
            <p className="text-lg text-muted-foreground">
              {t("quiz.yourRankLabel", { rank: myEntry.rank })}
            </p>
          )}
        </div>
      </Screen>
    )
  }

  if (appState === "nickname") {
    return (
      <Screen>
        <form onSubmit={handleNicknameSubmit} className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-2xl font-bold text-center">{presentationTitle || t("quiz.joinTitle")}</h1>
          <p className="text-center text-muted-foreground">{t("quiz.enterNickname")}</p>
          <Input
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            placeholder={t("quiz.nicknamePlaceholder")}
            maxLength={24}
            autoFocus
          />
          {nicknameError && <p className="text-sm text-destructive">{nicknameError}</p>}
          <Button type="submit">{t("common.next")}</Button>
        </form>
      </Screen>
    )
  }

  if (appState === "avatar") {
    return (
      <Screen>
        <div className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-2xl font-bold text-center">{t("quiz.pickAvatar")}</h1>
          <div className="grid grid-cols-5 gap-3">
            {AVATARS.map((ava) => (
              <button
                key={ava}
                onClick={() => handleAvatarSelect(ava)}
                className={`flex items-center justify-center rounded-xl p-2 text-3xl transition-colors hover:bg-muted ${avatar === ava ? "ring-2 ring-teal-600 bg-teal-50" : ""}`}
              >
                {ava}
              </button>
            ))}
          </div>
        </div>
      </Screen>
    )
  }

  if (appState === "lobby") {
    return (
      <Screen>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">{avatar || "👤"}</span>
          <p className="text-lg font-semibold">{nickname}</p>
          <p className="text-muted-foreground">{t("quiz.waitingToStart")}</p>
          <div className="mt-4 flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-2 rounded-full bg-teal-600 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </Screen>
    )
  }

  if ((appState === "submitted") && !currentSlide) {
    return (
      <Screen>
        <p className="text-muted-foreground text-center">{t("quiz.votingLocked")}</p>
      </Screen>
    )
  }

  if (appState === "leaderboard") {
    return (
      <Screen>
        <div className="w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-bold text-center">
            {lbFinal ? t("quiz.finalResults") : t("quiz.leaderboard")}
          </h2>
          <div className="space-y-2">
            {lbEntries.slice(0, 10).map((entry) => (
              <div
                key={entry.nickname}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${entry.nickname === nickname ? "bg-teal-50 ring-1 ring-teal-200" : "bg-muted/50"}`}
              >
                <span className="w-6 text-center text-sm font-bold text-teal-600">
                  {t("quiz.rankN", { n: entry.rank })}
                </span>
                <span className="text-xl">{entry.avatar || "👤"}</span>
                <span className="flex-1 text-sm font-medium">{entry.nickname}</span>
                <span className="tabular-nums text-sm font-bold">{entry.totalPoints.toLocaleString()}</span>
              </div>
            ))}
          </div>
          {myEntry && !lbEntries.slice(0, 10).find((e) => e.nickname === nickname) && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-teal-50 ring-1 ring-teal-200">
              <span className="w-6 text-center text-sm font-bold text-teal-600">
                {t("quiz.rankN", { n: myEntry.rank })}
              </span>
              <span className="text-xl">{myEntry.avatar || "👤"}</span>
              <span className="flex-1 text-sm font-medium">{myEntry.nickname}</span>
              <span className="tabular-nums text-sm font-bold">{myEntry.totalPoints.toLocaleString()}</span>
            </div>
          )}
        </div>
      </Screen>
    )
  }

  if (!currentSlide) return <Screen><p className="text-muted-foreground">{t("common.loading")}</p></Screen>

  // ── Question screen ──────────────────────────────────────────────────────
  if (appState === "result" && result) {
    return (
      <Screen>
        <div className="flex flex-col items-center gap-4 text-center">
          {result.correct === true && (
            <>
              <span className="text-5xl">✅</span>
              <p className="text-2xl font-bold text-green-600">{t("quiz.correct")}</p>
              <p className="text-teal-600 text-xl font-semibold">{t("quiz.pointsEarned", { points: result.points })}</p>
            </>
          )}
          {result.correct === false && (
            <>
              <span className="text-5xl">❌</span>
              <p className="text-2xl font-bold text-destructive">{t("quiz.incorrect")}</p>
            </>
          )}
          {result.correct === null && (
            <>
              <span className="text-5xl">✓</span>
              <p className="text-xl font-semibold">{t("quiz.answerReceived")}</p>
            </>
          )}
          {result.rank !== null && (
            <p className="text-muted-foreground">
              {t("quiz.yourRankLabel", { rank: result.rank })}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">{t("quiz.waitingToStart")}</p>
        </div>
      </Screen>
    )
  }

  if (appState === "submitted") {
    return (
      <Screen>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">✓</span>
          <p className="text-xl font-semibold">{t("quiz.answerReceived")}</p>
          <p className="text-sm text-muted-foreground">{t("quiz.waitingToStart")}</p>
        </div>
      </Screen>
    )
  }

  // Active question
  const isLocked = locked || submittedRef.current

  return (
    <Screen padding>
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {t("quiz.slideProgress", { n: slideIndex + 1, total: slideCount })}
          </p>
          <h2 className="text-xl font-bold leading-snug">{currentSlide.prompt}</h2>
        </div>

        {currentSlide.type === "MCQ" && (() => {
          const config = asMCQ(currentSlide.config)
          return (
            <div className="space-y-2">
              {config.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleMCQToggle(i)}
                  disabled={isLocked}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${selectedIndices.includes(i) ? "border-teal-600 bg-teal-50 text-teal-800" : "border-border bg-background hover:bg-muted"} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {opt}
                </button>
              ))}
              {config.allowMultiple && !isLocked && selectedIndices.length > 0 && (
                <Button
                  onClick={handleMCQSubmit}
                  disabled={submitting}
                  className="w-full mt-2"
                >
                  {submitting ? t("common.loading") : t("quiz.submitAnswer")}
                </Button>
              )}
            </div>
          )
        })()}

        {currentSlide.type === "WORDCLOUD" && (() => {
          const config = asWordCloud(currentSlide.config)
          return (
            <div className="space-y-3">
              {words.map((w, i) => (
                <Input
                  key={i}
                  value={w}
                  onChange={(e) => {
                    const next = [...words]
                    next[i] = e.target.value
                    setWords(next)
                  }}
                  placeholder={`Word ${i + 1}`}
                  maxLength={30}
                  disabled={isLocked}
                />
              ))}
              {config.allowMultiple && words.length < 5 && !isLocked && (
                <button
                  onClick={() => setWords([...words, ""])}
                  className="text-sm text-teal-600 underline"
                >
                  {t("quiz.addWord")}
                </button>
              )}
              {!isLocked && (
                <Button
                  onClick={() => void submitAnswer({ words: words.filter(Boolean) })}
                  disabled={submitting || words.filter(Boolean).length === 0}
                  className="w-full"
                >
                  {submitting ? t("common.loading") : t("quiz.submitAnswer")}
                </Button>
              )}
            </div>
          )
        })()}

        {currentSlide.type === "SCALE" && (() => {
          const config = asScale(currentSlide.config)
          return (
            <div className="space-y-5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{config.minLabel}</span>
                <span>{config.maxLabel}</span>
              </div>
              {config.statements.map((stmt, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm">{stmt}</p>
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    value={scaleValues[i] ?? Math.round((config.min + config.max) / 2)}
                    onChange={(e) => {
                      const next = [...scaleValues]
                      next[i] = Number(e.target.value)
                      setScaleValues(next)
                    }}
                    disabled={isLocked}
                    className="w-full accent-teal-600"
                  />
                  <p className="text-right text-xs text-teal-600 font-semibold">{scaleValues[i]}</p>
                </div>
              ))}
              {!isLocked && (
                <Button
                  onClick={() => void submitAnswer({ values: scaleValues })}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? t("common.loading") : t("quiz.submitAnswer")}
                </Button>
              )}
            </div>
          )
        })()}

        {currentSlide.type === "OPEN_TEXT" && (() => {
          const config = asOpenText(currentSlide.config)
          return (
            <div className="space-y-3">
              <textarea
                value={openText}
                onChange={(e) => setOpenText(e.target.value.slice(0, config.maxLength))}
                disabled={isLocked}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-50"
                placeholder={t("quiz.builder.promptPlaceholder")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{openText.length}/{config.maxLength}</span>
              </div>
              {!isLocked && (
                <Button
                  onClick={() => void submitAnswer({ text: openText })}
                  disabled={submitting || openText.trim().length === 0}
                  className="w-full"
                >
                  {submitting ? t("common.loading") : t("quiz.submitAnswer")}
                </Button>
              )}
            </div>
          )
        })()}

        {currentSlide.type === "CONTENT" && (
          <div className="text-muted-foreground text-sm leading-relaxed">
            {(currentSlide.config as { body?: string }).body}
          </div>
        )}

        {isLocked && appState === "question" && (
          <p className="text-center text-sm text-muted-foreground">{t("quiz.votingLocked")}</p>
        )}
      </div>
    </Screen>
  )
}

function Screen({ children, padding }: { children: React.ReactNode; padding?: boolean }) {
  return (
    <div className={`flex min-h-screen flex-col items-center justify-center bg-background ${padding ? "px-4 py-12" : "px-4 py-8"}`}>
      {children}
    </div>
  )
}
