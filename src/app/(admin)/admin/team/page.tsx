import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { TeamManager } from "./_components/team-manager"

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Society members shown on the public /team page. Order controls display position.
        </p>
      </div>
      <TeamManager members={serialized} isAdmin={isAdmin} />
    </div>
  )
}
