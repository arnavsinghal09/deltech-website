import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { t } from "@/content/strings"
import { AdminSidebar } from "./_components/admin-sidebar"
import { SignOutButton } from "./_components/sign-out-button"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/signin")
  }

  return (
    <div className="flex min-h-svh">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background px-4 sm:px-6">
          <span className="text-sm font-medium text-muted-foreground">
            {t("brand.name")} <span className="text-border">—</span> Admin
          </span>
          <div className="flex items-center gap-3">
            {session.user.email && (
              <span className="hidden text-xs text-muted-foreground sm:block">
                {session.user.email}
              </span>
            )}
            <SignOutButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  )
}
