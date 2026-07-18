"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Circle, X } from "lucide-react"

export interface ChecklistItem {
  done: boolean
  label: string
  href: string
}

const KEY = "admin.checklist.dismissed"

// First-run setup guide, computed from live data on the server. Hides itself
// once everything's done, or when dismissed (persisted in localStorage).
export function SetupChecklist({ items }: { items: ChecklistItem[] }) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(localStorage.getItem(KEY) === "1")
  }, [])

  const allDone = items.every((i) => i.done)
  if (dismissed || allDone) return null

  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="editorial-card border-l-2 border-l-gold-500 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[10px]">Getting started</p>
          <h2 className="mt-1 font-heading text-lg">
            Finish setting up your conference
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {doneCount} of {items.length} done
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(KEY, "1")
            setDismissed(true)
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>

      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50"
            >
              {item.done ? (
                <Check className="size-4 text-primary" />
              ) : (
                <Circle className="size-4 text-muted-foreground/50" />
              )}
              <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
