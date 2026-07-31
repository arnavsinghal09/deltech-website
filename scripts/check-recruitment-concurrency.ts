// DB-backed race checks for recruitment:
//   RECRUITMENT_DB_CHECKS=1 npx tsx scripts/check-recruitment-concurrency.ts
//
// The pure decision logic is covered by check-recruitment-session.ts. This file
// proves the DATABASE actually refuses the races those decisions assume it will —
// the partial unique indexes, the candidate lock, and the audit trigger.
//
// Opt-in because it needs a real, writable Postgres. CI sets a dummy DATABASE_URL
// that never connects, so without the flag this exits 0 immediately and `npm run
// check` stays green.
import assert from "node:assert"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

if (process.env.RECRUITMENT_DB_CHECKS !== "1") {
  console.log("recruitment concurrency checks skipped (set RECRUITMENT_DB_CHECKS=1 to run)")
  process.exit(0)
}

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!url) {
  console.error("recruitment concurrency checks need DIRECT_URL or DATABASE_URL")
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

const SUFFIX = `cc_${Date.now()}`
const id = (name: string) => `${SUFFIX}_${name}`

function isUnique(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002"
}

async function expectRejected(label: string, run: () => Promise<unknown>): Promise<void> {
  try {
    await run()
    assert.fail(`${label}: expected the database to refuse this, but it succeeded`)
  } catch (err) {
    if (err instanceof assert.AssertionError) throw err
    assert.ok(isUnique(err) || err instanceof Error, `${label}: unexpected error shape`)
  }
}

async function main() {
  // ---- fixtures -----------------------------------------------------------
  await prisma.recruitmentCycle.create({
    data: {
      id: id("cycle"),
      name: "Concurrency check",
      slug: id("slug"),
      state: "IN_PROGRESS",
      createdById: "system",
    },
  })

  await prisma.recruitmentCandidate.createMany({
    data: [
      { id: id("cand1"), cycleId: id("cycle"), fullName: "Cand One", email: `one-${SUFFIX}@e.com` },
      { id: id("cand2"), cycleId: id("cycle"), fullName: "Cand Two", email: `two-${SUFFIX}@e.com` },
    ],
  })

  await prisma.recruitmentGroup.createMany({
    data: [
      { id: id("gA"), cycleId: id("cycle"), kind: "GD", title: "A", state: "READY", createdById: "u1" },
      { id: id("gB"), cycleId: id("cycle"), kind: "GD", title: "B", state: "READY", createdById: "u1" },
    ],
  })

  // ---- 1. a candidate cannot hold two live seats in the same round ---------
  await prisma.recruitmentGroupMember.create({
    data: { id: id("m1"), groupId: id("gA"), candidateId: id("cand1"), kind: "GD", addedById: "u1" },
  })
  await expectRejected("candidate in two GD groups", () =>
    prisma.recruitmentGroupMember.create({
      data: { id: id("m2"), groupId: id("gB"), candidateId: id("cand1"), kind: "GD", addedById: "u1" },
    }),
  )
  // Reassignment frees the slot without deleting the history.
  await prisma.recruitmentGroupMember.update({
    where: { id: id("m1") },
    data: { attendance: "REASSIGNED" },
  })
  await prisma.recruitmentGroupMember.create({
    data: { id: id("m2"), groupId: id("gB"), candidateId: id("cand1"), kind: "GD", addedById: "u1" },
  })
  assert.equal(
    await prisma.recruitmentGroupMember.count({ where: { candidateId: id("cand1") } }),
    2,
    "the reassigned seat must be retained as history",
  )

  // ---- 2. only one non-terminal session per group --------------------------
  await prisma.recruitmentSession.create({
    data: { id: id("s1"), cycleId: id("cycle"), groupId: id("gB"), kind: "GD", attempt: 1, state: "ACTIVE" },
  })
  await expectRejected("two live sessions on one group", () =>
    prisma.recruitmentSession.create({
      data: { id: id("s2"), cycleId: id("cycle"), groupId: id("gB"), kind: "GD", attempt: 2, state: "NOT_STARTED" },
    }),
  )
  // A reopen after completion is allowed — that is the repair path.
  await prisma.recruitmentSession.update({ where: { id: id("s1") }, data: { state: "COMPLETED" } })
  await prisma.recruitmentSession.create({
    data: { id: id("s2"), cycleId: id("cycle"), groupId: id("gB"), kind: "GD", attempt: 2, state: "NOT_STARTED" },
  })

  // ---- 3. a candidate cannot be live in two sessions ----------------------
  await prisma.recruitmentCandidateLock.create({
    data: { candidateId: id("cand1"), sessionId: id("s1"), cycleId: id("cycle") },
  })
  await expectRejected("candidate locked into two sessions", () =>
    prisma.recruitmentCandidateLock.create({
      data: { candidateId: id("cand1"), sessionId: id("s2"), cycleId: id("cycle") },
    }),
  )

  // Two concurrent starts, racing in parallel: exactly one may acquire the lock.
  const contended = id("cand2")
  const results = await Promise.allSettled([
    prisma.recruitmentCandidateLock.create({
      data: { candidateId: contended, sessionId: id("s1"), cycleId: id("cycle") },
    }),
    prisma.recruitmentCandidateLock.create({
      data: { candidateId: contended, sessionId: id("s2"), cycleId: id("cycle") },
    }),
  ])
  assert.equal(
    results.filter((r) => r.status === "fulfilled").length,
    1,
    "exactly one concurrent start may lock the candidate",
  )

  // ---- 4. duplicate open evaluations are refused --------------------------
  await prisma.recruitmentEvaluation.create({
    data: {
      id: id("e1"),
      cycleId: id("cycle"),
      candidateId: id("cand1"),
      kind: "GD",
      sessionId: id("s1"),
      evaluatorId: "eval1",
      evaluatorRole: "MAINTAINER",
      state: "SUBMITTED",
    },
  })
  await expectRejected("second open evaluation from the same evaluator", () =>
    prisma.recruitmentEvaluation.create({
      data: {
        id: id("e2"),
        cycleId: id("cycle"),
        candidateId: id("cand1"),
        kind: "GD",
        sessionId: id("s1"),
        evaluatorId: "eval1",
        evaluatorRole: "MAINTAINER",
        state: "SUBMITTED",
      },
    }),
  )
  // A different evaluator on the same candidate is fine — panels are independent.
  await prisma.recruitmentEvaluation.create({
    data: {
      id: id("e3"),
      cycleId: id("cycle"),
      candidateId: id("cand1"),
      kind: "GD",
      sessionId: id("s1"),
      evaluatorId: "eval2",
      evaluatorRole: "JC",
      state: "SUBMITTED",
    },
  })
  // Superseding frees the slot, which is how a revision lands.
  await prisma.recruitmentEvaluation.update({
    where: { id: id("e1") },
    data: { state: "SUPERSEDED" },
  })
  await prisma.recruitmentEvaluation.create({
    data: {
      id: id("e2"),
      cycleId: id("cycle"),
      candidateId: id("cand1"),
      kind: "GD",
      sessionId: id("s1"),
      evaluatorId: "eval1",
      evaluatorRole: "MAINTAINER",
      state: "SUBMITTED",
      version: 2,
      supersedesId: id("e1"),
    },
  })
  assert.equal(
    await prisma.recruitmentEvaluation.count({
      where: { candidateId: id("cand1"), evaluatorId: "eval1" },
    }),
    2,
    "the superseded version must be retained, not overwritten",
  )

  // ---- 5. idempotency keys collapse retried submissions -------------------
  await prisma.recruitmentEvaluation.create({
    data: {
      id: id("e4"),
      cycleId: id("cycle"),
      candidateId: id("cand2"),
      kind: "GD",
      evaluatorId: "eval1",
      evaluatorRole: "MAINTAINER",
      state: "SUBMITTED",
      idempotencyKey: id("key1"),
    },
  })
  await expectRejected("retried submit with the same idempotency key", () =>
    prisma.recruitmentEvaluation.create({
      data: {
        id: id("e5"),
        cycleId: id("cycle"),
        candidateId: id("cand2"),
        kind: "GD",
        evaluatorId: "eval1",
        evaluatorRole: "MAINTAINER",
        state: "SUBMITTED",
        idempotencyKey: id("key1"),
      },
    }),
  )

  // ---- 6. a candidate cannot be recruited twice ---------------------------
  const user = await prisma.user.create({
    data: { id: id("user"), email: `member-${SUFFIX}@e.com`, name: "Member", role: "AUTHOR" },
  })
  await prisma.recruitmentCandidate.update({
    where: { id: id("cand1") },
    data: { recruitedUserId: user.id, result: "SELECTED" },
  })
  await expectRejected("two candidates linked to one user", () =>
    prisma.recruitmentCandidate.update({
      where: { id: id("cand2") },
      data: { recruitedUserId: user.id },
    }),
  )

  // The conditional claim used by recruitCandidate: the second writer matches zero
  // rows rather than overwriting the first.
  const second = await prisma.recruitmentCandidate.updateMany({
    where: { id: id("cand1"), recruitedUserId: null },
    data: { recruitedById: "someone-else" },
  })
  assert.equal(second.count, 0, "a second recruit attempt must match zero rows")

  // ---- 7. one candidate per email per cycle -------------------------------
  await expectRejected("duplicate candidate email in one cycle", () =>
    prisma.recruitmentCandidate.create({
      data: { cycleId: id("cycle"), fullName: "Dup", email: `one-${SUFFIX}@e.com` },
    }),
  )

  // ---- 8. audit is append-only, even to the application role ---------------
  const event = await prisma.recruitmentAuditEvent.create({
    data: {
      id: id("audit"),
      cycleId: id("cycle"),
      eventType: "check.concurrency",
      actorEmail: "system",
      outcome: "SUCCESS",
    },
  })
  await expectRejected("updating an audit event", () =>
    prisma.recruitmentAuditEvent.update({ where: { id: event.id }, data: { reason: "tampered" } }),
  )
  await expectRejected("deleting an audit event", () =>
    prisma.recruitmentAuditEvent.delete({ where: { id: event.id } }),
  )

  console.log("recruitment concurrency checks passed (8 database-enforced races)")
}

// Always clean up, even on failure, so a failed run does not poison the next one.
async function cleanup() {
  // The audit trigger blocks DELETE, so drop it for the duration of the teardown
  // rather than leaving check rows behind forever.
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "RecruitmentAuditEvent" DISABLE TRIGGER "RecruitmentAuditEvent_append_only"',
  )
  try {
    await prisma.recruitmentAuditEvent.deleteMany({ where: { cycleId: id("cycle") } })
    await prisma.recruitmentCandidate.updateMany({
      where: { cycleId: id("cycle") },
      data: { recruitedUserId: null },
    })
    await prisma.user.deleteMany({ where: { id: id("user") } })
    // Cascades clear candidates, groups, sessions, locks and evaluations.
    await prisma.recruitmentCycle.deleteMany({ where: { id: id("cycle") } })
  } finally {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "RecruitmentAuditEvent" ENABLE TRIGGER "RecruitmentAuditEvent_append_only"',
    )
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await cleanup().catch((err) => console.error("[cleanup]", err))
    await prisma.$disconnect()
  })
