import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authz"
import { UsersTable } from "./_components/users-table"
import { InviteDialog } from "./_components/invite-dialog"
import { PageHeader } from "@/app/(admin)/_components/page-header"

export default async function UsersPage() {
  const session = await requireAdmin()

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: { id: true, email: true, name: true, role: true, disabledAt: true },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="System"
        title="Users & roles"
        description="Only admins can invite, change roles, disable or delete. Changes take effect on live sessions within a minute. Disabling revokes access but keeps the account and anything it wrote; deleting is only possible for accounts that own nothing."
      >
        <InviteDialog />
      </PageHeader>
      <UsersTable users={users} selfEmail={session.user?.email ?? ""} />
    </div>
  )
}
