import { requireRecruitmentAccess, requireCycleRole } from "@/lib/recruitment/authz"
import { AuditViewer } from "../_components/audit-viewer"

// The authorised audit viewer. requireCycleRole redirects anyone without
// `audit.view` (i.e. every JC) and records the refusal.
export default async function RecruitmentAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; outcome?: string; actor?: string; candidate?: string }>
}) {
  const { cycle } = await requireRecruitmentAccess()
  if (!cycle) return null

  const ctx = await requireCycleRole(cycle.id, "audit.view")
  const sp = await searchParams

  return <AuditViewer cycleId={ctx.cycle.id} cycleName={ctx.cycle.name} filters={sp} />
}
