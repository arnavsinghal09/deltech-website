import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"

export async function GET(): Promise<never> {
  const session = await requireStaff()

  const presentation = await prisma.presentation.create({
    data: {
      ownerId: session.user!.id!,
      title: "Untitled presentation",
      mode: "POLL",
    },
  })

  redirect(`/admin/quiz/${presentation.id}`)
}
