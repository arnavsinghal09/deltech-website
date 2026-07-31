// The candidate pipeline as an explicit state machine. Pure: no Prisma, no
// React, so scripts/check-recruitment-transitions.ts can exercise every edge.
//
// There is deliberately NO hardcoded GD → PI sequence. A candidate carries
// `gdRequired` / `piRequired` flags, and the legal moves out of a stage are
// computed from those flags plus the requested transition's authority. That is
// what lets someone go straight to PI, be sent back for a second GD, or be
// selected without a normal stage under an authorised override, without any of
// those being special cases bolted onto a linear flow.

import type { RecruitmentAction, RecruitmentRoleName } from "./permissions"

export type CandidateStageName =
  | "INTAKE"
  | "GD_PENDING"
  | "GD_ACTIVE"
  | "GD_COMPLETE"
  | "GD_BYPASSED"
  | "PI_PENDING"
  | "PI_ACTIVE"
  | "PI_COMPLETE"
  | "DECISION"
  | "CLOSED"

export type CandidateResultName =
  | "PENDING"
  | "ON_HOLD"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "DISQUALIFIED"

export interface CandidateSnapshot {
  stage: CandidateStageName
  result: CandidateResultName
  gdRequired: boolean
  piRequired: boolean
}

// Named reasons a transition can be refused. These are returned to the client as
// conflict responses and recorded in the audit trail with outcome REJECTED, so a
// refused move is never silently swallowed.
export type TransitionRefusal =
  | "not-permitted"
  | "illegal-transition"
  | "stage-requires-override"
  | "session-active"

export interface TransitionRequest {
  to: CandidateStageName
  // Set when the actor is exercising an explicit override. Overrides widen the
  // legal set but never bypass the capability check.
  override?: boolean
  // A live session on the candidate blocks stage moves unless overridden: this
  // is the "moved to PI while GD evaluation is still being submitted" case.
  hasActiveSession?: boolean
}

// The ordinary graph. Anything not listed here needs `candidate.override`.
const STAGE_GRAPH: Record<CandidateStageName, readonly CandidateStageName[]> = {
  // Intake can go to a GD queue, or straight to PI when GD isn't required.
  INTAKE: ["GD_PENDING", "PI_PENDING", "GD_BYPASSED", "CLOSED"],
  GD_PENDING: ["GD_ACTIVE", "GD_BYPASSED", "PI_PENDING", "INTAKE", "CLOSED"],
  GD_ACTIVE: ["GD_COMPLETE", "GD_PENDING", "CLOSED"],
  // After GD: on to PI, back for another GD, or straight to a decision.
  GD_COMPLETE: ["PI_PENDING", "GD_PENDING", "DECISION", "CLOSED"],
  GD_BYPASSED: ["PI_PENDING", "DECISION", "CLOSED"],
  PI_PENDING: ["PI_ACTIVE", "GD_PENDING", "DECISION", "CLOSED"],
  PI_ACTIVE: ["PI_COMPLETE", "PI_PENDING", "CLOSED"],
  // After PI: decide, or send back for another PI.
  PI_COMPLETE: ["DECISION", "PI_PENDING", "CLOSED"],
  DECISION: ["CLOSED", "PI_PENDING", "GD_PENDING"],
  // A closed candidate is not a dead end: reconsideration reopens them into a
  // queue or back to the decision desk. It never drops them straight into a live
  // session: that still needs an override, and `actionForTransition` makes any
  // move out of CLOSED require `candidate.reconsider`, which is admin-only.
  CLOSED: ["DECISION", "PI_PENDING", "GD_PENDING"],
}

// Which action authorises each destination stage. Everything else falls back to
// `candidate.advance`.
const ACTION_FOR_STAGE: Partial<Record<CandidateStageName, RecruitmentAction>> = {
  GD_BYPASSED: "candidate.bypassGd",
}

export function actionForTransition(req: TransitionRequest, from: CandidateStageName): RecruitmentAction {
  if (req.override) return "candidate.override"
  if (from === "CLOSED") return "candidate.reconsider"
  return ACTION_FOR_STAGE[req.to] ?? "candidate.advance"
}

export interface TransitionDecision {
  ok: boolean
  refusal?: TransitionRefusal
  // The action the caller must be permitted to perform. Returned even on refusal
  // so the audit record can name what was attempted.
  action: RecruitmentAction
}

