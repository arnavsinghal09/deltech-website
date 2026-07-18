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
    <aside className="admin-rail hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar xl:flex">
      {/* Brand */}
      <div className="border-b border-sidebar-border px-6 py-6">
        <Link href="/admin" className="display block text-2xl text-sidebar-foreground">
          {t("brand.name")}
        </Link>
        <p className="data-label mt-2 text-muted-foreground">Secretariat console</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.adminOnly || isAdmin)
          if (items.length === 0) return null
          return (
            <div key={group.label} className="mb-6">
              <p className="data-label mb-2 px-3 text-muted-foreground">{group.label}</p>
              {items.map(({ href, icon: Icon, label }) => {
                const active = isNavActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex min-h-11 items-center gap-3 border border-transparent px-3 py-2.5 text-[0.9375rem] transition-colors",
                      active
                        ? "border-sidebar-border bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="size-[1.125rem] shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User card */}
      <div className="border-t border-sidebar-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm text-primary">
            {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.9375rem] font-medium text-sidebar-foreground">
              {user.name ?? user.email}
            </p>
            <Badge variant={isAdmin ? "default" : "outline"} className="mt-1 text-[0.6875rem]">
              {user.role}
            </Badge>
          </div>
          <SignOutButton compact />
        </div>
      </div>
    </aside>
  )
}
