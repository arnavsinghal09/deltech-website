import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// GET ?code=123456 , participant lookup (public)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 })

  const session = await prisma.quizSession.findFirst({
    where: { roomCode: code },
    select: {
      id: true,
      roomCode: true,
      status: true,
      presentationId: true,
    },
  })
  if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const presentation = await prisma.presentation.findUnique({
    where: { id: session.presentationId },
    select: { mode: true, title: true },
  })

  return NextResponse.json({ session, presentationMode: presentation?.mode ?? "POLL" })
}

// POST , admin creates a session
export async function POST(request: Request) {
  const authSession = await auth()
  const role = (authSession?.user as { role?: string } | undefined)?.role
  if (!authSession || (role !== "ADMIN" && role !== "MAINTAINER")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { presentationId } = (await request.json()) as { presentationId: string }

  // Reuse an existing lobby/active session
  const existing = await prisma.quizSession.findFirst({
    where: { presentationId, status: { in: ["lobby", "active"] } },
  })
  if (existing) return NextResponse.json(existing)

  // Generate a unique room code
  let roomCode = generateRoomCode()
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.quizSession.findFirst({ where: { roomCode } })
    if (!clash) break
    roomCode = generateRoomCode()
  }

  const session = await prisma.quizSession.create({
    data: { presentationId, roomCode, status: "lobby" },
  })
  return NextResponse.json(session, { status: 201 })
}
