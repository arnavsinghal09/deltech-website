"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { setContent } from "@/lib/settings"
import { requireStaff, requireAdmin } from "@/lib/authz"
import { audit } from "@/lib/audit"
import { callAI, AIRateLimitError } from "@/lib/ai"

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
  paymentsEnabled?: boolean
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
  portfolioTagLabel?: string
  matrixBrief?: string
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
    portfolioTagLabel?: string
    matrixBrief?: string
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
  tag?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  const trimmed = name.trim()
  if (!trimmed) return { success: false, error: "Name is required." }
  try {
    await prisma.portfolio.create({ data: { committeeId, name: trimmed, tag: tag?.trim() || null } })
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
  entries: Array<{ name: string; tag?: string; priority?: number }>,
): Promise<{ success: boolean; added: number; skipped: number }> {
  const session = await requireStaff()
  let added = 0
  let skipped = 0
  for (const entry of entries) {
    const name = entry.name.trim()
    if (!name) continue
    try {
      await prisma.portfolio.create({
        data: {
          committeeId,
          name,
          tag: entry.tag?.trim() || null,
          priority: Math.max(0, Math.min(entry.priority ?? 0, 999)),
        },
      })
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

export async function updatePortfolio(
  id: string,
  data: { name: string; tag?: string; priority?: number },
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  const name = data.name.trim()
  if (!name) return { success: false, error: "Name is required." }
  try {
    await prisma.portfolio.update({
      where: { id },
      data: {
        name,
        tag: data.tag?.trim() || null,
        priority: Math.max(0, Math.min(data.priority ?? 0, 999)),
      },
    })
    await audit(session.user?.email ?? "unknown", "portfolio.update", "Portfolio", id)
    return { success: true }
  } catch {
    return { success: false, error: "Could not update this portfolio." }
  }
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

// ── AI matrix generation ───────────────────────────────────────────────────────
// Every committee is agenda-sensitive. Even a GA matrix should be ranked by
// relevance, not sliced alphabetically from a static country list.
const portfolioListSchema = z.object({
  tagLabel: z.string().max(40).optional(),
  sourceNote: z.string().max(240).optional(),
  portfolios: z.array(z.object({
    name: z.string().min(2).max(100),
    tag: z.string().max(50).optional().default(""),
    priority: z.number().int().min(1).max(300),
  })).min(1).max(300),
})

export async function generatePortfolios(
  committeeId: string,
  size: number,
  brief?: string,
): Promise<{
  success: boolean
  portfolios?: Array<{ name: string; tag: string; priority: number }>
  tagLabel?: string
  sourceNote?: string
  error?: string
  rateLimited?: boolean
}> {
  await requireStaff()
  const committee = await prisma.committee.findUnique({
    where: { id: committeeId },
    select: { name: true, agenda: true, type: true, aliases: true, matrixBrief: true },
  })
  if (!committee) return { success: false, error: "Committee not found." }
  const count = Math.min(Math.max(size, 1), 300)

  const today = new Date().toISOString().slice(0, 10)
  const normalizedName = `${committee.name} ${committee.aliases.join(" ")}`.toLowerCase()
  const isIndianParliament = /aippm|all india political parties|lok sabha|rajya sabha|parliament/.test(normalizedName)
  const isHrc = /unhrc|human rights council/.test(normalizedName)
  const isSc = /unsc|security council/.test(normalizedName)
  const explicitBrief = brief?.trim() || committee.matrixBrief?.trim() || "No additional scenario brief supplied."

  const committeeRules = isIndianParliament
    ? `This is an Indian political committee. Return CURRENT politicians or office-holders only. Never return reporters, journalists, news outlets, generic positions, or fictional people. Tag every person with their current political party (or Independent). Prioritize decision-makers and actors relevant to the agenda across government and opposition.`
    : isHrc
      ? `Tag every country exactly as Member, Non-member, or Observer. Prioritize current Human Rights Council members, then agenda-critical non-members and observers. Membership changes over time, so use the date and scenario brief and do not claim certainty in sourceNote.`
      : isSc
        ? `Tag countries as Permanent, Elected, or Invited/Observer. Include the current P5 and current elected members first, then only agenda-critical invited parties.`
        : committee.type === "PRESS"
          ? `This is the ONLY type where press roles are valid. Return specific roles such as Reporter — Reuters or Photojournalist — AP and tag each with Desk or Outlet.`
          : committee.type === "CRISIS"
            ? `Return real characters or offices that belong in this cabinet/crisis. Tag each by faction, institution, or side.`
            : `Return countries ordered by agenda relevance and diplomatic importance, not alphabetically. Include central parties, major powers, regional stakeholders, affected states, and useful coalition voices. Tag by region or role.`

  const prompt = `You are a senior MUN academic director preparing a portfolio matrix.

Committee: ${committee.name}
Type: ${committee.type}
Agenda: ${committee.agenda ?? "(not set)"}
Current date: ${today}
Scenario / research brief: ${explicitBrief}

Committee-specific rule: ${committeeRules}

Generate exactly ${count} entries. Rank the most important/relevant first. Use real countries, people, or roles only; no duplicates; no alphabetical padding. Current facts can change, so include a short sourceNote telling the director what must be verified before publishing.

Respond only with JSON: {"tagLabel":"Party, Participation, Region, Faction, or Desk","sourceNote":"...","portfolios":[{"name":"...","tag":"...","priority":1}]}. Priority 1 is most important and must increase sequentially.`

  try {
    const raw = await callAI<unknown>(prompt)
    const parsed = portfolioListSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, error: "AI returned an invalid list — try again." }
    }
    const seen = new Set<string>()
    const unique = parsed.data.portfolios.filter((entry) => {
      const key = entry.name.trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    return {
      success: true,
      portfolios: unique.slice(0, count).map((entry, index) => ({
        name: entry.name.trim(),
        tag: entry.tag.trim(),
        priority: index + 1,
      })),
      tagLabel: parsed.data.tagLabel,
      sourceNote: parsed.data.sourceNote,
    }
  } catch (err) {
    if (err instanceof AIRateLimitError) {
      return { success: false, error: err.message, rateLimited: true }
    }
    return { success: false, error: err instanceof Error ? err.message : "AI generation failed." }
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
