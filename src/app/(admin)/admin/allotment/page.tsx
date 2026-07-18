import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { AllotmentBoard } from "./_components/allotment-board"
import { PageHeader } from "@/app/(admin)/_components/page-header"

export default async function AllotmentPage() {
  const session = await requireStaff()

  const [committees, delegates, fees] = await Promise.all([
    prisma.committee.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        portfolios: {
          orderBy: { name: "asc" },
          include: {
            allotment: {
              include: {
                delegate: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    isDtu: true,
                    coDelegate: { select: { id: true, fullName: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.delegate.findMany({
      where: { status: "REGISTERED" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        institution: true,
        isDtu: true,
        munExperience: true,
        pref1CommitteeId: true,
        pref1Portfolio: true,
        pref2CommitteeId: true,
        pref2Portfolio: true,
        coDelegate: { select: { id: true, fullName: true } },
        createdAt: true,
      },
    }),
    prisma.fee.findMany(),
  ])

  const serializedDelegates = delegates.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }))

  const serializedCommittees = committees.map((c) => ({
    ...c,
    portfolios: c.portfolios.map((p) => ({
      ...p,
      allotment: p.allotment
        ? {
            ...p.allotment,
            allottedAt: p.allotment.allottedAt.toISOString(),
            emailSentAt: p.allotment.emailSentAt?.toISOString() ?? null,
          }
        : null,
    })),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Conference"
        title="Allotment Board"
        description="Select a committee, then click a portfolio to allot."
      />
      <AllotmentBoard
        committees={serializedCommittees}
        delegates={serializedDelegates}
        fees={fees}
        adminEmail={session.user.email ?? "admin"}
      />
    </div>
  )
}
