"use server"

import { prisma } from "@/lib/prisma"
import { requireStaff, requireAdmin } from "@/lib/authz"
import { audit } from "@/lib/audit"
import { getActiveProvider } from "@/lib/payments"
import { delegateInclude, serializeDelegate, type SerializedDelegate } from "./_lib/types"
import { sendPaymentConfirmed, resendByLogId } from "@/lib/resend"
import { syncSheetCell, syncSheetForDelegate } from "@/lib/sheet-sync"

export interface DelegateEditData {
  fullName: string
  email: string
  whatsapp: string
  altPhone?: string
  institution: string
  isDtu: boolean
  munExperience?: string
  pref1Portfolio?: string
  pref2Portfolio?: string
  needsAccommodation: boolean
  outsideNcr: boolean
  reference?: string
}

async function reloadDelegate(delegateId: string): Promise<SerializedDelegate> {
  const updated = await prisma.delegate.findUniqueOrThrow({
    where: { id: delegateId },
    include: delegateInclude,
  })
  return serializeDelegate(updated)
}

export async function updateDelegate(
  id: string,
  data: DelegateEditData,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  try {
    await prisma.delegate.update({
      where: { id },
      data: {
        fullName: data.fullName,
        email: data.email,
        whatsapp: data.whatsapp,
        altPhone: data.altPhone || null,
        institution: data.institution,
        isDtu: data.isDtu,
        munExperience: data.munExperience || null,
        pref1Portfolio: data.pref1Portfolio || null,
        pref2Portfolio: data.pref2Portfolio || null,
        needsAccommodation: data.needsAccommodation,
        outsideNcr: data.outsideNcr,
        reference: data.reference || null,
      },
    })
    await audit(session.user?.email ?? "unknown", "delegate.update", "Delegate", id)
    return { success: true }
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "P2002") {
      return { success: false, error: "Another delegate already uses this email." }
    }
    return { success: false, error: "Update failed. Please try again." }
  }
}

export async function markPaidOffline(
  delegateId: string,
): Promise<{ success: boolean; error?: string; delegate?: SerializedDelegate }> {
  const session = await requireAdmin()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { delegateId },
        data: { status: "OFFLINE", confirmedAt: new Date(), method: "upi_manual" },
      })
      await tx.delegate.update({
        where: { id: delegateId },
        data: { status: "CONFIRMED" },
      })
    })
    await audit(session.user?.email ?? "unknown", "delegate.markPaidOffline", "Delegate", delegateId)
    await syncSheetForDelegate(delegateId)
    try {
      await sendPaymentConfirmed(delegateId)
    } catch {
      // email failure must not surface to the admin
    }
    return { success: true, delegate: await reloadDelegate(delegateId) }
  } catch {
    return { success: false, error: "Failed to mark as paid. Please try again." }
  }
}

// Comp: no fee expected (sponsored/EB courtesy). Payment row → COMPED, delegate → CONFIRMED.
export async function compDelegate(
  delegateId: string,
): Promise<{ success: boolean; error?: string; delegate?: SerializedDelegate }> {
  const session = await requireAdmin()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { delegateId },
        create: { delegateId, provider: "comp", amountInr: 0, status: "COMPED", confirmedAt: new Date() },
        update: { status: "COMPED", confirmedAt: new Date() },
      })
      await tx.delegate.update({ where: { id: delegateId }, data: { status: "CONFIRMED" } })
    })
    await audit(session.user?.email ?? "unknown", "delegate.comp", "Delegate", delegateId)
    await syncSheetForDelegate(delegateId)
    try {
      await sendPaymentConfirmed(delegateId)
    } catch {
      // best-effort
    }
    return { success: true, delegate: await reloadDelegate(delegateId) }
  } catch {
    return { success: false, error: "Failed to comp. Please try again." }
  }
}

