import Link from "next/link"
import { prisma } from "@/lib/prisma"
import {
  mayPerform,
  requireRecruitmentAccess,
  resolveCycleContext,
  visibleGroupIds,
} from "@/lib/recruitment/authz"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { t } from "@/content/strings"
import { RecruitmentPageHeader } from "../../_components/page-header"
import { LiveRefresh } from "@/components/recruitment/live-refresh"
import { ResultBadge, StageBadge } from "../../_components/status-badges"
import { BypassGdButton } from "../_components/bypass-gd-button"
import type { CandidateResult, CandidateStage, Prisma } from "@/generated/prisma/client"

const STAGES: CandidateStage[] = [
  "INTAKE",
  "GD_PENDING",
  "GD_ACTIVE",
  "GD_COMPLETE",
  "GD_BYPASSED",
  "PI_PENDING",
  "PI_ACTIVE",
  "PI_COMPLETE",
  "DECISION",
  "CLOSED",
]
const RESULTS: CandidateResult[] = [
  "PENDING",
  "ON_HOLD",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
  "DISQUALIFIED",
]

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; result?: string }>
}) {
  const { cycle } = await requireRecruitmentAccess()
  if (!cycle) return null

  const ctx = await resolveCycleContext(cycle.id)
  if (!ctx) return null

  const sp = await searchParams
  const q = sp.q?.trim() ?? ""

  // A JC only sees candidates in groups they staff: a capability check alone would
  // still hand them the whole cycle's candidate list.
  const scopedGroups = await visibleGroupIds(ctx)

  const where: Prisma.RecruitmentCandidateWhereInput = {
    cycleId: cycle.id,
    ...(scopedGroups
      ? { groupMemberships: { some: { groupId: { in: scopedGroups } } } }
      : {}),
    ...(sp.stage && STAGES.includes(sp.stage as CandidateStage)
      ? { stage: sp.stage as CandidateStage }
      : {}),
    ...(sp.result && RESULTS.includes(sp.result as CandidateResult)
      ? { result: sp.result as CandidateResult }
      : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { branch: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [candidates, total] = await Promise.all([
    prisma.recruitmentCandidate.findMany({
      where,
      orderBy: [{ fullName: "asc" }],
      take: 200,
      select: {
        id: true,
        fullName: true,
        email: true,
        year: true,
        branch: true,
        stage: true,
        result: true,
        gdRequired: true,
        manualEditedFields: true,
      },
    }),
    prisma.recruitmentCandidate.count({ where }),
  ])

  const canBypass = mayPerform(ctx, "candidate.bypassGd")

  return (
    <div className="space-y-6">
      <LiveRefresh cycleId={cycle.id} pollMs={30000} />

      <RecruitmentPageHeader
        eyebrow={cycle.name}
        title={t("recruitment.candidates.title")}
        description={t("recruitment.candidates.description")}
      />

      {/* GET form so filters are shareable and survive a refresh. */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="sr-only">
            {t("common.search")}
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder={t("recruitment.candidates.searchPlaceholder")}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          />
        </div>
        <select
          name="stage"
          defaultValue={sp.stage ?? ""}
          aria-label={t("recruitment.candidates.stageFilter")}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">{t("recruitment.candidates.allStages")}</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {t(`recruitment.stage.${s}`)}
            </option>
          ))}
        </select>
        <select
          name="result"
          defaultValue={sp.result ?? ""}
          aria-label={t("recruitment.candidates.resultFilter")}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">{t("recruitment.candidates.allResults")}</option>
          {RESULTS.map((r) => (
            <option key={r} value={r}>
              {t(`recruitment.result.${r}`)}
            </option>
          ))}
        </select>
        <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          {t("common.search")}
        </button>
      </form>

      <p className="text-xs text-muted-foreground">
        {t("recruitment.candidates.count", { count: total })}
      </p>

      {candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {total === 0 && !q && !sp.stage && !sp.result
            ? t("recruitment.candidates.emptyCycle")
            : t("recruitment.candidates.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-md border border-border/70">
          {candidates.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{c.fullName}</p>
                  <StageBadge stage={c.stage} />
                  <ResultBadge result={c.result} />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {[c.email, c.branch, c.year].filter(Boolean).join(" · ")}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/* Only offered where it is actually legal: still pre-GD, and the
                    viewer holds the capability. JCs never see this. */}
                {canBypass && c.gdRequired && (c.stage === "INTAKE" || c.stage === "GD_PENDING") && (
                  <BypassGdButton candidateId={c.id} candidateName={c.fullName} cycleId={cycle.id} />
                )}
                <Link
                  href={`/recruitment/candidates/${c.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  {t("recruitment.candidates.openDossier")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
