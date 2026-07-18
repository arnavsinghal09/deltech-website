"use client"

import { usePathname } from "next/navigation"

const LABELS: Record<string, string> = {
  registrations: "Registrations",
  allotment: "Allotment",
  import: "Cross-dels",
  recruitment: "Recruitment",
  blog: "Blog",
  quiz: "Quiz",
  team: "Team",
  logs: "Logs",
  config: "Settings",
  users: "Users",
  conference: "Conference",
  committees: "Committees & Matrix",
  money: "Money",
  registration: "Registration",
  slots: "Slots",
}

export function AdminBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean).slice(1) // drop "admin"
  const crumbs = ["Admin", ...segments.map((s) => LABELS[s] ?? null).filter((s): s is string => !!s)]

  return (
    <p className="truncate text-sm text-muted-foreground">
      {crumbs.map((c, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1.5 text-border">/</span>}
          <span className={i === crumbs.length - 1 ? "text-foreground" : undefined}>{c}</span>
        </span>
      ))}
    </p>
  )
}
