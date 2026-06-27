import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPaymentReminder } from "@/lib/resend"

// Called daily by Vercel Cron at 03:00 UTC (vercel.json).
// Finds allotted delegates with unpaid payments, skips those reminded
// in the last 24 h, and caps sends at 80/run (Resend free-tier headroom).

const DAILY_CAP = 80

export async function GET(req: NextRequest) {
  // Protect: only Vercel Cron or the CRON_SECRET bearer
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Delegates with ALLOTTED / PAYMENT_SENT status that have a payment in non-final state
  // and have NOT received a payment-reminder email in the last 24 h.
  const candidates = await prisma.delegate.findMany({
    where: {
      status: { in: ["ALLOTTED", "PAYMENT_SENT"] },
      payment: {
        status: { in: ["PENDING", "SENT", "FAILED"] },
      },
      NOT: {
        emailLogs: {
          some: {
            template: "payment-reminder",
            status: "SENT",
            sentAt: { gte: since24h },
          },
        },
      },
    },
    select: { id: true },
    take: DAILY_CAP,
  })

  let sent = 0
  let failed = 0

  for (const { id } of candidates) {
    try {
      await sendPaymentReminder(id)
      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: candidates.length })
}
