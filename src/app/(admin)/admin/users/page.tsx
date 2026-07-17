import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"
import { UsersTable } from "./_components/users-table"

export default async function UsersPage() {
  const session = await requireAdmin()

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: { id: true, email: true, name: true, role: true },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users & roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maintainers can do everything in this panel except deletions, payment
          config, revokes, and role changes. Role changes apply on the user&apos;s
          next sign-in.
        </p>
      </div>
      <UsersTable users={users} selfEmail={session.user?.email ?? ""} />
    </div>
  )
}
