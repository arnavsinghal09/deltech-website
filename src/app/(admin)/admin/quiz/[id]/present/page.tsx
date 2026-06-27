import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { parseConfig, parseTheme } from "@/lib/quiz-types"
import type { SlideType, SlideData } from "@/lib/quiz-types"
import { createOrGetSession } from "./actions"
import { PresenterApp } from "./_components/presenter-app"

export default async function PresentPage(props: { params: Promise<{ id: string }> }) {
  const authSession = await auth()
  if (!authSession || (authSession.user as { role?: string }).role !== "ADMIN") {
    return notFound()
  }

  const { id } = await props.params

  const raw = await prisma.presentation.findUnique({
    where: { id },
    include: { slides: { orderBy: { order: "asc" } } },
  })
  if (!raw) notFound()

  const slides: SlideData[] = raw.slides.map((s) => {
    const type = s.type as SlideType
    return {
      id: s.id,
      order: s.order,
      type,
      prompt: s.prompt,
      config: parseConfig(s.config, type),
    }
  })

  const sessionId = await createOrGetSession(id)
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    select: { id: true, roomCode: true },
  })
  if (!session) notFound()

  const presentation = {
    id: raw.id,
    title: raw.title,
    mode: raw.mode as "POLL" | "QUIZ",
    theme: parseTheme(raw.theme),
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <PresenterApp session={session} presentation={presentation} slides={slides} />
    </div>
  )
}
