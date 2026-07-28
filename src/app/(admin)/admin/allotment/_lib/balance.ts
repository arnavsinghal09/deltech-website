// Pure helpers for the balance-aware allotment assist. No DB, no React —
// so they stay testable via scripts/check-allot-assist.ts.

export interface PrefDelegate {
  pref1CommitteeId: string | null
  pref2CommitteeId: string | null
  pref3CommitteeId: string | null
}

export interface CommitteeDemand {
  p1: number
  p2: number
  p3: number
}

// How many delegates in the (unallotted) pool name each committee as their
// 1st / 2nd / 3rd preference. This is the signal staff balance against —
// e.g. a committee with 40 pref-1s and 6 seats is over-subscribed, so pushing
// some of those delegates to a thinner 2nd preference is the deliberate call.
export function committeeDemand(delegates: PrefDelegate[]): Map<string, CommitteeDemand> {
  const m = new Map<string, CommitteeDemand>()
  const bump = (id: string | null, key: keyof CommitteeDemand) => {
    if (!id) return
    const d = m.get(id) ?? { p1: 0, p2: 0, p3: 0 }
    d[key] += 1
    m.set(id, d)
  }
  for (const d of delegates) {
    bump(d.pref1CommitteeId, "p1")
    bump(d.pref2CommitteeId, "p2")
    bump(d.pref3CommitteeId, "p3")
  }
  return m
}

// Rank of a committee in a single delegate's preference list (1/2/3) or null.
// pref1 wins if the same committee appears more than once.
export function preferenceRank(d: PrefDelegate, committeeId: string): 1 | 2 | 3 | null {
  if (d.pref1CommitteeId === committeeId) return 1
  if (d.pref2CommitteeId === committeeId) return 2
  if (d.pref3CommitteeId === committeeId) return 3
  return null
}
