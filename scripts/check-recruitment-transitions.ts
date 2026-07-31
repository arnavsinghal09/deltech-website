// Runnable check for the candidate pipeline state machine:
//   npx tsx scripts/check-recruitment-transitions.ts
//
// The spec's core demand is that there is NO hardcoded GD → PI sequence, and that
// every off-happy-path case is a modelled state rather than an inferred gap. These
// assertions pin exactly that.
import assert from "node:assert"
import {
  actionForResult,
  actionForTransition,
  canTransitionResult,
  decideTransition,
  gdWasBypassed,
  isTerminalResult,
  nextNaturalStage,
  type CandidateResultName,
  type CandidateSnapshot,
  type CandidateStageName,
} from "../src/lib/recruitment/transitions"
import { can, cycleAllows, type RecruitmentRoleName } from "../src/lib/recruitment/permissions"

const base: CandidateSnapshot = {
  stage: "INTAKE",
  result: "PENDING",
  gdRequired: true,
  piRequired: true,
}
const at = (stage: CandidateStageName, over: Partial<CandidateSnapshot> = {}): CandidateSnapshot => ({
  ...base,
  stage,
  ...over,
})

// Permission oracle for a role in a running cycle — the real composition used by
// server actions, so these checks exercise authority and the graph together.
const asRole = (role: RecruitmentRoleName) => (a: Parameters<typeof can>[1]) =>
  can(role, a) && cycleAllows("IN_PROGRESS", a)
const allow = () => true

// ── The normal path ─────────────────────────────────────────────────────────
assert.ok(decideTransition(at("INTAKE"), { to: "GD_PENDING" }, allow).ok)
assert.ok(decideTransition(at("GD_PENDING"), { to: "GD_ACTIVE" }, allow).ok)
assert.ok(decideTransition(at("GD_ACTIVE"), { to: "GD_COMPLETE" }, allow).ok)
assert.ok(decideTransition(at("GD_COMPLETE"), { to: "PI_PENDING" }, allow).ok)
assert.ok(decideTransition(at("PI_PENDING"), { to: "PI_ACTIVE" }, allow).ok)
assert.ok(decideTransition(at("PI_ACTIVE"), { to: "PI_COMPLETE" }, allow).ok)
assert.ok(decideTransition(at("PI_COMPLETE"), { to: "DECISION" }, allow).ok)
assert.ok(decideTransition(at("DECISION"), { to: "CLOSED" }, allow).ok)

// ── Direct to PI: no GD required, and it is NOT a bypass ────────────────────
const directToPi = at("INTAKE", { gdRequired: false })
assert.ok(decideTransition(directToPi, { to: "PI_PENDING" }, allow).ok, "intake → PI must be legal")
assert.equal(nextNaturalStage(directToPi), "PI_PENDING", "no-GD candidate skips the GD queue")
// A GD-required candidate naturally queues for GD instead.
assert.equal(nextNaturalStage(at("INTAKE")), "GD_PENDING")
// Running a GD for someone flagged as not needing one is a config error.
assert.equal(
  decideTransition(at("GD_PENDING", { gdRequired: false }), { to: "GD_ACTIVE" }, allow).refusal,
  "illegal-transition",
)
// ...reachable only with an explicit override.
assert.ok(
  decideTransition(at("GD_PENDING", { gdRequired: false }), { to: "GD_ACTIVE", override: true }, allow).ok,
)
assert.equal(
  decideTransition(at("PI_PENDING", { piRequired: false }), { to: "PI_ACTIVE" }, allow).refusal,
  "illegal-transition",
)

// ── GD bypass authority ─────────────────────────────────────────────────────
// The action a bypass maps to, so the capability matrix is the thing consulted.
assert.equal(actionForTransition({ to: "GD_BYPASSED" }, "GD_PENDING"), "candidate.bypassGd")
// A JC is refused; a maintainer and an admin are not. This is the headline rule.
assert.equal(
  decideTransition(at("GD_PENDING"), { to: "GD_BYPASSED" }, asRole("JC")).refusal,
  "not-permitted",
  "a JC must never bypass GD",
)
assert.ok(decideTransition(at("GD_PENDING"), { to: "GD_BYPASSED" }, asRole("MAINTAINER")).ok)
assert.ok(decideTransition(at("GD_PENDING"), { to: "GD_BYPASSED" }, asRole("ADMIN")).ok)
// Bypass is reachable straight from intake too (never queued for GD at all).
assert.ok(decideTransition(at("INTAKE"), { to: "GD_BYPASSED" }, asRole("MAINTAINER")).ok)
// A bypassed candidate goes on to PI and shows as bypassed, not as missing data.
assert.ok(decideTransition(at("GD_BYPASSED"), { to: "PI_PENDING" }, allow).ok)
assert.equal(gdWasBypassed(at("GD_BYPASSED")), true)
assert.equal(gdWasBypassed(at("PI_PENDING", { gdRequired: false })), true)
assert.equal(gdWasBypassed(at("PI_PENDING")), false, "a normal PI candidate is not 'bypassed'")
assert.equal(gdWasBypassed(at("INTAKE", { gdRequired: false })), false, "still at intake — not yet bypassed")
// Reversing a bypass is admin-only.
assert.equal(can("MAINTAINER", "candidate.reverseBypass"), false)
assert.equal(can("ADMIN", "candidate.reverseBypass"), true)

