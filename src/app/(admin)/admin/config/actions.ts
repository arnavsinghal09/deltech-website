"use server"

import { prisma } from "@/lib/prisma"
import { setContent } from "@/lib/settings"
import { requireStaff, requireAdmin } from "@/lib/authz"
import { audit } from "@/lib/audit"

// Money/sync config only an ADMIN may touch — kept out of saveContent entirely.
const PAYMENT_KEYS = new Set(["paymentProvider", "staticPaymentLink", "sheetSyncUrl"])

// ── Content ────────────────────────────────────────────────────────────────────
export async function saveContent(
  partial: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  if (Object.keys(partial).some((k) => PAYMENT_KEYS.has(k))) {
    return { success: false, error: "Payment settings must be saved via the payment card (admin only)." }
  }
  try {
    await setContent(partial)
    await audit(session.user?.email ?? "unknown", "content.save", "Setting", undefined, {
      keys: Object.keys(partial),
    })
    return { success: true }
  } catch {
    return { success: false, error: "Failed to save." }
  }
}

export async function savePaymentConfig(partial: {
  paymentProvider?: "upi_qr" | "razorpay" | "static_link"
  staticPaymentLink?: string
  sheetSyncUrl?: string
}): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()
  try {
    await setContent(partial)
    await audit(session.user?.email ?? "unknown", "content.savePaymentConfig", "Setting", undefined, {
      keys: Object.keys(partial),
    })
    return { success: true }
  } catch {
    return { success: false, error: "Failed to save." }
  }
}

// ── Registration toggle ────────────────────────────────────────────────────────
export async function setRegistrationOpen(
  open: boolean,
): Promise<{ success: boolean }> {
  const session = await requireStaff()
  await setContent({ registrationOpen: open })
  await audit(session.user?.email ?? "unknown", open ? "registration.open" : "registration.close", "Setting")
  return { success: true }
}

// ── Committees ─────────────────────────────────────────────────────────────────
export async function createCommittee(data: {
  name: string
  slug: string
  agenda?: string
  type: "STANDARD" | "CRISIS" | "PRESS"
  doubleDelegation: boolean
  sortOrder: number
  aliases?: string[]
}): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  try {
    const committee = await prisma.committee.create({ data })
    await audit(session.user?.email ?? "unknown", "committee.create", "Committee", committee.id, {
      name: data.name,
    })
    return { success: true }
  } catch {
    return { success: false, error: "Failed. Slug may already exist." }
  }
}

export async function updateCommittee(
  id: string,
  data: {
    name: string
    slug: string
    agenda?: string
    type: "STANDARD" | "CRISIS" | "PRESS"
    doubleDelegation: boolean
    isActive: boolean
    sortOrder: number
    aliases?: string[]
  },
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  try {
    await prisma.committee.update({ where: { id }, data })
    await audit(session.user?.email ?? "unknown", "committee.update", "Committee", id)
    return { success: true }
  } catch {
    return { success: false, error: "Failed to update committee." }
  }
}

export async function deleteCommittee(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()
  try {
    await prisma.committee.delete({ where: { id } })
    await audit(session.user?.email ?? "unknown", "committee.delete", "Committee", id)
    return { success: true }
  } catch {
    return { success: false, error: "Cannot delete — committee has linked data." }
  }
}

// ── Portfolios ─────────────────────────────────────────────────────────────────
export async function addPortfolio(
  committeeId: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  const trimmed = name.trim()
  if (!trimmed) return { success: false, error: "Name is required." }
  try {
    await prisma.portfolio.create({ data: { committeeId, name: trimmed } })
    await audit(session.user?.email ?? "unknown", "portfolio.add", "Portfolio", undefined, {
      committeeId,
      name: trimmed,
    })
    return { success: true }
  } catch {
    return { success: false, error: "Portfolio already exists in this committee." }
  }
}

export async function bulkAddPortfolios(
  committeeId: string,
  names: string[],
): Promise<{ success: boolean; added: number; skipped: number }> {
  const session = await requireStaff()
  let added = 0
  let skipped = 0
  for (const n of names) {
    const name = n.trim()
    if (!name) continue
    try {
      await prisma.portfolio.create({ data: { committeeId, name } })
      added++
    } catch {
      skipped++
    }
  }
  await audit(session.user?.email ?? "unknown", "portfolio.bulkAdd", "Portfolio", undefined, {
    committeeId,
    added,
    skipped,
  })
  return { success: true, added, skipped }
}

export async function deletePortfolio(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()
  try {
    await prisma.portfolio.delete({ where: { id } })
    await audit(session.user?.email ?? "unknown", "portfolio.delete", "Portfolio", id)
    return { success: true }
  } catch {
    return { success: false, error: "Cannot delete — portfolio has an allotment." }
  }
}

// ── Fees ───────────────────────────────────────────────────────────────────────
export async function createFee(data: {
  label: string
  committeeType: string
  isDtu: boolean
  amountInr: number
}): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()
  try {
    const fee = await prisma.fee.create({ data })
    await audit(session.user?.email ?? "unknown", "fee.create", "Fee", fee.id, { ...data })
    return { success: true }
  } catch {
    return { success: false, error: "Failed to create fee." }
  }
}

export async function updateFee(
  id: string,
  data: {
    label: string
    committeeType: string
    isDtu: boolean
    amountInr: number
  },
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()
  try {
    await prisma.fee.update({ where: { id }, data })
    await audit(session.user?.email ?? "unknown", "fee.update", "Fee", id, { ...data })
    return { success: true }
  } catch {
    return { success: false, error: "Failed to update fee." }
  }
}

export async function deleteFee(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()
  try {
    await prisma.fee.delete({ where: { id } })
    await audit(session.user?.email ?? "unknown", "fee.delete", "Fee", id)
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete fee." }
  }
}
