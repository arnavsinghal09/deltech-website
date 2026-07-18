import { requireStaff } from "@/lib/authz"
import { AdminSidebar, type SidebarUser } from "./_components/admin-sidebar"
import { AdminMobileNav } from "./_components/admin-mobile-nav"
import { AdminBreadcrumb } from "./_components/admin-breadcrumb"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff()
  const user: SidebarUser = {
    name: session.user?.name ?? null,
    email: session.user?.email ?? null,
    role: (session.user as { role?: string }).role ?? "MAINTAINER",
  }
  const isPreview = !!process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production"

  return (
    <div className="admin-shell flex min-h-svh">
      <AdminSidebar user={user} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <AdminMobileNav user={user} />
            <AdminBreadcrumb />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {isPreview && (
              <span className="rounded-sm border border-gold-500/50 bg-accent px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-accent-foreground">
                Preview
              </span>
            )}
            {user.email && (
              <span className="hidden text-sm text-muted-foreground sm:block">{user.email}</span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background p-5 sm:p-7 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
