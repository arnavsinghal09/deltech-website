import { timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createDelegateFromRow, normalizeEmail, normalizePhone, normalizeName } from "@/lib/intake"
import { applyMapping, type ColumnMapping } from "@/lib/schemas/import"

// Google Form → site intake. An Apps Script onFormSubmit trigger POSTs each
// response here (docs/apps-script/gform-webhook.gs). Missed webhooks self-heal
// via /api/cron/gform-sync. Always returns 200 for handled rows (duplicate or
// quarantined included) so Apps Script only alerts on real failures.

function secretOk(header: string | null): boolean {
  const secret = process.env.GFORM_SHARED_SECRET ?? ""
  if (!secret || !header) return false
  const a = Buffer.from(header)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

interface GformBody {
  preset?: string
  kind: "delegate" | "applicant"
  source?: "SELF" | "CROSS_DEL"
  row: Record<string, string>
}

// Tolerant header matching for applicant forms, no preset needed.
function pickColumn(row: Record<string, string>, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const key = Object.keys(row).find((k) => pattern.test(k))
    if (key && row[key]?.trim()) return row[key].trim()
  }
  return undefined
}

async function handleApplicant(row: Record<string, string>): Promise<NextResponse> {
  const fullName = pickColumn(row, [/full ?name/i, /^name$/i, /your name/i])
  const email = pickColumn(row, [/e-?mail/i])
  const phone = pickColumn(row, [/phone|whatsapp|mobile|contact/i])
  const year = pickColumn(row, [/year|batch/i])
  const branch = pickColumn(row, [/branch|department|course/i])

  if (!fullName || !email) {
    await prisma.quarantinedRow.create({
      data: { source: "APPLICANT", raw: row, errors: ["Missing name or email column"] },
    })
    return NextResponse.json({ ok: true, quarantined: true })
  }

  try {
    await prisma.applicant.create({
      data: {
        fullName: normalizeName(fullName),
        email: normalizeEmail(email),
        phone: normalizePhone(phone) ?? null,
        year: year ?? null,
        branch: branch ?? null,
        answers: row,
      },
    })
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "P2002") {
      return NextResponse.json({ ok: true, dedup: true })
    }
    throw err
  }
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  if (!secretOk(req.headers.get("x-gform-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: GformBody
  try {
    body = (await req.json()) as GformBody
    if (!body?.row || typeof body.row !== "object") throw new Error("bad row")
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (body.kind === "applicant") {
    return handleApplicant(body.row)
  }

  // kind === "delegate": map columns through the named ImportPreset
  if (!body.preset) {
    return NextResponse.json({ error: "preset is required for delegate intake" }, { status: 400 })
  }
  const preset = await prisma.importPreset.findUnique({ where: { name: body.preset } })
  if (!preset) {
    return NextResponse.json({ error: `Unknown preset "${body.preset}"` }, { status: 400 })
  }

  const source = body.source === "CROSS_DEL" ? "CROSS_DEL" : "SELF"
  const mapped = applyMapping(body.row, preset.mapping as ColumnMapping)
  const result = await createDelegateFromRow(mapped, source, {
    sourceNote: `gform:${body.preset}`,
    allottedBy: `gform:${body.preset}`,
    presetName: body.preset,
  })

  if (!result.ok) {
    // duplicate and quarantined are both handled states. 200 so the
    // Apps Script doesn't alert; the quarantine list surfaces them to staff.
    return NextResponse.json({ ok: true, [result.reason]: true })
  }

  if (source === "SELF") {
    void import("@/lib/resend")
      .then(({ sendRegistrationEmails }) => sendRegistrationEmails(result.delegateId))
      .catch((err) => console.error(`[gform] registration emails failed for ${result.delegateId}:`, err))
  } else if (result.allotted) {
    void import("@/lib/resend")
      .then(({ sendAllotmentEmail }) => sendAllotmentEmail(result.delegateId))
      .catch((err) => console.error(`[gform] allotment email failed for ${result.delegateId}:`, err))
  }

  return NextResponse.json({ ok: true, delegateId: result.delegateId, allotted: result.allotted })
}
