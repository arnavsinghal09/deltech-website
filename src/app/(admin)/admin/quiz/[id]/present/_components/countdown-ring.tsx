"use client"

import { useEffect, useState, useRef } from "react"

interface Props {
  durationSeconds: number
  running: boolean
  accentColor: string
  onExpire?: () => void
}

export function CountdownRing({ durationSeconds, running, accentColor, onExpire }: Props) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const expiredRef = useRef(false)

  useEffect(() => {
    setRemaining(durationSeconds)
    expiredRef.current = false
    startRef.current = null
    if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
  }, [durationSeconds])

  useEffect(() => {
    if (!running) {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
      return
    }

    function tick(now: number) {
      if (startRef.current === null) startRef.current = now
      const elapsed = (now - startRef.current) / 1000
      const left = Math.max(0, durationSeconds - elapsed)
      setRemaining(left)
      if (left === 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpire?.()
        return
      }
      if (left > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [running, durationSeconds, onExpire])

  const pct = durationSeconds > 0 ? remaining / durationSeconds : 0
  const r = 44
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - pct)
  const secs = Math.ceil(remaining)

  return (
    <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
      <svg width={112} height={112} className="-rotate-90">
        <circle cx={56} cy={56} r={r} strokeWidth={8} stroke="rgba(255,255,255,0.15)" fill="none" />
        <circle
          cx={56}
          cy={56}
          r={r}
          strokeWidth={8}
          stroke={accentColor}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <span
        className="absolute text-2xl font-bold tabular-nums"
        style={{ color: accentColor }}
      >
        {secs}
      </span>
    </div>
  )
}
