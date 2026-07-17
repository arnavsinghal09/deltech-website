"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Kanban,
  Upload,
  UserPlus,
  FileText,
  Presentation,
  Settings2,
  Contact,
  ScrollText,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/content/strings"

const NAV = [
  { href: "/admin",                icon: LayoutDashboard, label: t("admin.nav.overview")      },
  { href: "/admin/registrations",  icon: Users,           label: t("admin.nav.registrations") },
  { href: "/admin/allotment",      icon: Kanban,          label: t("admin.nav.allotment")     },
  { href: "/admin/import",         icon: Upload,          label: "Cross-dels"                 },
  { href: "/admin/recruitment",    icon: UserPlus,        label: "Recruitment"                },
  { href: "/admin/blog",           icon: FileText,        label: t("admin.nav.blog")          },
  { href: "/admin/quiz",           icon: Presentation,    label: t("admin.nav.quiz")          },
  { href: "/admin/team",           icon: Contact,         label: "Team"                       },
  { href: "/admin/logs",           icon: ScrollText,      label: "Logs"                       },
  { href: "/admin/config",         icon: Settings2,       label: t("admin.nav.config")        },
] as const

const ADMIN_ONLY_NAV = [
  { href: "/admin/users", icon: ShieldCheck, label: "Users" },
] as const

export function AdminSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const items = isAdmin ? [...NAV, ...ADMIN_ONLY_NAV] : [...NAV]

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <span className="text-sm font-semibold text-sidebar-primary">{t("brand.name")}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {items.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/admin" ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
