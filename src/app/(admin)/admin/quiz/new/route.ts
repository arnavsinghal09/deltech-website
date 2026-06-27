import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(): Promise<never> {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/signin")
  }

  const presentation = await prisma.presentation.create({
    data: {
      ownerId: session.user!.id!,
      title: "Untitled presentation",
      mode: "POLL",
    },
  })

  redirect(`/admin/quiz/${presentation.id}`)
}
