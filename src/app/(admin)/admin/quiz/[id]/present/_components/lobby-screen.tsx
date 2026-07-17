"use client"

import { QRCodeSVG } from "qrcode.react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { t } from "@/content/strings"
import type { PresenceEntry, PresentationTheme } from "@/lib/quiz-types"

interface Props {
  roomCode: string
  joinUrl: string
  participants: PresenceEntry[]
  theme: PresentationTheme
  onStart: () => void
}

export function LobbyScreen({ roomCode, joinUrl, participants, theme, onStart }: Props) {
  const reduce = useReducedMotion()
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-8 px-8 py-12"
      style={{ background: theme.background, color: theme.textColor, fontFamily: theme.font }}
    >
      {/* Top: join instructions */}
      <p className="text-center text-lg opacity-70">
        {t("quiz.joinInstructions", { url: new URL(joinUrl).host })}
      </p>

      <div className="flex items-center gap-16">
        {/* QR code */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-lg">
            <QRCodeSVG value={joinUrl} size={180} />
          </div>
          <p className="text-sm opacity-60">{joinUrl}</p>
        </div>

        {/* Room code */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm opacity-60 uppercase tracking-widest">Room code</p>
          <motion.p
            initial={reduce ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="text-7xl font-bold tracking-[0.15em] tabular-nums"
            style={{ color: theme.accentColor }}
          >
            {roomCode}
          </motion.p>
        </div>
      </div>

      {/* Participants count + avatar grid */}
      <div className="w-full max-w-2xl text-center">
        <p className="mb-3 text-sm opacity-60">
          {t("quiz.connected", { count: participants.length })}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <AnimatePresence>
            {participants.map((p) => (
              <motion.div
                key={p.userId}
                layout
                initial={reduce ? false : { scale: 0.3, y: 16, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={reduce ? undefined : { scale: 0.3, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="flex flex-col items-center gap-1"
              >
                <motion.span
                  className="text-3xl"
                  initial={reduce ? false : { rotate: -12 }}
                  animate={{ rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10, delay: 0.1 }}
                >
                  {p.avatar || "👤"}
                </motion.span>
                <span className="max-w-20 truncate text-xs opacity-70">{p.nickname}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        className="mt-4 rounded-xl px-10 py-3 text-lg font-semibold transition-opacity hover:opacity-90"
        style={{ background: theme.accentColor, color: "#fff" }}
        disabled={participants.length === 0}
      >
        {t("quiz.nextSlide")} →
      </button>
    </div>
  )
}
