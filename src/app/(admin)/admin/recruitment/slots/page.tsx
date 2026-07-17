import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { SlotManager } from "./_components/slot-manager"

export default async function SlotsPage() {
  const session = await requireStaff()
  const isAdmin = (session.user as { role?: string }).role === "ADMIN"

  const slots = await prisma.interviewSlot.findMany({
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { gdApplicants: true, piApplicants: true } } },
  })

  const serialized = slots.map((s) => ({
    id: s.id,
    round: s.round,
    startsAt: s.startsAt.toISOString(),
    venue: s.venue,
    capacity: s.capacity,
    panel: Array.isArray(s.panel) ? (s.panel as string[]) : [],
    filled: s.round === "GD" ? s._count.gdApplicants : s._count.piApplicants,
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/recruitment"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 gap-1.5 text-muted-foreground")}
        >
          <ArrowLeft className="size-3.5" /> Recruitment
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Interview slots</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create GD/PI slots with a panel, then bulk-assign applicants from the board.
          Click a slot to enter scores.
        </p>
      </div>

      <SlotManager slots={serialized} isAdmin={isAdmin} />
    </div>
  )
}
