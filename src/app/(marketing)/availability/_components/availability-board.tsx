"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { supabase } from "@/lib/supabase"

export interface CommitteeAvailability {
  id: string
  name: string
  type: "STANDARD" | "CRISIS" | "PRESS"
  doubleDelegation: boolean
  availableCount: number
}

interface Props {
  initial: CommitteeAvailability[]
}

const TYPE_LABEL: Record<string, string> = {
  STANDARD: "General Assembly",
  CRISIS: "Crisis",
  PRESS: "Press",
}

function CountBadge({ count }: { count: number }) {
  const color =
    count === 0
      ? "bg-destructive/10 text-destructive"
      : count <= 3
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-primary/10 text-primary"

  return (
    <div
      className={`flex h-12 w-16 flex-col items-center justify-center rounded-lg font-mono text-sm font-semibold ${color} overflow-hidden`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {count}
        </motion.span>
      </AnimatePresence>
      <span className="text-[10px] font-normal opacity-70">open</span>
    </div>
  )
}

export function AvailabilityBoard({ initial }: Props) {
  const [committees, setCommittees] = useState(initial)

  useEffect(() => {
    const channel = supabase
      .channel("portfolio-availability")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Portfolio" },
        (payload) => {
          const next = payload.new as { committeeId: string; status: string }
          const prev = payload.old as { committeeId: string; status: string }

          const wasAvailable = prev.status === "AVAILABLE"
          const isAvailable = next.status === "AVAILABLE"

          if (wasAvailable === isAvailable) return // no change to available count

          setCommittees((cs) =>
            cs.map((c) => {
              if (c.id !== next.committeeId) return c
              return {
                ...c,
                availableCount: c.availableCount + (isAvailable ? 1 : -1),
              }
            }),
          )
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {committees.map((committee) => (
        <motion.div
          key={committee.id}
          layout
          className="editorial-card flex items-center justify-between gap-4 px-5 py-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-lg text-card-foreground">{committee.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                {TYPE_LABEL[committee.type]}
                {committee.doubleDelegation && " · double del"}
              </span>
            </div>
          </div>
          <CountBadge count={Math.max(0, committee.availableCount)} />
        </motion.div>
      ))}
    </div>
  )
}
