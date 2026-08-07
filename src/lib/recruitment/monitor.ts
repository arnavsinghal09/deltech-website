// Authoritative recruitment counts for the admin monitor.
//
// Everything here derives from database state via groupBy, never from an
// incrementing counter or a client-side tally, so the numbers are identical
// before and after a refresh, and two admins watching see the same thing.
// Realtime updates re-run this query; they never patch a number in place.

import { prisma } from "@/lib/prisma"
import { STALE_AFTER_MS } from "./session"
import type { CandidateResult, CandidateStage } from "@/generated/prisma/client"

export interface CycleMonitorCounts {
  cycleId: string
  // Candidates
  total: number
  unassignedGd: number
  unassignedPi: number
  gdPending: number
  gdActive: number
  gdComplete: number
  gdBypassed: number
  piPending: number
  piActive: number
  piComplete: number
  atDecision: number
  closed: number
  // Results
  resultPending: number
  onHold: number
  selected: number
  rejected: number
  withdrawn: number
  disqualified: number
  // Selected but not yet added to the society: finalisation and recruitment are
  // separate actions, so this gap is a real operational queue.
  awaitingRecruitment: number
  recruited: number
  // Work outstanding
  evaluationsDraft: number
  evaluationsSubmitted: number
  // Candidates in a completed session with fewer submitted evaluations than the
  // cycle requires. This is the "evaluation pending" figure operators care about.
  evaluationPending: number
  // Sessions
  sessionsNotStarted: number
  sessionsActive: number
  sessionsPaused: number
  sessionsCompleted: number
  sessionsAborted: number
  staleSessions: number
  // Imports
  importErrors: number
  lastImportAt: Date | null
  // Sampled server time, so a client can anchor its own ticking display.
  serverNow: Date
}

const ZERO_STAGES: Record<CandidateStage, number> = {
  INTAKE: 0,
  GD_PENDING: 0,
  GD_ACTIVE: 0,
  GD_COMPLETE: 0,
  GD_BYPASSED: 0,
  PI_PENDING: 0,
  PI_ACTIVE: 0,
  PI_COMPLETE: 0,
  DECISION: 0,
  CLOSED: 0,
}

const ZERO_RESULTS: Record<CandidateResult, number> = {
  PENDING: 0,
  ON_HOLD: 0,
  SELECTED: 0,
  REJECTED: 0,
  WITHDRAWN: 0,
  DISQUALIFIED: 0,
}

export async function getCycleMonitorCounts(cycleId: string): Promise<CycleMonitorCounts> {
  const serverNow = new Date()
  const staleBefore = new Date(serverNow.getTime() - STALE_AFTER_MS)

  const [
    byStage,
    byResult,
    bySessionState,
    staleSessions,
    evaluationsByState,
    awaitingRecruitment,
    recruited,
    unassignedGd,
    unassignedPi,
    imports,
    lastImport,
    total,
  ] = await Promise.all([
    prisma.recruitmentCandidate.groupBy({
      by: ["stage"],
      where: { cycleId },
      _count: { _all: true },
    }),
    prisma.recruitmentCandidate.groupBy({
      by: ["result"],
      where: { cycleId },
      _count: { _all: true },
    }),
    prisma.recruitmentSession.groupBy({
      by: ["state"],
      where: { cycleId },
      _count: { _all: true },
    }),
    // A live session with no recent activity. Reported, never auto-closed,
    // silently ending someone's GD would be worse than flagging it.
    prisma.recruitmentSession.count({
      where: {
        cycleId,
        state: { in: ["ACTIVE", "PAUSED"] },
        OR: [{ lastActivityAt: { lt: staleBefore } }, { lastActivityAt: null, startedAt: { lt: staleBefore } }],
      },
    }),
    prisma.recruitmentEvaluation.groupBy({
      by: ["state"],
      where: { cycleId },
      _count: { _all: true },
    }),
    prisma.recruitmentCandidate.count({
      where: { cycleId, result: "SELECTED", recruitedUserId: null },
    }),
    prisma.recruitmentCandidate.count({ where: { cycleId, recruitedUserId: { not: null } } }),
    // Needs a GD, isn't in a GD group yet, and hasn't been bypassed.
    prisma.recruitmentCandidate.count({
      where: {
        cycleId,
        gdRequired: true,
        stage: { in: ["INTAKE", "GD_PENDING"] },
        groupMemberships: { none: { kind: "GD", attendance: { not: "REASSIGNED" } } },
      },
    }),
    prisma.recruitmentCandidate.count({
      where: {
        cycleId,
        piRequired: true,
        stage: { in: ["GD_COMPLETE", "GD_BYPASSED", "PI_PENDING"] },
        groupMemberships: { none: { kind: "PI", attendance: { not: "REASSIGNED" } } },
      },
    }),
    prisma.recruitmentImport.findMany({
      where: { cycleId },
      select: { rowsInvalid: true, state: true },
    }),
    prisma.recruitmentImport.findFirst({
      where: { cycleId, state: "APPLIED" },
      orderBy: { startedAt: "desc" },
      select: { finishedAt: true, startedAt: true },
    }),
    prisma.recruitmentCandidate.count({ where: { cycleId } }),
  ])

  const stages = { ...ZERO_STAGES }
  for (const row of byStage) stages[row.stage] = row._count._all

  const results = { ...ZERO_RESULTS }
  for (const row of byResult) results[row.result] = row._count._all

  const sessions = { NOT_STARTED: 0, ACTIVE: 0, PAUSED: 0, COMPLETED: 0, ABORTED: 0 }
  for (const row of bySessionState) sessions[row.state] = row._count._all

  const evaluations = { DRAFT: 0, SUBMITTED: 0, SUPERSEDED: 0, VOIDED: 0 }
  for (const row of evaluationsByState) evaluations[row.state] = row._count._all

  const evaluationPending = await countEvaluationPending(cycleId)

  return {
    cycleId,
    total,
    unassignedGd,
    unassignedPi,
    gdPending: stages.GD_PENDING,
    gdActive: stages.GD_ACTIVE,
    gdComplete: stages.GD_COMPLETE,
    gdBypassed: stages.GD_BYPASSED,
    piPending: stages.PI_PENDING,
    piActive: stages.PI_ACTIVE,
    piComplete: stages.PI_COMPLETE,
    atDecision: stages.DECISION,
    closed: stages.CLOSED,
    resultPending: results.PENDING,
    onHold: results.ON_HOLD,
    selected: results.SELECTED,
    rejected: results.REJECTED,
    withdrawn: results.WITHDRAWN,
    disqualified: results.DISQUALIFIED,
    awaitingRecruitment,
    recruited,
    evaluationsDraft: evaluations.DRAFT,
    evaluationsSubmitted: evaluations.SUBMITTED,
    evaluationPending,
    sessionsNotStarted: sessions.NOT_STARTED,
    sessionsActive: sessions.ACTIVE,
    sessionsPaused: sessions.PAUSED,
    sessionsCompleted: sessions.COMPLETED,
    sessionsAborted: sessions.ABORTED,
    staleSessions,
    importErrors: imports.reduce((sum, i) => sum + i.rowsInvalid, 0) + imports.filter((i) => i.state === "FAILED").length,
    lastImportAt: lastImport?.finishedAt ?? lastImport?.startedAt ?? null,
    serverNow,
  }
}

