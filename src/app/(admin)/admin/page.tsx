import { Users, IndianRupee, BedDouble, CheckCircle2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { t, type StringKey } from "@/content/strings"
import { StatCard } from "./_components/stat-card"
import { StatusBarChart } from "./_components/status-bar-chart"
import { SourcePieChart } from "./_components/source-pie-chart"
import { CommitteeFillTable } from "./_components/committee-fill-table"

export default async function AdminOverviewPage() {
  const [
    total,
    byStatus,
    bySource,
    accommodationCount,
    revenueResult,
    committees,
  ] = await Promise.all([
    prisma.delegate.count(),
    prisma.delegate.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.delegate.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.delegate.count({ where: { needsAccommodation: true } }),
    prisma.payment.aggregate({
      where: { status: { in: ["PAID", "COMPED"] } },
      _sum: { amountInr: true },
    }),
    prisma.committee.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { portfolios: true } },
        portfolios: { select: { status: true } },
      },
    }),
  ])

  const revenue = revenueResult._sum.amountInr ?? 0
  const confirmedCount =
    byStatus.find((s) => s.status === "CONFIRMED")?._count._all ?? 0

  const statusData = byStatus.map((s) => ({
    name: t(("status." + s.status) as StringKey),
    value: s._count._all,
  }))

  const sourceData = bySource.map((s) => ({
    name: s.source,
    value: s._count._all,
  }))

  const committeeData = committees.map((c) => ({
    name: c.name,
    total: c._count.portfolios,
    allotted: c.portfolios.filter(
      (p) => p.status === "ALLOTTED" || p.status === "BLOCKED",
    ).length,
  }))

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("admin.nav.overview")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live numbers from the database.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("admin.overview.totalRegistrations")}
          value={total}
          icon={Users}
          description="all time"
        />
        <StatCard
          title="Confirmed"
          value={confirmedCount}
          icon={CheckCircle2}
          description="of total"
          trend={total > 0 ? `${Math.round((confirmedCount / total) * 100)}%` : "—"}
        />
        <StatCard
          title={t("admin.overview.revenueCollected")}
          value={`₹${revenue.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          description="paid + comped"
        />
        <StatCard
          title={t("admin.overview.accommodationRequests")}
          value={accommodationCount}
          icon={BedDouble}
          description="delegates"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-card-foreground">
            {t("admin.overview.byStatus")}
          </h2>
          <StatusBarChart data={statusData} />
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-card-foreground">
            {t("admin.overview.sourceBreakdown")}
          </h2>
          <SourcePieChart data={sourceData} />
        </div>
      </div>

      {/* Committee fill-rate table */}
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-card-foreground">
          {t("admin.overview.byCommittee")} — Fill Rate
        </h2>
        <CommitteeFillTable data={committeeData} />
      </div>
    </div>
  )
}
