import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Clock, ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { TiptapContent } from "@/lib/tiptap-renderer"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, subtitle: true, coverImage: true },
  })
  if (!post) return { title: "Not Found" }
  return {
    title: `${post.title} — DelTech MUN Blog`,
    description: post.subtitle ?? undefined,
    openGraph: post.coverImage ? { images: [{ url: post.coverImage }] } : undefined,
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params

  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      subtitle: true,
      coverImage: true,
      contentJson: true,
      readMin: true,
      tags: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
  })

  if (!post) notFound()

  return (
    <div className="min-h-screen bg-white">
      {/* Back link */}
      <div className="mx-auto max-w-[680px] px-6 pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          All articles
        </Link>
      </div>

      {/* Cover image (full-bleed within max-width) */}
      {post.coverImage && (
        <div className="mx-auto mt-8 max-w-[780px] px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-[420px] w-full rounded-xl object-cover"
          />
        </div>
      )}

      {/* Article */}
      <article className="mx-auto max-w-[680px] px-6 pb-24">
        <div className={post.coverImage ? "pt-10" : "pt-12"}>
          {/* Title */}
          <h1 className="font-serif text-[2.25rem] font-bold leading-tight text-gray-900">
            {post.title}
          </h1>

          {/* Subtitle */}
          {post.subtitle && (
            <p className="mt-4 font-serif text-xl leading-relaxed text-gray-500">
              {post.subtitle}
            </p>
          )}

          {/* Byline */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{post.author.name ?? "Anonymous"}</span>

            {post.publishedAt && (
              <>
                <span className="text-gray-300">·</span>
                <time dateTime={post.publishedAt.toISOString()}>
                  {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </>
            )}

            {post.readMin && (
              <>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {post.readMin} min read
                </span>
              </>
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="my-8 border-t border-gray-100" />

          {/* Content */}
          <TiptapContent json={post.contentJson} className="blog-prose" />
        </div>
      </article>
    </div>
  )
}
