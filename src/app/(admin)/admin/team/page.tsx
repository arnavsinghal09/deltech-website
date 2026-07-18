import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { TeamManager } from "./_components/team-manager"
import { PageHeader } from "@/app/(admin)/_components/page-header"

export default async function AdminTeamPage() {
  const session = await requireStaff()
  const isAdmin = (session.user as { role?: string }).role === "ADMIN"

  const members = await prisma.member.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] })

  const serialized = members.map((m) => ({
    id: m.id,
    name: m.name,
    designation: m.designation,
    order: m.order,
    imageUrl: m.imageUrl,
    socials: (m.socials as { instagram?: string; linkedin?: string } | null) ?? {},
    isActive: m.isActive,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Team"
        description="Society members shown on the public /team page. Order controls display position."
      />
      <TeamManager members={serialized} isAdmin={isAdmin} />
    </div>
  )
}
