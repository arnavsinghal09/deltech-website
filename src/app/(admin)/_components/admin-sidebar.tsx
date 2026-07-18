"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { t } from "@/content/strings"
import { Badge } from "@/components/ui/badge"
import { SignOutButton } from "./sign-out-button"
import { NAV_GROUPS, isNavActive } from "./admin-nav"

export interface SidebarUser {
  name: string | null
  email: string | null
  role: string
}

export function AdminSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname()
  const isAdmin = user.role === "ADMIN"

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      {/* Brand */}
      <div className="border-b border-sidebar-border px-5 py-5">
        <Link href="/admin" className="display block text-lg text-sidebar-foreground">
          {t("brand.name")}
        </Link>
        <p className="eyebrow mt-1 text-[10px]">Secretariat</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.adminOnly || isAdmin)
          if (items.length === 0) return null
          return (
            <div key={group.label} className="mb-5">
              <p className="eyebrow mb-1.5 px-3 text-[10px]">{group.label}</p>
              {items.map(({ href, icon: Icon, label }) => {
                const active = isNavActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 border-l-2 px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-primary font-medium text-sidebar-foreground"
                        : "border-transparent text-sidebar-foreground/65 hover:border-sidebar-border hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User card */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm text-primary">
            {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user.name ?? user.email}
            </p>
            <Badge variant={isAdmin ? "default" : "outline"} className="mt-0.5 text-[10px]">
              {user.role}
            </Badge>
          </div>
          <SignOutButton compact />
        </div>
      </div>
    </aside>
  )
}
