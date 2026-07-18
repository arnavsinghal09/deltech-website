"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

const KEY = "admin.maintainerIntroSeen"

// One-time orientation card for maintainers explaining their powers and limits.
export function MaintainerWelcome() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(localStorage.getItem(KEY) !== "1")
  }, [])

  if (!show) return null

  return (
    <div className="editorial-card border-l-2 border-l-primary p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[10px]">Welcome, maintainer</p>
          <h2 className="mt-1 font-heading text-lg">What you can do here</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            You can manage registrations, allotments, cross-del imports, recruitment,
            content, committees, and portfolios. A few things are reserved for admins:
            deleting records, changing payment settings, revoking allotments, comping,
            and changing roles. Everything you do is recorded in the activity log.
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(KEY, "1")
            setShow(false)
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
