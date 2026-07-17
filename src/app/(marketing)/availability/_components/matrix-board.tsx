"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { supabase } from "@/lib/supabase"

export type PortfolioState = "available" | "allotted" | "paid" | "blocked"

export interface MatrixCommittee {
  id: string
  name: string
  agenda: string | null
  type: "STANDARD" | "CRISIS" | "PRESS"
  doubleDelegation: boolean
  portfolios: { id: string; name: string; state: PortfolioState }[]
}

const TYPE_LABEL: Record<string, string> = {
  STANDARD: "General Assembly",
  CRISIS: "Crisis",
  PRESS: "Press",
}

const STATE_STYLE: Record<PortfolioState, string> = {
  available:
    "border-border/70 bg-card text-foreground hover:border-primary/50 hover:shadow-sm",
  allotted:
    "border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200",
  paid:
    "border-green-300/70 bg-green-50 text-green-900 dark:border-green-800/60 dark:bg-green-950/40 dark:text-green-200",
  blocked:
    "border-border/40 bg-muted/60 text-muted-foreground/60 line-through",
}

const LEGEND: { state: PortfolioState; label: string; dot: string }[] = [
  { state: "available", label: "Available", dot: "bg-card border border-border" },
  { state: "allotted", label: "Allotted — payment pending", dot: "bg-amber-400" },
  { state: "paid", label: "Confirmed (paid)", dot: "bg-green-500" },
]

export function MatrixBoard({ committees }: { committees: MatrixCommittee[] }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Any Portfolio or Delegate change (allot / revoke / pay) → debounced refresh.
  // Server recomputes states; simpler and safer than client-side cell math.
  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(() => router.refresh(), 800)
    }

    const channel = supabase
      .channel("portfolio-matrix")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Portfolio" }, scheduleRefresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Delegate" }, scheduleRefresh)
      .subscribe()

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      void supabase.removeChannel(channel)
    }
  }, [router])

  return (
    <div className="space-y-10">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {LEGEND.map((l) => (
          <span key={l.state} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`size-2.5 rounded-full ${l.dot}`} />
            {l.label}
          </span>
        ))}
      </div>

      {committees.map((committee, ci) => {
        const openCount = committee.portfolios.filter((p) => p.state === "available").length
        return (
          <motion.section
            key={committee.id}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: Math.min(ci * 0.05, 0.3), ease: "easeOut" }}
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{committee.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABEL[committee.type]}
                  {committee.doubleDelegation && " · double delegation"}
                  {committee.agenda && <> · {committee.agenda}</>}
                </p>
              </div>
              <span
                className={`text-xs font-medium ${openCount === 0 ? "text-destructive" : "text-primary"}`}
              >
                {openCount === 0 ? "Full" : `${openCount} open`}
              </span>
            </div>

            {committee.portfolios.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                Portfolio matrix coming soon.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {committee.portfolios.map((p) => (
                  <div
                    key={p.id}
                    title={
                      p.state === "allotted"
                        ? "Allotted — payment pending"
                        : p.state === "paid"
                          ? "Confirmed"
                          : p.state === "blocked"
                            ? "Not open"
                            : "Available"
                    }
                    className={`truncate rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${STATE_STYLE[p.state]}`}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )
      })}
    </div>
  )
}