// Cancel: frees any allotted portfolio, drops unpaid payment rows, delegate → CANCELLED.
export async function cancelDelegate(
  delegateId: string,
): Promise<{ success: boolean; error?: string; delegate?: SerializedDelegate }> {
  const session = await requireAdmin()
  try {
    const freedCell = await prisma.$transaction(async (tx) => {
      const allotment = await tx.allotment.findUnique({
        where: { delegateId },
        include: { portfolio: { include: { committee: { select: { name: true } } } } },
      })
      if (allotment) {
        await tx.allotment.delete({ where: { id: allotment.id } })
        await tx.portfolio.update({
          where: { id: allotment.portfolioId },
          data: { status: "AVAILABLE" },
        })
      }
      await tx.payment.deleteMany({
        where: { delegateId, status: { in: ["PENDING", "SENT", "FAILED"] } },
      })
      await tx.delegate.update({ where: { id: delegateId }, data: { status: "CANCELLED" } })
      return allotment
        ? { committee: allotment.portfolio.committee.name, portfolio: allotment.portfolio.name }
        : null
    })
    await audit(session.user?.email ?? "unknown", "delegate.cancel", "Delegate", delegateId)
    if (freedCell) {
      await syncSheetCell({ ...freedCell, state: "available" })
    }
    return { success: true, delegate: await reloadDelegate(delegateId) }
  } catch {
    return { success: false, error: "Failed to cancel. Please try again." }
  }
}

export async function waitlistDelegate(
  delegateId: string,
  waitlisted: boolean,
): Promise<{ success: boolean; error?: string; delegate?: SerializedDelegate }> {
  const session = await requireStaff()
  try {
    const result = await prisma.delegate.updateMany({
      where: { id: delegateId, status: waitlisted ? "REGISTERED" : "WAITLISTED" },
      data: { status: waitlisted ? "WAITLISTED" : "REGISTERED" },
    })
    if (result.count === 0) {
      return { success: false, error: "Only unallotted delegates can be (un)waitlisted." }
    }
    await audit(
      session.user?.email ?? "unknown",
      waitlisted ? "delegate.waitlist" : "delegate.unwaitlist",
      "Delegate",
      delegateId,
    )
    return { success: true, delegate: await reloadDelegate(delegateId) }
  } catch {
    return { success: false, error: "Failed to update waitlist status." }
  }
}

// Recovers delegates stuck in ALLOTTED (fee/provider misconfig at allotment time).
export async function regeneratePaymentLink(
  delegateId: string,
): Promise<{ success: boolean; error?: string; delegate?: SerializedDelegate }> {
  const session = await requireStaff()
  try {
    const delegate = await prisma.delegate.findUniqueOrThrow({
      where: { id: delegateId },
      select: {
        publicToken: true,
        email: true,
        isDtu: true,
        status: true,
        allotment: { include: { portfolio: { include: { committee: true } } } },
        payment: true,
      },
    })
    if (!delegate.allotment) return { success: false, error: "Delegate has no allotment." }
    if (delegate.status === "CONFIRMED" || delegate.payment?.status === "PAID") {
      return { success: false, error: "Payment already confirmed." }
    }

    let amountInr = delegate.payment?.amountInr
    if (amountInr == null) {
      const fee = await prisma.fee.findFirst({
        where: {
          committeeType: delegate.allotment.portfolio.committee.type,
          isDtu: delegate.isDtu,
        },
      })
      if (!fee) return { success: false, error: "No matching fee configured — add one in Config → Fees." }
      amountInr = fee.amountInr
    }

    const provider = await getActiveProvider()
    const { link, orderId } = await provider.createPaymentLink({
      delegateId,
      publicToken: delegate.publicToken,
      amountInr,
      email: delegate.email,
    })
    const content = await import("@/lib/settings").then((m) => m.getContent())
    await prisma.payment.upsert({
      where: { delegateId },
      create: {
        delegateId,
        provider: content.paymentProvider,
        amountInr,
        status: "SENT",
        paymentLink: link,
        ...(orderId ? { razorpayOrderId: orderId } : {}),
      },
      update: {
        status: "SENT",
        paymentLink: link,
        ...(orderId ? { razorpayOrderId: orderId } : {}),
      },
    })
    await prisma.delegate.update({ where: { id: delegateId }, data: { status: "PAYMENT_SENT" } })
    await audit(session.user?.email ?? "unknown", "delegate.regeneratePaymentLink", "Delegate", delegateId)
    return { success: true, delegate: await reloadDelegate(delegateId) }
  } catch {
    return { success: false, error: "Failed to regenerate payment link." }
  }
}

export async function resendEmail(
  logId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  try {
    await resendByLogId(logId)
    await audit(session.user?.email ?? "unknown", "email.resend", "EmailLog", logId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Resend failed." }
  }
}
