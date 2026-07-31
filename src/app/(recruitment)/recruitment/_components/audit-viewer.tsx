import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { t, type StringKey } from "@/content/strings"
import { RecruitmentPageHeader } from "../../_components/page-header"
import type { AuditOutcome, Prisma } from "@/generated/prisma/client"

// Filterable audit trail. Refused actions are first-class rows here (outcome
// REJECTED), which is the point: a permission or state-machine denial is evidence,
// not noise. The table is append-only at the database level, so there is
// deliberately no edit or delete affordance anywhere on this page.

const OUTCOMES: AuditOutcome[] = ["SUCCESS", "REJECTED", "FAILED"]

const OUTCOME_TONE: Record<string, string> = {
  SUCCESS: "bg-secondary text-secondary-foreground",
  REJECTED: "bg-accent text-accent-foreground",
  FAILED: "bg-[var(--signal-soft)] text-[var(--ink-soft)]",
}

const OUTCOME_LABEL: Record<AuditOutcome, StringKey> = {
  SUCCESS: "recruitment.audit.outcomeSuccess",
  REJECTED: "recruitment.audit.outcomeRejected",
  FAILED: "recruitment.audit.outcomeFailed",
}

export async function AuditViewer({
  cycleId,
  cycleName,
  filters,
}: {
  cycleId: string
  cycleName: string
  filters: { event?: string; outcome?: string; actor?: string; candidate?: string }
}) {
  const where: Prisma.RecruitmentAuditEventWhereInput = {
    cycleId,
    ...(filters.event ? { eventType: { startsWith: filters.event } } : {}),
    ...(filters.outcome && OUTCOMES.includes(filters.outcome as AuditOutcome)
      ? { outcome: filters.outcome as AuditOutcome }
      : {}),
    ...(filters.actor ? { actorEmail: { contains: filters.actor, mode: "insensitive" } } : {}),
    ...(filters.candidate ? { candidateId: filters.candidate } : {}),
  }

  const [events, eventTypes] = await Promise.all([
    prisma.recruitmentAuditEvent.findMany({
      where,
      orderBy: { at: "desc" },
      take: 200,
    }),
    // Distinct event types actually present, so the filter never offers a dead option.
    prisma.recruitmentAuditEvent.findMany({
      where: { cycleId },
      distinct: ["eventType"],
      select: { eventType: true },
      orderBy: { eventType: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <RecruitmentPageHeader
        eyebrow={cycleName}
        title={t("recruitment.audit.title")}
        description={t("recruitment.audit.description")}
      />

      <form className="flex flex-wrap items-end gap-3">
        <select
          name="event"
          defaultValue={filters.event ?? ""}
          aria-label={t("recruitment.audit.eventTypeFilter")}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">{t("recruitment.audit.allEvents")}</option>
          {eventTypes.map((e) => (
            <option key={e.eventType} value={e.eventType}>
              {e.eventType}
            </option>
          ))}
        </select>
        <select
          name="outcome"
          defaultValue={filters.outcome ?? ""}
          aria-label={t("recruitment.audit.outcomeFilter")}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">{t("recruitment.audit.allOutcomes")}</option>
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>
              {t(OUTCOME_LABEL[o])}
            </option>
          ))}
        </select>
        <input
          name="actor"
          defaultValue={filters.actor ?? ""}
          aria-label={t("recruitment.audit.actorFilter")}
          placeholder={t("recruitment.control.staffEmailLabel")}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        />
        <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          {t("common.search")}
        </button>
      </form>

      <p className="text-xs text-muted-foreground">{t("recruitment.audit.immutableNote")}</p>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("recruitment.audit.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id}>
              <Card className="space-y-1.5 p-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Badge className={cn("font-normal", OUTCOME_TONE[e.outcome])}>
                    {t(OUTCOME_LABEL[e.outcome])}
                  </Badge>
                  <span className="font-mono text-xs">{e.eventType}</span>
                  <span className="text-xs text-muted-foreground">
                    {e.actorEmail}
                    {e.actorRole && <> · {e.actorRole}</>}
                  </span>
                  <time
                    className="ml-auto text-xs text-muted-foreground"
                    dateTime={e.at.toISOString()}
                  >
                    {e.at.toISOString().slice(0, 19).replace("T", " ")}
                  </time>
                </div>

                {e.reason && <p className="text-muted-foreground">{e.reason}</p>}

                {(e.previousState || e.newState) && (
                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    {e.previousState !== null && (
                      <div>
                        <p className="text-muted-foreground">{t("recruitment.audit.previousState")}</p>
                        <pre className="mt-0.5 overflow-x-auto rounded bg-muted/60 p-1.5">
                          {JSON.stringify(e.previousState, null, 1)}
                        </pre>
                      </div>
                    )}
                    {e.newState !== null && (
                      <div>
                        <p className="text-muted-foreground">{t("recruitment.audit.newState")}</p>
                        <pre className="mt-0.5 overflow-x-auto rounded bg-muted/60 p-1.5">
                          {JSON.stringify(e.newState, null, 1)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* The correlation id ties a retry storm or a partial failure together. */}
                {e.requestId && (
                  <p className="font-mono text-[0.7rem] text-muted-foreground">{e.requestId}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
