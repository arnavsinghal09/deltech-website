import { requireRecruitmentAccess, resolveCycleContext, mayPerform } from "@/lib/recruitment/authz"
import { t } from "@/content/strings"
import { prisma } from "@/lib/prisma"
import { RecruitmentPageHeader } from "../../_components/page-header"
import { LiveRefresh } from "@/components/recruitment/live-refresh"
import { GroupList } from "../_components/group-list"
import { CreateGroupDialog } from "../_components/create-group-dialog"
import { listGroups } from "../_lib/queries"

export default async function PiGroupsPage() {
  const { cycle } = await requireRecruitmentAccess()
  if (!cycle) return null

  const ctx = await resolveCycleContext(cycle.id)
  if (!ctx) return null

  const canCreate = mayPerform(ctx, "group.create")

  const [groups, assignable, staff] = await Promise.all([
    listGroups(ctx, "PI"),
    // Anyone past GD: completed, bypassed, or configured not to need one. This is
    // the query that has to work for direct-to-PI candidates.
    canCreate
      ? prisma.recruitmentCandidate.findMany({
          where: {
            cycleId: cycle.id,
            piRequired: true,
            stage: { in: ["GD_COMPLETE", "GD_BYPASSED", "PI_PENDING"] },
            result: { in: ["PENDING", "ON_HOLD"] },
            groupMemberships: { none: { kind: "PI", attendance: { not: "REASSIGNED" } } },
          },
          orderBy: { fullName: "asc" },
          select: { id: true, fullName: true, email: true, branch: true, year: true },
        })
      : Promise.resolve([]),
    canCreate
      ? prisma.recruitmentMember.findMany({
          where: { cycleId: cycle.id, isActive: true },
          include: { user: { select: { name: true, email: true } } },
        })
      : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <LiveRefresh cycleId={cycle.id} />

      <RecruitmentPageHeader
        eyebrow={cycle.name}
        title={t("recruitment.groups.titlePi")}
        description={t("recruitment.groups.descriptionPi")}
      >
        {canCreate && (
          <CreateGroupDialog
            cycleId={cycle.id}
            kind="PI"
            candidates={assignable}
            staff={staff.map((m) => ({
              memberId: m.id,
              role: m.role,
              name: m.user.name,
              email: m.user.email,
            }))}
          />
        )}
      </RecruitmentPageHeader>

      <GroupList groups={groups} kind="PI" scoped={ctx.role === "JC"} />
    </div>
  )
}
