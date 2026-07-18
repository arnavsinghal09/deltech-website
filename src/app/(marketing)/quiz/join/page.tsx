"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { t } from "@/content/strings"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight, RadioTower } from "lucide-react"

export default function QuizJoinPage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().replace(/\s/g, "")
    if (!/^\d{6}$/.test(trimmed)) {
      setError(t("quiz.invalidCode"))
      return
    }
    setError("")
    startTransition(async () => {
      const res = await fetch(`/api/quiz/sessions?code=${trimmed}`)
      if (!res.ok) {
        setError(t("quiz.invalidCode"))
        return
      }
      const data = (await res.json()) as { session: { status: string } }
      if (data.session.status === "ended") {
        setError(t("quiz.sessionEnded"))
        return
      }
      router.push(`/quiz/${trimmed}`)
    })
  }

  return (
    <div className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-primary text-primary-foreground">
      <div className="paper-grid absolute inset-0 opacity-[0.1]" aria-hidden />
      <span className="pointer-events-none absolute -bottom-20 -right-8 font-mono text-[16rem] font-bold leading-none text-primary-foreground/[0.045] sm:text-[28rem]" aria-hidden>
        06
      </span>
      <div className="section-shell relative grid min-h-[calc(100svh-5rem)] gap-14 py-20 lg:grid-cols-[1fr_0.78fr] lg:items-center">
        <div>
          <p className="data-label flex items-center gap-3 text-gold-300">
            <RadioTower className="size-4" /> {t("marketing.quizLive")}
          </p>
          <h1 className="display-section mt-7 max-w-[7ch]">{t("marketing.quizTitle")}</h1>
          <p className="body-large mt-8 max-w-xl text-primary-foreground/68">{t("marketing.quizBody")}</p>
        </div>

        <form onSubmit={handleSubmit} className="border-y border-primary-foreground/25 py-9">
          <label htmlFor="room-code" className="data-label text-gold-300">{t("quiz.joinPrompt")}</label>
          <Input
            id="room-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={t("quiz.roomCodePlaceholder")}
            className="mt-5 h-24 rounded-none border-primary-foreground/25 bg-transparent px-5 text-center font-mono text-4xl font-bold tabular-nums tracking-[0.3em] text-primary-foreground placeholder:text-primary-foreground/28 focus-visible:ring-gold-300 sm:text-5xl"
            maxLength={6}
            inputMode="numeric"
            autoFocus
          />
          {error && <p className="mt-4 text-base font-medium text-red-200">{error}</p>}
          <Button type="submit" variant="secondary" size="lg" className="mt-5 w-full bg-background text-foreground hover:bg-background/90" disabled={isPending || code.length !== 6}>
            {isPending ? t("common.loading") : t("quiz.joinButton")} <ArrowRight data-icon="inline-end" />
          </Button>
        </form>
      </div>
    </div>
  )
}
