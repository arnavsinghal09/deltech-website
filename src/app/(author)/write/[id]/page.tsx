import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WriteEditor } from "./_components/write-editor"

export default async function WritePostPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await auth()
  if (!session?.user?.id) redirect("/signin")

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id:          true,
      authorId:    true,
      title:       true,
      subtitle:    true,
      contentJson: true,
      tags:        true,
      coverImage:  true,
      status:      true,
      readMin:     true,
    },
  })

  if (!post || post.authorId !== session.user.id) notFound()

  return (
    <WriteEditor
      post={{
        id:          post.id,
        title:       post.title,
        subtitle:    post.subtitle,
        contentJson: post.contentJson as Record<string, unknown> | null,
        tags:        post.tags,
        coverImage:  post.coverImage,
        status:      post.status,
      }}
    />
  )
}
