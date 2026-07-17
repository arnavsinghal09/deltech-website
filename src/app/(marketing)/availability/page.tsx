import { prisma } from "@/lib/prisma"
import { getContent } from "@/lib/settings"
import { t } from "@/content/strings"
import {
  AvailabilityBoard,
  type CommitteeAvailability,
} from "./_components/availability-board"
import { MatrixBoard, type MatrixCommittee } from "./_components/matrix-board"

export const revalidate = 0 // always SSR — Realtime handles live updates client-side

export default async function AvailabilityPage() {
  const content = await getContent()

  const committees = await prisma.committee.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      portfolios: {
        orderBy: { name: "asc" },
        include: {
          allotment: {
            select: { delegate: { select: { status: true } } },
          },
        },
      },
    },
  })

  const totalAvailable = committees.reduce(
    (sum, c) => sum + c.portfolios.filter((p) => p.status === "AVAILABLE").length,
    0,
  )

  if (!content.matrixPublic) {
    // Counts-only fallback — exact allotments hidden.
    const initial: CommitteeAvailability[] = committees.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      doubleDelegation: c.doubleDelegation,
      availableCount: c.portfolios.filter((p) => p.status === "AVAILABLE").length,
    }))

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

  const matrix: MatrixCommittee[] = committees.map((c) => ({
    id: c.id,
    name: c.name,
    agenda: c.agenda,
    type: c.type,
    doubleDelegation: c.doubleDelegation,
    portfolios: c.portfolios.map((p) => ({
      id: p.id,
      name: p.name,
      state:
        p.status === "BLOCKED"
          ? ("blocked" as const)
          : p.status === "ALLOTTED"
            ? p.allotment?.delegate.status === "CONFIRMED"
              ? ("paid" as const)
              : ("allotted" as const)
            : ("available" as const),
    })),
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Matrix</h1>
        <p className="mt-2 text-muted-foreground">
          Live — every allotment and payment updates this page in real time.
        </p>
        {totalAvailable > 0 && (
          <p className="mt-1 text-sm text-primary font-medium">
            {totalAvailable} portfolio{totalAvailable !== 1 ? "s" : ""} still open
          </p>
        )}
      </div>

      {matrix.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("empty.noCommittees")}</p>
      ) : (
        <MatrixBoard committees={matrix} />
      )}
    </div>
  )
}
