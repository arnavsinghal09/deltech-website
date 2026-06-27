import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { parseConfig, parseTheme } from "@/lib/quiz-types"
import type { SlideType, SlideData } from "@/lib/quiz-types"
import { BuilderClient } from "./_components/builder-client"

export default async function QuizBuilderPage(props: { params: Promise<{ id: string }> }) {
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

  const presentation = {
    id: raw.id,
    title: raw.title,
    mode: raw.mode as "POLL" | "QUIZ",
    theme: parseTheme(raw.theme),
  }

  return <BuilderClient presentation={presentation} initialSlides={slides} />
}
