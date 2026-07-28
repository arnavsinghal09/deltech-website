import { prisma } from "@/lib/prisma"

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function isRetryable(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code
  // P2002: the generated roomCode collided with an existing one.
  // P2034: two callers raced and Postgres aborted this transaction.
  return code === "P2002" || code === "P2034"
}

// Returns the live session for a presentation, creating one only if there
// isn't one already.
//
// This logic existed twice, in the presenter server action and in the sessions
// route handler, and both had the same two faults. The find-then-create was
// unguarded, and createOrGetSession runs during *page render*, so two staff
// opening the presenter view at once each created a session: two room codes
// for one presentation, half the audience in each, and a leaderboard split
// down the middle. Separately, the old five-try roomCode pre-check was itself
// a read-then-write, and an unlucky collision threw an unhandled P2002.
//
// Now the unique index on roomCode is the guard, and a retry resolves both
// cases: it either mints a fresh code or finds the session the winner just
// committed.
export async function createOrGetQuizSession(presentationId: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existing = await tx.quizSession.findFirst({
            where: { presentationId, status: { in: ["lobby", "active"] } },
          })
          if (existing) return existing

          return tx.quizSession.create({
            data: { presentationId, roomCode: generateRoomCode(), status: "lobby" },
          })
        },
        { isolationLevel: "Serializable" },
      )
    } catch (err) {
      if (attempt >= 4 || !isRetryable(err)) throw err
    }
  }
}
