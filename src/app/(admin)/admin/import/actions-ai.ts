"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { callAI, AIRateLimitError } from "@/lib/ai"
import type { ColumnMapping, MappedRow } from "@/lib/schemas/import"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") redirect("/signin")
}

// ---------------------------------------------------------------------------
// Suggest column mapping
// ---------------------------------------------------------------------------

export async function suggestMappingWithGemini(
  headers: string[],
  sampleRows: Record<string, string>[],
): Promise<{ success: boolean; mapping?: ColumnMapping; error?: string; rateLimited?: boolean }> {
  await requireAdmin()

  const prompt = `You are helping import delegate data for a Model United Nations (MUN) conference.

Column headers from the uploaded spreadsheet:
${JSON.stringify(headers)}

First few rows of sample data:
${JSON.stringify(sampleRows.slice(0, 5), null, 2)}

Map each of our system fields to the best-matching column header from the list above.
The value must be the EXACT header string as it appears in the list, or null if no confident match.

Field definitions and common column name patterns:
- fullName: Delegate's complete name. Common: "Full name", "Name", "Participant name", "Delegate name"
- email: Email address. Common: "Email ID", "Email", "E-mail", "Mail ID"
- whatsapp: Phone or WhatsApp number. Common: "Phone number", "Phone", "WhatsApp", "Mobile", "Contact number"
- institution: College, university, or school. Common: "College", "Institution", "University", "School"
- committee: FIRST committee preference. Common: "Committee preference 1", "Committee 1", "1st preference", "Pref 1 committee"
- portfolio: FIRST portfolio/country. Common: "Portfolio 1", "Country 1", "Character 1" — paired with the first committee preference
- committee2: SECOND committee preference. Common: "Committee preference 2", "Committee 2", "2nd preference", "Pref 2 committee"
- portfolio2: SECOND portfolio/country. Common: "Portfolio 2", "Country 2", "Character 2" — paired with the second committee preference
- committee3: THIRD committee preference. Common: "Committee preference 3", "Committee 3", "3rd preference", "Pref 3 committee"
- portfolio3: THIRD portfolio/country. Common: "Portfolio 3", "Country 3", "Character 3" — paired with the third committee preference
- note: Remarks or special instructions. Common: "Note", "Remarks", "Comments", "Special notes"

Respond with a JSON object using exactly these keys (string value = the exact matching header, null = no match):
{
  "fullName": null,
  "email": null,
  "whatsapp": null,
  "institution": null,
  "committee": null,
  "portfolio": null,
  "committee2": null,
  "portfolio2": null,
  "committee3": null,
  "portfolio3": null,
  "note": null
}`

  try {
    const raw = await callAI<Partial<Record<keyof ColumnMapping, string | null>>>(prompt)
    const mapping: ColumnMapping = {}
    for (const [field, col] of Object.entries(raw)) {
      if (col && headers.includes(col)) {
        mapping[field as keyof ColumnMapping] = col
      }
    }
    return { success: true, mapping }
  } catch (err) {
    if (err instanceof AIRateLimitError)
      return { success: false, error: err.message, rateLimited: true }
    return { success: false, error: err instanceof Error ? err.message : "AI mapping failed." }
  }
}

// ---------------------------------------------------------------------------
// Clean & normalise rows
// ---------------------------------------------------------------------------

export type CleanedRow = MappedRow & { _note?: string; _skip?: boolean }

export async function cleanImportRowsWithGemini(
  rows: MappedRow[],
  committeeNames: string[],
): Promise<{ success: boolean; cleaned?: CleanedRow[]; error?: string; rateLimited?: boolean }> {
  await requireAdmin()
  if (rows.length === 0) return { success: true, cleaned: [] }

  const BATCH = 40
  if (rows.length > BATCH) {
    const all: CleanedRow[] = []
    for (let i = 0; i < rows.length; i += BATCH) {
      const r = await cleanBatch(rows.slice(i, i + BATCH), committeeNames)
      if (!r.success || !r.cleaned) return r
      all.push(...r.cleaned)
    }
    return { success: true, cleaned: all }
  }

  return cleanBatch(rows, committeeNames)
}

