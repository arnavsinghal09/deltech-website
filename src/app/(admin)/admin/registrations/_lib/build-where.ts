import type { Prisma, AppStatus, Source } from "@/generated/prisma/client"

const VALID_STATUSES = new Set(["REGISTERED", "ALLOTTED", "PAYMENT_SENT", "CONFIRMED", "CANCELLED", "WAITLISTED"])
const VALID_SOURCES = new Set(["SELF", "CROSS_DEL", "SPONSORED", "INTERNAL", "MANUAL"])

export interface FilterParams {
  q?: string
  status?: string
  source?: string
  committeeId?: string
  isDtu?: string
  needsAccommodation?: string
}

export function buildDelegateWhere(params: FilterParams): Prisma.DelegateWhereInput {
  const where: Prisma.DelegateWhereInput = {}
  const andConditions: Prisma.DelegateWhereInput[] = []

  if (params.q) {
    andConditions.push({
      OR: [
        { fullName: { contains: params.q, mode: "insensitive" } },
        { email: { contains: params.q, mode: "insensitive" } },
        { institution: { contains: params.q, mode: "insensitive" } },
      ],
    })
  }

  if (params.committeeId) {
    andConditions.push({
      OR: [
        { pref1CommitteeId: params.committeeId },
        { pref2CommitteeId: params.committeeId },
      ],
    })
  }

  if (andConditions.length > 0) where.AND = andConditions

  if (params.status && VALID_STATUSES.has(params.status)) {
    where.status = params.status as AppStatus
  }

  if (params.source && VALID_SOURCES.has(params.source)) {
    where.source = params.source as Source
  }

  if (params.isDtu === "true") where.isDtu = true
  else if (params.isDtu === "false") where.isDtu = false

  if (params.needsAccommodation === "true") where.needsAccommodation = true
  else if (params.needsAccommodation === "false") where.needsAccommodation = false

  return where
}

export const VALID_SORT_FIELDS = ["createdAt", "fullName", "email", "institution", "status"] as const
export type SortField = (typeof VALID_SORT_FIELDS)[number]

export function parseSortField(raw?: string): SortField {
  if (raw && (VALID_SORT_FIELDS as readonly string[]).includes(raw)) return raw as SortField
  return "createdAt"
}