// ── Send someone back for another GD or PI ──────────────────────────────────
assert.ok(decideTransition(at("GD_COMPLETE"), { to: "GD_PENDING" }, allow).ok, "another GD")
assert.ok(decideTransition(at("PI_COMPLETE"), { to: "PI_PENDING" }, allow).ok, "another PI")
assert.ok(decideTransition(at("PI_PENDING"), { to: "GD_PENDING" }, allow).ok, "back to GD from PI queue")
assert.ok(decideTransition(at("DECISION"), { to: "PI_PENDING" }, allow).ok, "reopen the PI stage")

// ── Skipping stages requires an override ────────────────────────────────────
assert.equal(
  decideTransition(at("INTAKE"), { to: "PI_ACTIVE" }, allow).refusal,
  "stage-requires-override",
)
assert.equal(decideTransition(at("INTAKE"), { to: "DECISION" }, allow).refusal, "stage-requires-override")
// With an authorised override, selection without every normal stage is possible.
assert.ok(decideTransition(at("INTAKE"), { to: "DECISION", override: true }, asRole("ADMIN")).ok)
// But an override still needs the override capability — a maintainer cannot.
assert.equal(
  decideTransition(at("INTAKE"), { to: "DECISION", override: true }, asRole("MAINTAINER")).refusal,
  "not-permitted",
)
assert.equal(actionForTransition({ to: "DECISION", override: true }, "INTAKE"), "candidate.override")

// ── A live session protects in-flight evaluations ───────────────────────────
// "Candidate moved to PI while the GD evaluation is still being submitted".
assert.equal(
  decideTransition(at("GD_ACTIVE"), { to: "GD_PENDING", hasActiveSession: true }, allow).refusal,
  "session-active",
)
// Completing the stage they are actually in is still allowed — that IS the session
// finishing, and blocking it would deadlock the session.
assert.ok(decideTransition(at("GD_ACTIVE"), { to: "GD_COMPLETE", hasActiveSession: true }, allow).ok)
assert.ok(decideTransition(at("PI_ACTIVE"), { to: "PI_COMPLETE", hasActiveSession: true }, allow).ok)
// An admin override can still pull them out.
assert.ok(
  decideTransition(at("GD_ACTIVE"), { to: "GD_PENDING", hasActiveSession: true, override: true }, asRole("ADMIN")).ok,
)

// ── Closed candidates and reconsideration ───────────────────────────────────
// Any move out of CLOSED is a reconsideration, whatever the destination looks like.
assert.equal(actionForTransition({ to: "PI_PENDING" }, "CLOSED"), "candidate.reconsider")
assert.equal(actionForTransition({ to: "GD_PENDING" }, "CLOSED"), "candidate.reconsider")
// Reopening into a queue is fine; reopening straight into a live session is not.
assert.ok(decideTransition(at("CLOSED"), { to: "PI_PENDING" }, allow).ok)
assert.ok(decideTransition(at("CLOSED"), { to: "GD_PENDING" }, allow).ok)
assert.ok(decideTransition(at("CLOSED"), { to: "DECISION" }, allow).ok)
assert.equal(
  decideTransition(at("CLOSED"), { to: "PI_ACTIVE" }, allow).refusal,
  "stage-requires-override",
  "reconsideration must not drop someone straight into a live session",
)
// Reconsideration is admin-only; a maintainer cannot reopen a closed candidate.
assert.equal(
  decideTransition(at("CLOSED"), { to: "PI_PENDING" }, asRole("MAINTAINER")).refusal,
  "not-permitted",
)
assert.ok(decideTransition(at("CLOSED"), { to: "PI_PENDING" }, asRole("ADMIN")).ok)

