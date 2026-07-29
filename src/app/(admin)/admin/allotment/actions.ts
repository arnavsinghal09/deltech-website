"use server"

import { prisma } from "@/lib/prisma"
import { requireStaff, requireAdmin } from "@/lib/authz"
import { audit } from "@/lib/audit"
import { getActiveProvider } from "@/lib/payments"
import { sendAllotmentEmail, sendCoDelegateNotice } from "@/lib/resend"
import { syncSheetCell, syncSheetForDelegate } from "@/lib/sheet-sync"
import { getContent } from "@/lib/settings"

function isPrismaP2002(err: unknown): boolean {
  // Prisma unique constraint violation
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "P2002"
  )
}

// ── holdPortfolio ──────────────────────────────────────────────────────────────
// Soft-locks a portfolio to ON_HOLD while the dialog is open.
// Only transitions AVAILABLE → ON_HOLD (ignores if already ON_HOLD or ALLOTTED).
export async function holdPortfolio(portfolioId: string): Promise<{ success: boolean }> {
  await requireStaff()
  await prisma.portfolio.updateMany({
    where: { id: portfolioId, status: "AVAILABLE" },
    data: { status: "ON_HOLD" },
  })
  return { success: true }
}

// ── releaseHold ────────────────────────────────────────────────────────────────
// Releases ON_HOLD back to AVAILABLE (called when dialog closes without confirming).
export async function releaseHold(portfolioId: string): Promise<void> {
  await requireStaff()
  await prisma.portfolio.updateMany({
    where: { id: portfolioId, status: "ON_HOLD" },
    data: { status: "AVAILABLE" },
  })
}

