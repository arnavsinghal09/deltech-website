import { prisma } from "@/lib/prisma"
import { getContent } from "@/lib/settings"
import { requireStaff } from "@/lib/authz"
import { TabCommittees } from "../_components/tab-committees"
import { TabPortfolios } from "../_components/tab-portfolios"
import { MatrixVisibilityCard } from "../_components/matrix-visibility-card"

export default async function CommitteesSettingsPage() {
  await requireStaff()
  const [content, committees] = await Promise.all([
    getContent(),
    prisma.committee.findMany({
      orderBy: { sortOrder: "asc" },
      include: { portfolios: { orderBy: { name: "asc" } } },
    }),
  ])

  const serialized = committees.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    agenda: c.agenda,
    type: c.type,
    doubleDelegation: c.doubleDelegation,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    aliases: c.aliases,
    portfolios: c.portfolios.map((p) => ({
      id: p.id,
      committeeId: p.committeeId,
      name: p.name,
      status: p.status,
    })),
  }))

  return (
    <div className="space-y-6">
      <div className="editorial-card p-6">
        <h2 className="font-heading text-lg">Committees</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The bodies of the conference — with import aliases for partner sheets.
        </p>
        <div className="rule my-5" />
        <TabCommittees committees={serialized} />
      </div>

      <div className="editorial-card p-6">
        <h2 className="font-heading text-lg">Portfolio matrix</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate countries, MPs, or characters with one click, review, then bulk add.
        </p>
        <div className="rule my-5" />
        <TabPortfolios committees={serialized} />
      </div>

      <MatrixVisibilityCard matrixPublic={content.matrixPublic} />
    </div>
  )
}
