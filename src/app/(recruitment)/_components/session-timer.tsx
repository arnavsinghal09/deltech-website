"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  clockSkewMs,
  elapsedMs,
  formatElapsed,
  skewCorrectedNow,
  type SessionSnapshot,
  type SessionStateName,
} from "@/lib/recruitment/session"

export interface TimerSession {
  state: SessionStateName
  startedAt: string | null
  pausedAt: string | null
  endedAt: string | null
  pausedMs: number
  lastActivityAt: string | null
  plannedSeconds: number | null
  // Server's clock at the moment this payload was produced.
  serverNow: string
}

// A ticking display over an authoritative server timestamp.
//
// The browser owns NOTHING but the animation frame. Elapsed time is always
// recomputed from the server's `startedAt` / `pausedMs`, with the device's clock
// offset measured once and subtracted, so a wrong or deliberately-changed local
// clock cannot alter the number, and a refresh, a new tab or a different device all
// render the same value.
export function SessionTimer({
  session,
  className,
}: {
  session: TimerSession
  className?: string
}) {
  // Measured once per payload, not per tick, so a slow render cannot drift.
  const skew = useMemo(
    () => clockSkewMs(new Date(session.serverNow), new Date()),
    [session.serverNow],
  )

  const snapshot = useMemo<SessionSnapshot>(
    () => ({
      id: "timer",
      state: session.state,
      version: 0,
      controllerId: null,
      controlExpiresAt: null,
      startedAt: session.startedAt ? new Date(session.startedAt) : null,
      pausedAt: session.pausedAt ? new Date(session.pausedAt) : null,
      endedAt: session.endedAt ? new Date(session.endedAt) : null,
      pausedMs: session.pausedMs,
      lastActivityAt: session.lastActivityAt ? new Date(session.lastActivityAt) : null,
    }),
    [session],
  )

  const compute = () => elapsedMs(snapshot, skewCorrectedNow(new Date(), skew))
  const [elapsed, setElapsed] = useState(compute)
  const frame = useRef<number | null>(null)

  const ticking = session.state === "ACTIVE"

  useEffect(() => {
    // Recompute immediately whenever the server payload changes, so a pause or
    // finish lands on screen without waiting for the next tick.
    setElapsed(compute)
    if (!ticking) return

    let last = 0
    const loop = (now: number) => {
      // Repaint about twice a second: enough for a seconds display, cheap enough
      // to leave running for a whole GD.
      if (now - last > 500) {
        setElapsed(compute)
        last = now
      }
      frame.current = requestAnimationFrame(loop)
    }
    frame.current = requestAnimationFrame(loop)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, skew, ticking])

  const planned = session.plannedSeconds ? session.plannedSeconds * 1000 : null
  const over = planned !== null && elapsed > planned

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        session.state === "PAUSED" && "text-muted-foreground",
        over && "text-[var(--signal)]",
        className,
      )}
      // The DOM text is corrected by this component after hydration; the server
      // renders its own value from the same numbers, so they agree.
      suppressHydrationWarning
    >
      {formatElapsed(elapsed)}
    </span>
  )
}