// Candidates who finished a stage but whose panel has not submitted. Counted as
// "someone still owes a score", which is what an operator chasing a panel needs.
async function countEvaluationPending(cycleId: string): Promise<number> {
  const rows = await prisma.recruitmentCandidate.findMany({
    where: { cycleId, stage: { in: ["GD_COMPLETE", "PI_COMPLETE"] } },
    select: {
      id: true,
      stage: true,
      evaluations: { where: { state: "SUBMITTED" }, select: { kind: true } },
    },
  })
  return rows.filter((c) => {
    const needed = c.stage === "GD_COMPLETE" ? "GD" : "PI"
    return !c.evaluations.some((e) => e.kind === needed)
  }).length
}

// Live session rows for the monitor table, who is running what, for how long, and
// how much of the panel has reported. Everything a supervising admin needs
// without opening the operational screens.
export interface MonitorSessionRow {
  id: string
  groupId: string
  groupTitle: string
  kind: "GD" | "PI"
  state: string
  attempt: number
  scheduledAt: Date | null
  startedAt: Date | null
  pausedAt: Date | null
  endedAt: Date | null
  pausedMs: number
  lastActivityAt: Date | null
  controllerId: string | null
  version: number
  candidateCount: number
  evaluationCount: number
  staff: { name: string | null; email: string; role: string }[]
}

export async function getMonitorSessions(cycleId: string, limit = 50): Promise<MonitorSessionRow[]> {
  const sessions = await prisma.recruitmentSession.findMany({
    where: { cycleId },
    orderBy: [{ state: "asc" }, { startedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      groupId: true,
      kind: true,
      state: true,
      attempt: true,
      scheduledAt: true,
      startedAt: true,
      pausedAt: true,
      endedAt: true,
      pausedMs: true,
      lastActivityAt: true,
      controllerId: true,
      version: true,
      group: {
        select: {
          title: true,
          _count: { select: { members: true } },
          staff: {
            select: {
              role: true,
              member: { select: { user: { select: { name: true, email: true } } } },
            },
          },
        },
      },
      _count: { select: { evaluations: true } },
    },
  })

  return sessions.map((s) => ({
    id: s.id,
    groupId: s.groupId,
    groupTitle: s.group.title,
    kind: s.kind,
    state: s.state,
    attempt: s.attempt,
    scheduledAt: s.scheduledAt,
    startedAt: s.startedAt,
    pausedAt: s.pausedAt,
    endedAt: s.endedAt,
    pausedMs: s.pausedMs,
    lastActivityAt: s.lastActivityAt,
    controllerId: s.controllerId,
    version: s.version,
    candidateCount: s.group._count.members,
    evaluationCount: s._count.evaluations,
    staff: s.group.staff.map((a) => ({
      name: a.member.user.name,
      email: a.member.user.email,
      role: a.role,
    })),
  }))
}
