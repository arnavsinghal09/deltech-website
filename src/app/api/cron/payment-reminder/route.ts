import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPaymentReminder } from "@/lib/resend"
import { getContent } from "@/lib/settings"

// Called daily by Vercel Cron at 03:00 UTC (vercel.json).
// Finds allotted delegates with unpaid payments, skips those reminded
// in the last 24 h, and caps sends at 80/run (Resend free-tier headroom).

const DAILY_CAP = 80

export async function GET(req: NextRequest) {
  // Protect: only the CRON_SECRET bearer. Fail closed, an unset secret must
  // not leave this email-sending endpoint world-callable.
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const content = await getContent()
  if (content.eventMode === "INTRA_MUN" || !content.paymentsEnabled) {
    return NextResponse.json({ sent: 0, failed: 0, total: 0, disabled: true })
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
