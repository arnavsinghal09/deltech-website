import { Users, IndianRupee, BedDouble, CheckCircle2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getContent } from "@/lib/settings"
import { requireStaff } from "@/lib/authz"
import { t, type StringKey } from "@/content/strings"
import { PageHeader } from "../_components/page-header"
import { StatCard } from "./_components/stat-card"
import { StatusBarChart } from "./_components/status-bar-chart"
import { SourcePieChart } from "./_components/source-pie-chart"
import { CommitteeFillTable } from "./_components/committee-fill-table"
import { SetupChecklist, type ChecklistItem } from "./_components/setup-checklist"
import { MaintainerWelcome } from "./_components/maintainer-welcome"

export default async function AdminOverviewPage() {
  const session = await requireStaff()
  const isMaintainer = (session.user as { role?: string }).role === "MAINTAINER"

  const [
    total,
    byStatus,
    bySource,
    accommodationCount,
    revenueResult,
    committees,
    portfolioCount,
    feeCount,
    memberCount,
    publishedPostCount,
    content,
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
    prisma.portfolio.count(),
    prisma.fee.count(),
    prisma.member.count({ where: { isActive: true } }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    getContent(),
  ])

  const checklist: ChecklistItem[] = [
    {
      done: !!content.conferenceDates && !!content.venue,
      label: "Set conference dates and venue",
      href: "/admin/config/conference",
    },
    { done: committees.length > 0, label: "Add committees", href: "/admin/config/committees" },
    { done: portfolioCount > 0, label: "Generate the portfolio matrix", href: "/admin/config/committees" },
    { done: feeCount > 0, label: "Set registration fees", href: "/admin/config/money" },
    {
      done: content.paymentProvider !== "static_link" || !!content.staticPaymentLink,
      label: "Configure the payment provider",
      href: "/admin/config/money",
    },
    { done: content.registrationOpen, label: "Open registration", href: "/admin/config/registration" },
    { done: memberCount > 0, label: "Publish the team roster", href: "/admin/team" },
    { done: publishedPostCount > 0, label: "Publish the first dispatch", href: "/admin/blog" },
  ]

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
      <PageHeader
        eyebrow="Conference"
        title={t("admin.nav.overview")}
        description="Live numbers from the database."
      />

      {isMaintainer && <MaintainerWelcome />}
      {isMaintainer && <SetupChecklist items={checklist} />}

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
        <div className="editorial-card p-5">
          <h2 className="eyebrow mb-5 text-[10px]">{t("admin.overview.byStatus")}</h2>
          <StatusBarChart data={statusData} />
        </div>

        <div className="editorial-card p-5">
          <h2 className="eyebrow mb-5 text-[10px]">{t("admin.overview.sourceBreakdown")}</h2>
          <SourcePieChart data={sourceData} />
        </div>
      </div>

      {/* Committee fill-rate table */}
      <div className="editorial-card p-5">
        <h2 className="eyebrow mb-5 text-[10px]">{t("admin.overview.byCommittee")} — fill rate</h2>
        <CommitteeFillTable data={committeeData} />
      </div>
    </div>
  )
}
