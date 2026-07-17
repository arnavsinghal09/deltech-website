import { prisma } from "@/lib/prisma"
import { getContent } from "@/lib/settings"
import { requireStaff } from "@/lib/authz"
import { ConfigTabs } from "./_components/config-tabs"

export default async function ConfigPage() {
  const session = await requireStaff()
  const isAdmin = (session.user as { role?: string }).role === "ADMIN"

  const [content, committees, fees] = await Promise.all([
    getContent(),
    prisma.committee.findMany({
      orderBy: { sortOrder: "asc" },
      include: { portfolios: { orderBy: { name: "asc" } } },
    }),
    prisma.fee.findMany({ orderBy: [{ committeeType: "asc" }, { isDtu: "asc" }] }),
  ])

  const serializedCommittees = committees.map((c) => ({
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

  const serializedFees = fees.map((f) => ({
    id: f.id,
    label: f.label,
    committeeType: f.committeeType,
    isDtu: f.isDtu,
    amountInr: f.amountInr,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Config</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit conference settings, committees, portfolios, and fees. All changes apply immediately.
        </p>
      </div>
      <ConfigTabs
        content={content}
        committees={serializedCommittees}
        fees={serializedFees}
        isAdmin={isAdmin}
      />
    </div>
  )
}
