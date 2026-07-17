import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarClock, Download } from "lucide-react"
import { RecruitmentBoard } from "./_components/recruitment-board"

export default async function RecruitmentPage() {
  await requireStaff()

  const [applicants, slots] = await Promise.all([
    prisma.applicant.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        gdSlot: { select: { startsAt: true, venue: true } },
        piSlot: { select: { startsAt: true, venue: true } },
      },
    }),
    prisma.interviewSlot.findMany({
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { gdApplicants: true, piApplicants: true } } },
    }),
  ])

  const serializedApplicants = applicants.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    year: a.year,
    branch: a.branch,
    status: a.status,
    gdScore: a.gdScore,
    gdVerdict: a.gdVerdict,
    piScore: a.piScore,
    piVerdict: a.piVerdict,
    gdSlotAt: a.gdSlot?.startsAt.toISOString() ?? null,
    piSlotAt: a.piSlot?.startsAt.toISOString() ?? null,
  }))

  const serializedSlots = slots.map((s) => ({
    id: s.id,
    round: s.round,
    startsAt: s.startsAt.toISOString(),
    venue: s.venue,
    capacity: s.capacity,
    filled: s.round === "GD" ? s._count.gdApplicants : s._count.piApplicants,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recruitment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            GD → PI pipeline. Applicants land here automatically from the Google Form.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/admin/export?entity=applicants&format=csv"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Download className="size-3.5" /> CSV
          </a>
          <Link
            href="/admin/recruitment/slots"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <CalendarClock className="size-3.5" /> Manage slots
          </Link>
        </div>
      </div>

      <RecruitmentBoard applicants={serializedApplicants} slots={serializedSlots} />
    </div>
  )
}
