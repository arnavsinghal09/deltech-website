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
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  adminOnly?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

// Shared by the desktop sidebar and the mobile drawer.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Conference",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Overview" },
      { href: "/admin/registrations", icon: Users, label: "Registrations" },
      { href: "/admin/allotment", icon: Kanban, label: "Allotment" },
      { href: "/admin/import", icon: Upload, label: "Cross-dels" },
    ],
  },
  {
    label: "Recruitment",
    items: [{ href: "/admin/recruitment", icon: UserPlus, label: "Recruitment" }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blog", icon: FileText, label: "Blog" },
      { href: "/admin/quiz", icon: Presentation, label: "Quiz" },
      { href: "/admin/team", icon: Contact, label: "Team" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/logs", icon: ScrollText, label: "Logs" },
      { href: "/admin/config", icon: Settings2, label: "Settings" },
      { href: "/admin/users", icon: ShieldCheck, label: "Users", adminOnly: true },
    ],
  },
]

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname.startsWith(href)
}
