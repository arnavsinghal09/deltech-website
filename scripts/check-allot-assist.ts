// Runnable check for the allotment balance helpers: npx tsx scripts/check-allot-assist.ts
import assert from "node:assert"
import { committeeDemand, preferenceRank } from "../src/app/(admin)/admin/allotment/_lib/balance"

const D = (p1: string | null, p2: string | null = null, p3: string | null = null) => ({
  pref1CommitteeId: p1,
  pref2CommitteeId: p2,
  pref3CommitteeId: p3,
})

// ── committeeDemand ──────────────────────────────────────────────────────────
const demand = committeeDemand([
  D("A", "B", "C"),
  D("A", "C"),
  D("B", "A"),
  D(null, null, null), // no prefs → contributes nothing
])
assert.deepEqual(demand.get("A"), { p1: 2, p2: 1, p3: 0 }) // pref1 x2 (rows 1,2), pref2 x1 (row 3)
assert.deepEqual(demand.get("B"), { p1: 1, p2: 1, p3: 0 }) // pref1 (row 3), pref2 (row 1)
assert.deepEqual(demand.get("C"), { p1: 0, p2: 1, p3: 1 }) // pref2 (row 2), pref3 (row 1)
assert.equal(demand.get("Z"), undefined) // committee nobody wants
assert.equal(demand.size, 3)

// empty pool → empty map
assert.equal(committeeDemand([]).size, 0)

// ── preferenceRank ───────────────────────────────────────────────────────────
assert.equal(preferenceRank(D("A", "B", "C"), "A"), 1)
assert.equal(preferenceRank(D("A", "B", "C"), "B"), 2)
assert.equal(preferenceRank(D("A", "B", "C"), "C"), 3)
assert.equal(preferenceRank(D("A", "B", "C"), "Z"), null)
// same committee listed twice → highest (earliest) rank wins
assert.equal(preferenceRank(D("A", "A"), "A"), 1)
assert.equal(preferenceRank(D(null, null, null), "A"), null)

console.log("allot-assist checks passed")
