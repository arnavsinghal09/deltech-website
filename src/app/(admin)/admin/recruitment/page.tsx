import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Download } from "lucide-react"
import { PageHeader } from "@/app/(admin)/_components/page-header"
import { RecruitmentPipeline, type PipelineApplicant } from "./_components/recruitment-pipeline"

export default async function RecruitmentPage() {
  await requireStaff()

  const applicants = await prisma.applicant.findMany({ orderBy: { createdAt: "asc" } })

  const serialized: PipelineApplicant[] = applicants.map((a) => ({
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
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Recruitment"
        title="Recruitment"
        description="Applicants arrive from the Google Form. The GD panel scores and shortlists; the PI panel scores and selects. All offline — just record the outcomes here."
      >
        <a
          href="/api/admin/export?entity=applicants&format=csv"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <Download className="size-3.5" /> CSV
        </a>
      </PageHeader>

      <RecruitmentPipeline applicants={serialized} />
    </div>
  )
}
