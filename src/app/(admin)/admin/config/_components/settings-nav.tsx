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
    <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:gap-1">
      {SECTIONS.map(({ href, label, exact }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "whitespace-nowrap border-l-4 px-4 py-3 text-base transition-colors",
            (exact ? pathname === href : pathname.startsWith(href))
              ? "border-primary bg-primary/5 font-semibold text-foreground"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
