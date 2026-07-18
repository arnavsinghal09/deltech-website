"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { href: "/admin/config", label: "Event control", exact: true },
  { href: "/admin/config/conference", label: "Public identity" },
  { href: "/admin/config/committees", label: "Committees & matrix" },
  { href: "/admin/config/money", label: "Fees & payments" },
  { href: "/admin/config/registration", label: "Closed-page copy" },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-48 lg:flex-col lg:gap-0">
      {SECTIONS.map(({ href, label, exact }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "whitespace-nowrap border-l-2 px-3 py-2 text-sm transition-colors",
            (exact ? pathname === href : pathname.startsWith(href))
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
