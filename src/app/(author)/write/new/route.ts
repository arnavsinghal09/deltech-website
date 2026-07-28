import { redirect } from "next/navigation"
import { requireAuthor } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await requireAuthor()

  const post = await prisma.post.create({
    data: {
      authorId:    session.user.id,
      title:       "",
      contentJson: { type: "doc", content: [{ type: "paragraph" }] },
      slug:        `draft-${Date.now()}-${session.user.id.slice(-6)}`,
      status:      "DRAFT",
    },
    select: { id: true },
  })

  redirect(`/write/${post.id}`)
}