// ── Retries are safe: a self-transition is a no-op, not an error ────────────
for (const stage of [
  "INTAKE",
  "GD_PENDING",
  "GD_ACTIVE",
  "GD_COMPLETE",
  "GD_BYPASSED",
  "PI_PENDING",
  "PI_ACTIVE",
  "PI_COMPLETE",
  "DECISION",
] as CandidateStageName[]) {
  assert.ok(
    decideTransition(at(stage), { to: stage }, allow).ok,
    `re-requesting ${stage} must be an idempotent no-op`,
  )
}

// ── Permission is checked BEFORE the graph, so refusals name the real reason ─
const denied = decideTransition(at("INTAKE"), { to: "GD_PENDING" }, () => false)
assert.equal(denied.ok, false)
assert.equal(denied.refusal, "not-permitted")
assert.equal(denied.action, "candidate.advance", "the attempted action is reported for the audit row")

// ── Result transitions are separate from stage ──────────────────────────────
assert.equal(canTransitionResult("PENDING", "ON_HOLD"), true)
assert.equal(canTransitionResult("PENDING", "SELECTED"), true)
assert.equal(canTransitionResult("ON_HOLD", "SELECTED"), true)
assert.equal(canTransitionResult("REJECTED", "SELECTED"), true, "un-rejecting must be possible")
assert.equal(canTransitionResult("SELECTED", "REJECTED"), true)
assert.equal(canTransitionResult("PENDING", "WITHDRAWN"), true)
assert.equal(canTransitionResult("PENDING", "DISQUALIFIED"), true)
// A withdrawal is the candidate's own call: it only returns to PENDING.
assert.equal(canTransitionResult("WITHDRAWN", "SELECTED"), false)
assert.equal(canTransitionResult("WITHDRAWN", "PENDING"), true)
// Self-transition is a no-op (idempotent finalisation under retry).
assert.equal(canTransitionResult("SELECTED", "SELECTED"), true)

// Each result maps to the action that authorises it.
assert.equal(actionForResult("SELECTED"), "candidate.finalise")
assert.equal(actionForResult("REJECTED"), "candidate.finalise")
assert.equal(actionForResult("ON_HOLD"), "candidate.hold")
assert.equal(actionForResult("WITHDRAWN"), "candidate.withdraw")
assert.equal(actionForResult("DISQUALIFIED"), "candidate.disqualify")
assert.equal(actionForResult("PENDING"), "candidate.reconsider")
// Only an admin finalises — a maintainer running the GD cannot select anyone.
assert.equal(can("MAINTAINER", actionForResult("SELECTED")), false)
assert.equal(can("ADMIN", actionForResult("SELECTED")), true)
assert.equal(can("JC", actionForResult("REJECTED")), false)
// ...but a maintainer can put someone on hold or mark them absent/withdrawn.
assert.equal(can("MAINTAINER", actionForResult("ON_HOLD")), true)
assert.equal(can("MAINTAINER", actionForResult("WITHDRAWN")), true)

// ── Terminal results ────────────────────────────────────────────────────────
assert.equal(isTerminalResult("REJECTED"), true)
assert.equal(isTerminalResult("WITHDRAWN"), true)
assert.equal(isTerminalResult("DISQUALIFIED"), true)
assert.equal(isTerminalResult("SELECTED"), false, "selected is not terminal — recruitment follows")
assert.equal(isTerminalResult("PENDING"), false)
assert.equal(isTerminalResult("ON_HOLD"), false)

// ── nextNaturalStage honours the flags rather than assuming GD → PI ─────────
assert.equal(nextNaturalStage(at("GD_COMPLETE")), "PI_PENDING")
assert.equal(nextNaturalStage(at("GD_COMPLETE", { piRequired: false })), "DECISION", "GD-only cycle")
assert.equal(nextNaturalStage(at("GD_BYPASSED")), "PI_PENDING")
assert.equal(nextNaturalStage(at("GD_BYPASSED", { piRequired: false })), "DECISION")
assert.equal(nextNaturalStage(at("CLOSED")), null)

// Every stage is handled — no undefined fallthrough.
for (const stage of [
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
] as CandidateStageName[]) {
  const next = nextNaturalStage(at(stage))
  assert.ok(next !== undefined, `nextNaturalStage(${stage}) must be defined`)
}
for (const result of [
  "PENDING",
  "ON_HOLD",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
  "DISQUALIFIED",
] as CandidateResultName[]) {
  assert.ok(actionForResult(result), `actionForResult(${result}) must be defined`)
}

console.log("recruitment transition checks passed (candidate stage + result machines)")
