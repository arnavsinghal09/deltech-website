"use client"

import { useRecruitmentLive } from "@/components/recruitment/use-recruitment-live"

// Mount-only subscriber: keeps a server-rendered page current without turning it
// into a client component. Drop it into any recruitment or monitor page.
export function LiveRefresh({ cycleId, pollMs }: { cycleId: string; pollMs?: number }) {
  useRecruitmentLive(cycleId, pollMs ? { pollMs } : undefined)
  return null
}
