import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { SlotScoring } from "./_components/slot-scoring"

export default async function SlotDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await props.params

  const slot = await prisma.interviewSlot.findUnique({
    where: { id },
    include: {
      gdApplicants: { orderBy: { fullName: "asc" } },
      piApplicants: { orderBy: { fullName: "asc" } },
    },
  })
  if (!slot) notFound()

  const applicants = (slot.round === "GD" ? slot.gdApplicants : slot.piApplicants).map((a) => ({
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    year: a.year,
    branch: a.branch,
    status: a.status,
    score: slot.round === "GD" ? a.gdScore : a.piScore,
    verdict: slot.round === "GD" ? a.gdVerdict : a.piVerdict,
    otherScore: slot.round === "GD" ? a.piScore : a.gdScore,
  }))

  const panel = Array.isArray(slot.panel) ? (slot.panel as string[]) : []

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/recruitment/slots"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 gap-1.5 text-muted-foreground")}
        >
          <ArrowLeft className="size-3.5" /> Slots
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {slot.round === "GD" ? "Group Discussion" : "Personal Interview"}
          </h1>
          <Badge variant="secondary">
            {slot.startsAt.toLocaleString("en-IN", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {slot.venue && <span>{slot.venue} · </span>}
          {panel.length > 0 ? <>Panel: {panel.join(", ")}</> : "No panel set"}
        </p>
      </div>

      <SlotScoring round={slot.round} applicants={applicants} />
    </div>
  )
}
