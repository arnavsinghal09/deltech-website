import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"
import { UsersTable } from "./_components/users-table"
import { InviteDialog } from "./_components/invite-dialog"
import { PageHeader } from "@/app/(admin)/_components/page-header"

export default async function UsersPage() {
  const session = await requireAdmin()

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: { id: true, email: true, name: true, role: true },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="System"
        title="Users & roles"
        description="Maintainers can do everything here except deletions, payment config, revokes, and role changes. Role changes apply on the user's next sign-in."
      >
        <InviteDialog />
      </PageHeader>
      <UsersTable users={users} selfEmail={session.user?.email ?? ""} />
    </div>
  )
}
