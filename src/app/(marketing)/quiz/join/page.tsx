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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t("quiz.joinTitle")}</h1>
      <p className="text-muted-foreground">{t("quiz.joinPrompt")}</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder={t("quiz.roomCodePlaceholder")}
          className="text-center text-2xl font-bold tracking-[0.3em] h-14"
          maxLength={6}
          inputMode="numeric"
          autoFocus
        />
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isPending || code.length !== 6}>
          {isPending ? t("common.loading") : t("quiz.joinButton")}
        </Button>
      </form>
    </main>
  )
}
