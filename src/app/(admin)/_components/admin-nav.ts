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
  BookOpenText,
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
    label: "Run event",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Overview" },
      { href: "/admin/config", icon: Settings2, label: "Event control" },
      { href: "/admin/registrations", icon: Users, label: "Registrations" },
      { href: "/admin/allotment", icon: Kanban, label: "Allotments" },
      { href: "/admin/config/committees", icon: Contact, label: "Matrix & committees" },
      { href: "/admin/import", icon: Upload, label: "Imports" },
    ],
  },
  {
    label: "Society",
    items: [
      { href: "/admin/recruitment", icon: UserPlus, label: "Recruitment" },
      { href: "/admin/blog", icon: FileText, label: "Dispatch" },
      { href: "/admin/quiz", icon: Presentation, label: "Quiz" },
      { href: "/admin/team", icon: Contact, label: "Team" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/guide", icon: BookOpenText, label: "Operator guide" },
      { href: "/admin/logs", icon: ScrollText, label: "Logs" },
      { href: "/admin/users", icon: ShieldCheck, label: "Users", adminOnly: true },
    ],
  },
]

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname.startsWith(href)
}