async function cleanBatch(
  rows: MappedRow[],
  committeeNames: string[],
): Promise<{ success: boolean; cleaned?: CleanedRow[]; error?: string; rateLimited?: boolean }> {
  const committeeList =
    committeeNames.length > 0 ? committeeNames.join(", ") : "(none defined yet)"

  const prompt = `You are cleaning cross-delegation delegate data for a Model United Nations conference. These delegates are always from external institutions, never the host institution.

Valid committees in our system: ${committeeList}

IMPORTANT: Some rows may be non-data rows added to the spreadsheet for convenience (e.g. a title row, a blank separator, an instruction line, a totals row, or a row where the name field is a column label like "Name" or "Sr. No."). For those, set _skip: true and leave other fields as-is.

Normalise every field in each data row according to these rules:

fullName — Proper title case. Strip leading honorifics (Mr, Ms, Mrs, Dr, Prof, Er, Ar, Adv, CA, Er.) but keep them if embedded mid-name. Preserve hyphens and apostrophes. Indian names: keep all parts capitalised (e.g. "RITU SHARMA" → "Ritu Sharma", "md. arshad" → "Md. Arshad").

email — Lowercase, strip all whitespace. Fix common typos: gmial/gmal/gamil → gmail, yahooo/yaho → yahoo, redifmail/redimail → rediffmail, outloo/otlook → outlook, hotmal/homail → hotmail. Remove spaces around "@" or ".". Leave unchanged if clearly invalid or empty.

whatsapp — Digits only, with India country code (91). Examples: "+91-98765 43210" → "919876543210", "9876543210" (10 digits) → "919876543210", "09876543210" (leading 0) → "919876543210". Return null if value is "N/A", "na", "same", "same as above", "nil", empty, clearly not a phone number, or fewer than 10 digits.

institution — Proper title case, trim. Return null if empty or "N/A".

committee / committee2 / committee3 — Each: match to the closest entry from the valid committees list (case-insensitive, fuzzy). Return null if no confident match — do not guess. Maintain the order: committee is 1st pref, committee2 is 2nd, committee3 is 3rd.

portfolio / portfolio2 / portfolio3 — Each: standard proper-case country or character name. Expand only if unambiguous: "USA" → "United States of America", "UK" → "United Kingdom", "UAE" → "United Arab Emirates". Return null if empty.

note — Trim whitespace only. Pass through as-is. Return null if empty.

_note — Short comma-separated list of changes you made (e.g. "name casing, email domain, phone +91 prefix"). Return null if nothing changed and _skip is false.

_skip — true only if this row is clearly a non-data row (header repeat, blank, instruction, summary). false for all real delegate rows.

Input rows (${rows.length} total):
${JSON.stringify(rows)}

Respond with a JSON object containing a "rows" array of exactly ${rows.length} cleaned objects, same order as input. Each object must have these exact keys: fullName, email, whatsapp, institution, committee, portfolio, committee2, portfolio2, committee3, portfolio3, note, _note, _skip. Use null for missing/empty optional fields.

Example format:
{"rows": [{"fullName": "Ritu Sharma", "email": "ritu@gmail.com", "whatsapp": "919876543210", "institution": "IIT Delhi", "committee": "UNSC", "portfolio": "India", "committee2": "UNHRC", "portfolio2": "France", "committee3": null, "portfolio3": null, "note": null, "_note": "name casing, phone +91", "_skip": false}, ...]}`

  try {
    const data = await callAI<{ rows: Array<Record<string, string | boolean | null>> }>(prompt)

    if (!Array.isArray(data?.rows) || data.rows.length !== rows.length) {
      throw new Error(
        `Expected ${rows.length} rows back, got ${Array.isArray(data?.rows) ? data.rows.length : "non-array"}.`,
      )
    }

    const cleaned: CleanedRow[] = data.rows.map((r, i) => ({
      fullName:    (r.fullName    as string) || rows[i].fullName,
      email:       (r.email       as string) || rows[i].email,
      whatsapp:    r.whatsapp    ? String(r.whatsapp)    : undefined,
      institution: r.institution ? String(r.institution) : undefined,
      committee:   r.committee   ? String(r.committee)   : undefined,
      portfolio:   r.portfolio   ? String(r.portfolio)   : undefined,
      committee2:  r.committee2  ? String(r.committee2)  : undefined,
      portfolio2:  r.portfolio2  ? String(r.portfolio2)  : undefined,
      committee3:  r.committee3  ? String(r.committee3)  : undefined,
      portfolio3:  r.portfolio3  ? String(r.portfolio3)  : undefined,
      note:        r.note        ? String(r.note)        : undefined,
      _note:       r._note       ? String(r._note)       : undefined,
      _skip:       r._skip === true,
    }))

    return { success: true, cleaned }
  } catch (err) {
    if (err instanceof AIRateLimitError)
      return { success: false, error: err.message, rateLimited: true }
    return { success: false, error: err instanceof Error ? err.message : "AI cleaning failed." }
  }
}
