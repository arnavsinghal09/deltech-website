"use server"

import { redirect } from "next/navigation"
import { read, utils } from "xlsx"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ColumnMapping, MappedRow, PaymentMode } from "@/lib/schemas/import"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ""

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") redirect("/signin")
  return session
}

// ---------------------------------------------------------------------------
// Parse uploaded file
// ---------------------------------------------------------------------------

export interface ParseResult {
  success: boolean
  error?: string
  headers?: string[]
  rows?: Record<string, string>[]
  rowCount?: number
}

export async function parseUpload(formData: FormData): Promise<ParseResult> {
  await requireAdmin()
  try {
    const file = formData.get("file") as File | null
    if (!file) return { success: false, error: "No file provided." }

    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      return { success: false, error: "Only .xlsx, .xls, or .csv files are accepted." }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = read(buffer, { type: "buffer", cellDates: true })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet) return { success: false, error: "No sheets found in the file." }

    const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    })

    if (rows.length === 0) return { success: false, error: "The file has no data rows." }

    const stringRows = rows.map((r) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "").trim()])),
    ) as Record<string, string>[]

    const headers = Object.keys(stringRows[0])
    return { success: true, headers, rows: stringRows, rowCount: stringRows.length }
  } catch {
    return { success: false, error: "Failed to parse file. Make sure it is a valid Excel or CSV file." }
  }
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export interface ImportPresetRecord {
  id:        string
  name:      string
  partner:   string | null
  mapping:   ColumnMapping
  createdAt: string
}

export async function getImportPresets(): Promise<ImportPresetRecord[]> {
  await requireAdmin()
  const presets = await prisma.importPreset.findMany({ orderBy: { name: "asc" } })
  return presets.map((p) => ({
    id:        p.id,
    name:      p.name,
    partner:   p.partner,
    mapping:   p.mapping as ColumnMapping,
    createdAt: p.createdAt.toISOString(),
  }))
}

export async function saveImportPreset(
  name: string,
  partner: string,
  mapping: ColumnMapping,
): Promise<{ success: boolean; error?: string; preset?: ImportPresetRecord }> {
  await requireAdmin()
  if (!name.trim()) return { success: false, error: "Preset name is required." }
  try {
    const preset = await prisma.importPreset.upsert({
      where: { name: name.trim() },
      create: { name: name.trim(), partner: partner || null, mapping },
      update: { partner: partner || null, mapping },
    })
    return {
      success: true,
      preset: {
        id:        preset.id,
        name:      preset.name,
        partner:   preset.partner,
        mapping:   preset.mapping as ColumnMapping,
        createdAt: preset.createdAt.toISOString(),
      },
    }
  } catch {
    return { success: false, error: "Failed to save preset." }
  }
}

export async function deleteImportPreset(id: string): Promise<{ success: boolean }> {
  await requireAdmin()
  await prisma.importPreset.delete({ where: { id } })
  return { success: true }
}

// ---------------------------------------------------------------------------
// Commit import
// ---------------------------------------------------------------------------

export interface CommitResult {
  created:   number
  allotted:  number
  skipped:   number
  errors:    { row: number; email: string; reason: string }[]
}

export async function commitImport(params: {
  rows:         MappedRow[]
  skippedRows:  number[]
  paymentMode:  PaymentMode
  partnerNote:  string
}): Promise<CommitResult> {
  const session = await requireAdmin()
  const adminEmail = session.user.email ?? "import"
  const { rows, skippedRows, paymentMode, partnerNote } = params
  const skippedSet = new Set(skippedRows)

  let created  = 0
  let allotted = 0
  let skipped  = 0
  const errors: CommitResult["errors"] = []

  const activeRows = rows.filter((_, i) => !skippedSet.has(i))

  for (let i = 0; i < activeRows.length; i++) {
    const row = activeRows[i]
    try {
      // Duplicate guard
      const existing = await prisma.delegate.findFirst({ where: { email: row.email } })
      if (existing) {
        skipped++
        errors.push({ row: i, email: row.email, reason: "Email already registered — skipped." })
        continue
      }

      // Determine committee + portfolio upfront (need committeeType for fee)
      let committeeId: string | null   = null
      let committeeType: string | null = null
      let portfolioId:   string | null = null

      if (row.committee) {
        const committee = await prisma.committee.findFirst({
          where: { name: { equals: row.committee, mode: "insensitive" }, isActive: true },
          select: { id: true, type: true },
        })
        if (committee) {
          committeeId   = committee.id
          committeeType = committee.type
          if (row.portfolio) {
            const portfolio = await prisma.portfolio.findFirst({
              where: {
                committeeId: committee.id,
                name:   { equals: row.portfolio, mode: "insensitive" },
                status: "AVAILABLE",
              },
              select: { id: true },
            })
            if (portfolio) portfolioId = portfolio.id
          }
        }
      }

      // Fee lookup (needed for UPI-collect)
      let feeAmount = 0
      if (paymentMode === "upi" && committeeType) {
        const fee = await prisma.fee.findFirst({
          where: { committeeType, isDtu: row.isDtu ?? false },
        })
        feeAmount = fee?.amountInr ?? 0
      }

      // Determine delegate status
      const willAllot     = !!(committeeId && portfolioId)
      const delegateStatus =
        paymentMode === "comp"
          ? "CONFIRMED"
          : willAllot
          ? "PAYMENT_SENT"
          : "REGISTERED"

      // Single transaction per delegate
      const delegate = await prisma.$transaction(async (tx) => {
        const d = await tx.delegate.create({
          data: {
            fullName:      row.fullName,
            email:         row.email,
            whatsapp:      row.whatsapp ?? row.email,
            institution:   row.institution ?? "N/A",
            isDtu:         row.isDtu ?? false,
            munExperience: row.munExperience ?? null,
            source:        "CROSS_DEL",
            sourceNote:    partnerNote.trim() || null,
            status:        delegateStatus,
          },
        })

        if (willAllot && committeeId && portfolioId) {
          await tx.allotment.create({
            data: {
              delegateId:  d.id,
              committeeId,
              portfolioId,
              allottedBy:  `import:${adminEmail}`,
            },
          })
          await tx.portfolio.update({
            where: { id: portfolioId },
            data:  { status: "ALLOTTED" },
          })
        }

        if (paymentMode === "upi" && willAllot) {
          await tx.payment.create({
            data: {
              delegateId:  d.id,
              provider:    "upi_qr",
              amountInr:   feeAmount,
              status:      "PENDING",
              paymentLink: `${APP_URL}/pay/${d.id}`,
            },
          })
        }

        // No Payment row for comp (as per spec)
        return d
      })

      created++
      if (willAllot) allotted++

      // Fire allotment email async (best-effort, don't block or fail import)
      if (willAllot) {
        void import("@/lib/resend")
          .then(({ sendAllotmentEmail }) => sendAllotmentEmail(delegate.id))
          .catch(() => undefined)
      }
    } catch (err) {
      errors.push({
        row:    i,
        email:  row.email,
        reason: err instanceof Error ? err.message : "Unexpected error.",
      })
    }
  }

  return { created, allotted, skipped, errors }
}
