"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { setContent } from "@/lib/settings"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") redirect("/signin")
}

// ── Content ────────────────────────────────────────────────────────────────────
export async function saveContent(
  partial: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await setContent(partial)
    return { success: true }
  } catch {
    return { success: false, error: "Failed to save." }
  }
}

// ── Registration toggle ────────────────────────────────────────────────────────
export async function setRegistrationOpen(
  open: boolean,
): Promise<{ success: boolean }> {
  await requireAdmin()
  await setContent({ registrationOpen: open })
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
}): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await prisma.committee.create({ data })
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
  },
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await prisma.committee.update({ where: { id }, data })
    return { success: true }
  } catch {
    return { success: false, error: "Failed to update committee." }
  }
}

export async function deleteCommittee(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await prisma.committee.delete({ where: { id } })
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
  await requireAdmin()
  const trimmed = name.trim()
  if (!trimmed) return { success: false, error: "Name is required." }
  try {
    await prisma.portfolio.create({ data: { committeeId, name: trimmed } })
    return { success: true }
  } catch {
    return { success: false, error: "Portfolio already exists in this committee." }
  }
}

export async function bulkAddPortfolios(
  committeeId: string,
  names: string[],
): Promise<{ success: boolean; added: number; skipped: number }> {
  await requireAdmin()
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
  return { success: true, added, skipped }
}

export async function deletePortfolio(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await prisma.portfolio.delete({ where: { id } })
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
  await requireAdmin()
  try {
    await prisma.fee.create({ data })
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
  await requireAdmin()
  try {
    await prisma.fee.update({ where: { id }, data })
    return { success: true }
  } catch {
    return { success: false, error: "Failed to update fee." }
  }
}

export async function deleteFee(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await prisma.fee.delete({ where: { id } })
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete fee." }
  }
}
