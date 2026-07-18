import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Download } from "lucide-react"
import { getContent } from "@/lib/settings"
import { PageHeader } from "@/app/(admin)/_components/page-header"
import { RecruitmentPipeline, type PipelineApplicant } from "./_components/recruitment-pipeline"

export default async function RecruitmentPage() {
  await requireStaff()

  const [applicants, content] = await Promise.all([
    prisma.applicant.findMany({ orderBy: { createdAt: "asc" } }),
    getContent(),
  ])

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
    answers:
      a.answers && typeof a.answers === "object" && !Array.isArray(a.answers)
        ? Object.fromEntries(Object.entries(a.answers).map(([key, value]) => [key, String(value ?? "")]))
        : {},
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Recruitment"
        title="Selection room"
        description="Pull the Google Form response sheet, read every applicant dossier, record the GD decision, pass shortlisted people to PI, and export the final team."
      >
        <a
          href="/api/admin/export?entity=applicants&format=xlsx"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <Download className="size-3.5" /> Full workbook
        </a>
      </PageHeader>

      <RecruitmentPipeline applicants={serialized} sheetUrl={content.recruitmentSheetUrl} />
    </div>
  )
}
