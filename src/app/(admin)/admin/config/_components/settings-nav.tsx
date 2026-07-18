"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { href: "/admin/config/conference", label: "Conference" },
  { href: "/admin/config/committees", label: "Committees & Matrix" },
  { href: "/admin/config/money", label: "Money" },
  { href: "/admin/config/registration", label: "Registration" },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-48 lg:flex-col lg:gap-0">
      {SECTIONS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "whitespace-nowrap border-l-2 px-3 py-2 text-sm transition-colors",
            pathname.startsWith(href)
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
