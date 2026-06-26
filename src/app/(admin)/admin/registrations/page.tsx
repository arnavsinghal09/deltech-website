import { prisma } from "@/lib/prisma"
import { buildDelegateWhere, parseSortField } from "./_lib/build-where"
import { delegateInclude, serializeDelegate } from "./_lib/types"
import { RegistrationsClient } from "./_components/registrations-client"
import type { Prisma } from "@/generated/prisma/client"
import { t } from "@/content/strings"

const PAGE_SIZE_DEFAULT = 25
const PAGE_SIZE_MAX = 100

export default async function RegistrationsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await props.searchParams

  const get = (key: string) => {
    const v = params[key]
    return Array.isArray(v) ? v[0] : v
  }

  const q = get("q") ?? ""
  const committeeId = get("committeeId") ?? ""
  const status = get("status") ?? ""
  const source = get("source") ?? ""
  const isDtu = get("isDtu") ?? ""
  const needsAccommodation = get("needsAccommodation") ?? ""
  const page = Math.max(1, parseInt(get("page") ?? "1", 10) || 1)
  const perPage = Math.min(PAGE_SIZE_MAX, Math.max(1, parseInt(get("perPage") ?? String(PAGE_SIZE_DEFAULT), 10) || PAGE_SIZE_DEFAULT))
  const sortBy = parseSortField(get("sortBy"))
  const sortDir = (get("sortDir") === "asc" ? "asc" : "desc") as "asc" | "desc"

  const where = buildDelegateWhere({ q: q || undefined, committeeId: committeeId || undefined, status: status || undefined, source: source || undefined, isDtu: isDtu || undefined, needsAccommodation: needsAccommodation || undefined })

  const orderBy: Prisma.DelegateOrderByWithRelationInput = { [sortBy]: sortDir }

  const [delegatesRaw, total, committees] = await Promise.all([
    prisma.delegate.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: delegateInclude,
    }),
    prisma.delegate.count({ where }),
    prisma.committee.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ])

  const delegates = delegatesRaw.map(serializeDelegate)

  const filters = { q, committeeId, status, source, isDtu, needsAccommodation, page, perPage, sortBy, sortDir }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.nav.registrations")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "delegate" : "delegates"} total
        </p>
      </div>
      <RegistrationsClient
        delegates={delegates}
        committees={committees}
        total={total}
        filters={filters}
      />
    </div>
  )
}