// The single authority on whether a candidate may move. `permitted` is the result
// of can(role, action) && cycleAllows(state, action), computed by the caller,
// keeping this function free of any dependency on cycle or session tables.
export function decideTransition(
  current: CandidateSnapshot,
  req: TransitionRequest,
  permitted: (action: RecruitmentAction) => boolean,
): TransitionDecision {
  const action = actionForTransition(req, current.stage)

  // Authority first, so a refusal names the real reason and the audit row records
  // the attempted action rather than an incidental graph error.
  if (!permitted(action)) return { ok: false, refusal: "not-permitted", action }

  // Never yank a candidate out from under a running session unless overriding.
  // This is what stops "moved to PI while the GD evaluation was still open".
  if (req.hasActiveSession && !req.override && req.to !== "GD_COMPLETE" && req.to !== "PI_COMPLETE") {
    return { ok: false, refusal: "session-active", action }
  }

  // Self-transitions are a no-op, not an error: makes retries safe.
  if (current.stage === req.to) return { ok: true, action }

  const legal = STAGE_GRAPH[current.stage] ?? []
  if (!legal.includes(req.to)) {
    // An override may reach any stage; without one, refuse and say why.
    if (req.override) return { ok: true, action }
    return { ok: false, refusal: "stage-requires-override", action }
  }

  // Requiring a stage the candidate is flagged as not needing is a config error,
  // reachable only by override.
  if (req.to === "GD_ACTIVE" && !current.gdRequired && !req.override) {
    return { ok: false, refusal: "illegal-transition", action }
  }
  if (req.to === "PI_ACTIVE" && !current.piRequired && !req.override) {
    return { ok: false, refusal: "illegal-transition", action }
  }

  return { ok: true, action }
}

// ---------------------------------------------------------------------------
// Result transitions: kept separate from stage, because "where are they" and
// "what did we decide" are different questions with different authority.
// ---------------------------------------------------------------------------

const RESULT_GRAPH: Record<CandidateResultName, readonly CandidateResultName[]> = {
  PENDING: ["ON_HOLD", "SELECTED", "REJECTED", "WITHDRAWN", "DISQUALIFIED"],
  ON_HOLD: ["PENDING", "SELECTED", "REJECTED", "WITHDRAWN", "DISQUALIFIED"],
  // Reversible only by an authorised reconsideration, never by an ordinary edit.
  SELECTED: ["ON_HOLD", "REJECTED", "WITHDRAWN", "DISQUALIFIED"],
  REJECTED: ["ON_HOLD", "PENDING", "SELECTED"],
  // A withdrawal is the candidate's own decision; only they can undo it (an
  // admin does so on their behalf via reconsider).
  WITHDRAWN: ["PENDING"],
  DISQUALIFIED: ["PENDING", "ON_HOLD"],
}

export function canTransitionResult(from: CandidateResultName, to: CandidateResultName): boolean {
  if (from === to) return true
  return RESULT_GRAPH[from]?.includes(to) ?? false
}

export function actionForResult(to: CandidateResultName): RecruitmentAction {
  switch (to) {
    case "ON_HOLD":
      return "candidate.hold"
    case "WITHDRAWN":
      return "candidate.withdraw"
    case "DISQUALIFIED":
      return "candidate.disqualify"
    case "SELECTED":
    case "REJECTED":
      return "candidate.finalise"
    case "PENDING":
      return "candidate.reconsider"
  }
}

// ---------------------------------------------------------------------------
// Derived pipeline questions the UI and the monitor both need. Centralised so
// the dashboard counts and the operational screens can never disagree.
// ---------------------------------------------------------------------------

// The next stage this candidate would naturally enter, or null when they are done.
// Honours the gd/piRequired flags rather than assuming GD → PI.
export function nextNaturalStage(c: CandidateSnapshot): CandidateStageName | null {
  switch (c.stage) {
    case "INTAKE":
      return c.gdRequired ? "GD_PENDING" : "PI_PENDING"
    case "GD_PENDING":
      return "GD_ACTIVE"
    case "GD_ACTIVE":
      return "GD_COMPLETE"
    case "GD_COMPLETE":
    case "GD_BYPASSED":
      return c.piRequired ? "PI_PENDING" : "DECISION"
    case "PI_PENDING":
      return "PI_ACTIVE"
    case "PI_ACTIVE":
      return "PI_COMPLETE"
    case "PI_COMPLETE":
      return "DECISION"
    case "DECISION":
      return "CLOSED"
    case "CLOSED":
      return null
  }
}

export function isTerminalResult(r: CandidateResultName): boolean {
  return r === "REJECTED" || r === "WITHDRAWN" || r === "DISQUALIFIED"
}

// True when the candidate reached PI without completing GD. The PI dossier uses
// this to render "GD intentionally bypassed" instead of an empty GD panel.
export function gdWasBypassed(c: CandidateSnapshot): boolean {
  return c.stage === "GD_BYPASSED" || (!c.gdRequired && c.stage !== "INTAKE")
}
