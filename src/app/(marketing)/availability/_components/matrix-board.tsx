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
    "border-foreground/20 bg-card text-foreground hover:border-primary",
  allotted:
    "border-gold-500/40 bg-accent text-accent-foreground",
  paid:
    "border-primary/40 bg-primary/10 text-primary",
  blocked:
    "border-border/40 bg-muted/60 text-muted-foreground/60 line-through",
}

const LEGEND: { state: PortfolioState; label: string; square: string }[] = [
  { state: "available", label: "Available", square: "bg-card border border-foreground/25" },
  { state: "allotted", label: "Allotted — payment pending", square: "bg-accent border border-gold-500/50" },
  { state: "paid", label: "Confirmed (paid)", square: "bg-primary/15 border border-primary/50" },
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
      <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
        {LEGEND.map((l) => (
          <span
            key={l.state}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-muted-foreground"
          >
            <span className={`size-3 rounded-[2px] ${l.square}`} />
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
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-border/70 pb-3">
              <div>
                <h2 className="font-heading text-2xl">{committee.name}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  {TYPE_LABEL[committee.type]}
                  {committee.doubleDelegation && " · double delegation"}
                  {committee.agenda && <> · {committee.agenda}</>}
                </p>
              </div>
              <span
                className={`font-mono text-sm tabular-nums ${openCount === 0 ? "text-destructive" : "text-primary"}`}
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
