import { prisma } from "@/lib/prisma"
import { t } from "@/content/strings"
import {
  AvailabilityBoard,
  type CommitteeAvailability,
} from "./_components/availability-board"

export const revalidate = 0 // always SSR — Realtime handles live updates client-side

export default async function AvailabilityPage() {
  const committees = await prisma.committee.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      doubleDelegation: true,
      _count: {
        select: { portfolios: { where: { status: "AVAILABLE" } } },
      },
    },
  })

  const initial: CommitteeAvailability[] = committees.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    doubleDelegation: c.doubleDelegation,
    availableCount: c._count.portfolios,
  }))

  const totalAvailable = initial.reduce((sum, c) => sum + c.availableCount, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("landing.sectionAgendas")}</h1>
        <p className="mt-2 text-muted-foreground">
          Live portfolio availability — updates as allotments are made.
        </p>
        {totalAvailable > 0 && (
          <p className="mt-1 text-sm text-primary font-medium">
            {totalAvailable} portfolio{totalAvailable !== 1 ? "s" : ""} still open
          </p>
        )}
      </div>

      {initial.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("empty.noCommittees")}</p>
      ) : (
        <AvailabilityBoard initial={initial} />
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Counts update live. Exact allotments are not disclosed.
      </p>
    </div>
  )
}
