"use server"

import { read, utils } from "xlsx"
import { prisma } from "@/lib/prisma"
import { requireStaff, requireAdmin } from "@/lib/authz"
import { audit } from "@/lib/audit"
import { setContent } from "@/lib/settings"
import { deriveCsvUrl } from "@/lib/gsheet-url"
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/intake"
import type { ApplicantStatus, InterviewRound, Verdict } from "@/generated/prisma/client"

function pickColumn(row: Record<string, string>, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const key = Object.keys(row).find((candidate) => pattern.test(candidate))
    if (key && row[key]?.trim()) return row[key].trim()
  }
  return undefined
}

export async function syncRecruitmentSheet(sheetUrl: string): Promise<{
  success: boolean
  created?: number
  updated?: number
  skipped?: number
  error?: string
}> {
  const session = await requireStaff()
  const csvUrl = deriveCsvUrl(sheetUrl)
  if (!csvUrl) return { success: false, error: "Paste a valid Google Sheets sharing link." }

  try {
    const response = await fetch(csvUrl, { signal: AbortSignal.timeout(15000), cache: "no-store" })
    if (!response.ok) {
      return { success: false, error: "Google refused the sheet. Set sharing to “Anyone with the link can view”." }
    }
    const workbook = read(await response.text(), { type: "string" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) return { success: false, error: "The sheet has no readable tab." }
    const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false })

    let created = 0
    let updated = 0
    let skipped = 0
    for (const raw of rows) {
      const row = Object.fromEntries(
        Object.entries(raw).map(([key, value]) => [key.trim(), String(value ?? "").trim()]),
      ) as Record<string, string>
      const name = pickColumn(row, [/full ?name/i, /^name$/i, /your name/i])
      const emailValue = pickColumn(row, [/e-?mail/i])
      if (!name || !emailValue) {
        skipped++
        continue
      }
      const email = normalizeEmail(emailValue)
      const existing = await prisma.applicant.findUnique({ where: { email }, select: { id: true } })
      await prisma.applicant.upsert({
        where: { email },
        create: {
          fullName: normalizeName(name),
          email,
          phone: normalizePhone(pickColumn(row, [/phone|whatsapp|mobile|contact/i])) ?? null,
          year: pickColumn(row, [/year|batch/i]) ?? null,
          branch: pickColumn(row, [/branch|department|course/i]) ?? null,
          answers: row,
        },
        update: {
          fullName: normalizeName(name),
          phone: normalizePhone(pickColumn(row, [/phone|whatsapp|mobile|contact/i])) ?? null,
          year: pickColumn(row, [/year|batch/i]) ?? null,
          branch: pickColumn(row, [/branch|department|course/i]) ?? null,
          answers: row,
        },
      })
      if (existing) updated++
      else created++
    }

    await setContent({ recruitmentSheetUrl: sheetUrl.trim() })
    await audit(session.user?.email ?? "unknown", "recruitment.sheetSync", "Applicant", undefined, {
      created,
      updated,
      skipped,
    })
    return { success: true, created, updated, skipped }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error && error.name === "TimeoutError"
        ? "Google Sheets took too long to respond."
        : "Could not read this sheet. Check sharing and try again.",
    }
  }
}

// Recruitment is deliberately simple and offline: a GD panel scores applicants
// and shortlists them, a PI panel scores the shortlist and finalises selection.
// No scheduling, venues, or emails.

// Score + verdict per round. GD SHORTLIST → PI stage; GD/PI REJECT → rejected;
// PI SELECT → selected.
export async function saveScore(
  applicantId: string,
  round: InterviewRound,
  score: number | null,
  verdict: Verdict | null,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  if (score != null && (score < 0 || score > 10)) {
    return { success: false, error: "Score must be 0–10." }
  }

  let status: ApplicantStatus | undefined
  if (round === "GD") {
    status = verdict === "REJECT" ? "REJECTED" : verdict ? "GD_DONE" : undefined
  } else {
    status =
      verdict === "SELECT" ? "SELECTED" : verdict === "REJECT" ? "REJECTED" : verdict ? "PI_DONE" : undefined
  }

  await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      ...(round === "GD" ? { gdScore: score, gdVerdict: verdict } : { piScore: score, piVerdict: verdict }),
      ...(status ? { status } : {}),
    },
  })
  await audit(session.user?.email ?? "unknown", "applicant.score", "Applicant", applicantId, {
    round,
    score,
    verdict,
  })
  return { success: true }
}

// Manual override — e.g. move someone back a stage, or un-reject.
export async function setApplicantStatus(
  applicantId: string,
  status: ApplicantStatus,
): Promise<{ success: boolean }> {
  const session = await requireStaff()
  await prisma.applicant.update({ where: { id: applicantId }, data: { status } })
  await audit(session.user?.email ?? "unknown", "applicant.setStatus", "Applicant", applicantId, { status })
  return { success: true }
}

export async function deleteApplicant(applicantId: string): Promise<{ success: boolean }> {
  const session = await requireAdmin()
  await prisma.applicant.delete({ where: { id: applicantId } })
  await audit(session.user?.email ?? "unknown", "applicant.delete", "Applicant", applicantId)
  return { success: true }
}
