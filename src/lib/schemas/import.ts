import { z } from "zod"

export const IMPORT_FIELDS = [
  { key: "fullName",      label: "Full name",            required: true  },
  { key: "email",         label: "Email address",        required: true  },
  { key: "whatsapp",      label: "WhatsApp number",      required: false },
  { key: "institution",   label: "Institution",          required: false },
  { key: "isDtu",         label: "DTU student (yes/no)", required: false },
  { key: "committee",     label: "Committee name",       required: false },
  { key: "portfolio",     label: "Portfolio / Country",  required: false },
  { key: "munExperience", label: "MUN experience",       required: false },
] as const

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"]

export type ColumnMapping = Partial<Record<ImportFieldKey, string>>

export const mappedRowSchema = z.object({
  fullName:      z.string().min(2,  "Name must be at least 2 characters"),
  email:         z.string().email("Invalid email address"),
  whatsapp:      z.string().optional(),
  institution:   z.string().optional(),
  isDtu:         z.boolean().optional(),
  committee:     z.string().optional(),
  portfolio:     z.string().optional(),
  munExperience: z.string().optional(),
})

export type MappedRow = z.infer<typeof mappedRowSchema>

export interface ValidatedRow {
  index:  number
  raw:    Record<string, string>
  mapped: MappedRow
  errors: string[]
}

export type PaymentMode = "comp" | "upi"

// Normalize truthy values from spreadsheet cells
export function parseBoolField(val: string): boolean {
  return ["yes", "true", "1", "y", "dtu"].includes(val.trim().toLowerCase())
}

export function applyMapping(
  raw: Record<string, string>,
  mapping: ColumnMapping,
): MappedRow {
  const get = (key: ImportFieldKey): string =>
    (mapping[key] ? (raw[mapping[key]!] ?? "") : "").trim()

  const isDtuRaw = get("isDtu")
  return {
    fullName:      get("fullName"),
    email:         get("email").toLowerCase(),
    whatsapp:      get("whatsapp") || undefined,
    institution:   get("institution") || undefined,
    isDtu:         isDtuRaw ? parseBoolField(isDtuRaw) : undefined,
    committee:     get("committee") || undefined,
    portfolio:     get("portfolio") || undefined,
    munExperience: get("munExperience") || undefined,
  }
}

export function validateRow(index: number, raw: Record<string, string>, mapping: ColumnMapping): ValidatedRow {
  const mapped = applyMapping(raw, mapping)
  const result = mappedRowSchema.safeParse(mapped)
  const errors = result.success ? [] : result.error.issues.map((i) => i.message)
  return { index, raw, mapped, errors }
}
