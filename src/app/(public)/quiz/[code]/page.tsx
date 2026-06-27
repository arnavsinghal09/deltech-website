import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ParticipantApp } from "./_components/participant-app"

export default async function QuizParticipantPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params

  const session = await prisma.quizSession.findFirst({
    where: { roomCode: code },
    select: { id: true, roomCode: true, status: true, presentationId: true },
  })
  if (!session) notFound()

  const presentation = await prisma.presentation.findUnique({
    where: { id: session.presentationId },
    select: { mode: true, title: true },
  })

  return (
    <ParticipantApp
      sessionId={session.id}
      roomCode={session.roomCode}
      initialStatus={session.status}
      presentationMode={(presentation?.mode ?? "POLL") as "POLL" | "QUIZ"}
      presentationTitle={presentation?.title ?? ""}
    />
  )
}