// ── allotPortfolio ─────────────────────────────────────────────────────────────
// Runs in a Prisma interactive transaction. Race-safe: the unique constraint on
// Allotment.portfolioId is the hard guard, if two admins confirm simultaneously,
// one hits P2002 and their transaction rolls back cleanly.
export async function allotPortfolio(input: {
  portfolioId: string
  committeeId: string
  delegateId: string
}): Promise<{
  success: boolean
  error?: string
  code?: "ALREADY_ALLOTTED" | "DELEGATE_UNAVAILABLE"
}> {
  const session = await requireStaff()
  const adminEmail = session.user?.email ?? "admin"
  const content = await getContent()
  const paymentsEnabled = content.eventMode !== "INTRA_MUN" && content.paymentsEnabled

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      // 1. Re-check portfolio has not already been allotted inside the transaction
      const portfolio = await tx.portfolio.findUnique({
        where: { id: input.portfolioId },
        select: { status: true },
      })
      if (!portfolio || portfolio.status === "ALLOTTED") {
        const e = new Error("Already allotted") as Error & { code: string }
        e.code = "ALREADY_ALLOTTED"
        throw e
      }

      // 2. Confirm delegate is still REGISTERED
      const delegate = await tx.delegate.findUnique({
        where: { id: input.delegateId },
        select: { isDtu: true, status: true, email: true, publicToken: true },
      })
      if (!delegate || delegate.status !== "REGISTERED") {
        const e = new Error("Delegate unavailable") as Error & { code: string }
        e.code = "DELEGATE_UNAVAILABLE"
        throw e
      }

      // 3. Committee type for fee lookup
      const committee = await tx.committee.findUnique({
        where: { id: input.committeeId },
        select: { type: true },
      })

      // 4. Fee lookup, amount always comes from the Fee table, never hardcoded
      const fee = paymentsEnabled ? await tx.fee.findFirst({
        where: {
          committeeType: committee?.type ?? "STANDARD",
          isDtu: delegate.isDtu,
        },
      }) : null

      // 5. Payment provider from settings
      const providerSetting = await tx.setting.findUnique({ where: { key: "paymentProvider" } })
      const paymentProvider =
        typeof providerSetting?.value === "string" ? providerSetting.value : "upi_qr"

      // 6. Create Allotment, unique constraint on portfolioId is the final race guard
      await tx.allotment.create({
        data: {
          delegateId: input.delegateId,
          committeeId: input.committeeId,
          portfolioId: input.portfolioId,
          allottedBy: adminEmail,
        },
      })

      // 7. Portfolio → ALLOTTED
      await tx.portfolio.update({
        where: { id: input.portfolioId },
        data: { status: "ALLOTTED" },
      })

      // 8. Delegate → ALLOTTED
      await tx.delegate.update({
        where: { id: input.delegateId },
        data: { status: paymentsEnabled ? "ALLOTTED" : "CONFIRMED" },
      })

      // 9. Payment row, provider + amount both from DB, link set after transaction
      if (paymentsEnabled && fee) {
        await tx.payment.create({
          data: {
            delegateId: input.delegateId,
            provider: paymentProvider,
            amountInr: fee.amountInr,
            status: "PENDING",
          },
        })
      }

      return {
        fee: fee ? { amountInr: fee.amountInr } : null,
        delegateEmail: delegate.email,
        delegateToken: delegate.publicToken,
      }
    })

    // Generate payment link outside the transaction (Razorpay would make external calls here)
    if (paymentsEnabled && txResult.fee) {
      const provider = await getActiveProvider()
      const { link, orderId } = await provider.createPaymentLink({
        delegateId: input.delegateId,
        publicToken: txResult.delegateToken,
        amountInr: txResult.fee.amountInr,
        email: txResult.delegateEmail,
      })
      await prisma.payment.update({
        where: { delegateId: input.delegateId },
        data: {
          paymentLink: link,
          status: "SENT",
          ...(orderId ? { razorpayOrderId: orderId } : {}),
        },
      })
      await prisma.delegate.update({
        where: { id: input.delegateId },
        data: { status: "PAYMENT_SENT" },
      })
    }

    // Fire allotment email; co-delegate notice only if UNHRC (doubleDelegation)
    try {
      await sendAllotmentEmail(input.delegateId)
    } catch {
      // email failure must not roll back the allotment
    }
    try {
      await sendCoDelegateNotice(input.delegateId)
    } catch {
      // intentionally silent
    }

    await audit(adminEmail, "allotment.create", "Delegate", input.delegateId, {
      portfolioId: input.portfolioId,
      committeeId: input.committeeId,
      paymentsEnabled,
    })
    await syncSheetForDelegate(input.delegateId)

    return { success: true }
  } catch (err: unknown) {
    // Hard race: unique constraint on portfolioId
    if (isPrismaP2002(err)) {
      return {
        success: false,
        error: "This portfolio was just allotted by another admin.",
        code: "ALREADY_ALLOTTED",
      }
    }
    // Soft checks thrown inside the transaction
    const e = err as { code?: string }
    if (e.code === "ALREADY_ALLOTTED") {
      return { success: false, error: "Portfolio is no longer available.", code: "ALREADY_ALLOTTED" }
    }
    if (e.code === "DELEGATE_UNAVAILABLE") {
      return {
        success: false,
        error: "This delegate has already been allotted.",
        code: "DELEGATE_UNAVAILABLE",
      }
    }
    return { success: false, error: "Allotment failed. Please try again." }
  }
}

// ── revokeAllotment ────────────────────────────────────────────────────────────
// Undoes an allotment: frees the portfolio, resets delegate to REGISTERED,
// and cancels any PENDING payment (does not touch PAID / SENT payments).
export async function revokeAllotment(input: {
  allotmentId: string
  portfolioId: string
  delegateId: string
}): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()

  const cell = await prisma.portfolio.findUnique({
    where: { id: input.portfolioId },
    select: { name: true, committee: { select: { name: true } } },
  })

  try {
    await prisma.$transaction(async (tx) => {
      await tx.allotment.delete({ where: { id: input.allotmentId } })

      await tx.portfolio.update({
        where: { id: input.portfolioId },
        data: { status: "AVAILABLE" },
      })

      await tx.delegate.update({
        where: { id: input.delegateId },
        data: { status: "REGISTERED" },
      })

      await tx.payment.deleteMany({
        where: { delegateId: input.delegateId, status: "PENDING" },
      })
    })

    await audit(session.user?.email ?? "unknown", "allotment.revoke", "Delegate", input.delegateId, {
      portfolioId: input.portfolioId,
    })
    if (cell) {
      await syncSheetCell({ committee: cell.committee.name, portfolio: cell.name, state: "available" })
    }

    return { success: true }
  } catch {
    return { success: false, error: "Revoke failed. Please try again." }
  }
}
