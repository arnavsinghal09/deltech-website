"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const COLORS = ["#0f766e", "#5eead4", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#22c55e"]

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

interface Particle {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
  rotate: number
}

export function ConfettiBurst({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!active) { setParticles([]); return }
    setParticles(
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: randomBetween(5, 95),
        color: COLORS[i % COLORS.length],
        delay: randomBetween(0, 1.2),
        duration: randomBetween(2, 4),
        size: randomBetween(8, 16),
        rotate: randomBetween(-180, 180),
      })),
    )
  }, [active])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: "110vh", opacity: [1, 1, 0], rotate: p.rotate * 4 }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
            style={{
              position: "fixed",
              top: 0,
              width: p.size,
              height: p.size * 0.4,
              borderRadius: 2,
              background: p.color,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
