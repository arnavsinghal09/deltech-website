"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { t } from "@/content/strings"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
    <main className="flex min-h-[80svh] flex-col items-center justify-center bg-background px-4 py-16">
      <div className="editorial-card w-full max-w-md p-8 text-center sm:p-10">
        <p className="eyebrow">Live quiz</p>
        <h1 className="display mt-3 text-3xl md:text-4xl">{t("quiz.joinTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("quiz.joinPrompt")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={t("quiz.roomCodePlaceholder")}
            className="h-14 text-center font-mono text-2xl font-bold tabular-nums tracking-[0.3em]"
            maxLength={6}
            inputMode="numeric"
            autoFocus
          />
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-11 w-full font-semibold" disabled={isPending || code.length !== 6}>
            {isPending ? t("common.loading") : t("quiz.joinButton")}
          </Button>
        </form>
      </div>
    </main>
  )
}
