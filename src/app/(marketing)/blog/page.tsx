import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { STRINGS } from "@/content/strings"

export const metadata: Metadata = {
  title: `Blog — ${STRINGS.brand.name}`,
  description: `Stories, insights, and updates from the ${STRINGS.brand.name} community.`,
}

function metaLine(post: {
  author: { name: string | null }
  publishedAt: Date | null
  readMin: number | null
}) {
  const parts = [
    post.author.name ?? "Anonymous",
    post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null,
    post.readMin ? `${post.readMin} min` : null,
  ].filter(Boolean)
  return parts.join(" · ")
}

function PlaceholderCover({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-secondary ${className ?? ""}`}>
      <span aria-hidden className="display text-4xl text-gold-500">
        ◆
      </span>
    </div>
  )
}

export default async function BlogIndexPage() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      slug: true,
      coverImage: true,
      readMin: true,
      tags: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
  })

  const [featured, ...rest] = posts

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-12">
        <p className="eyebrow">{STRINGS.brand.name}</p>
        <h1 className="display mt-3 text-4xl md:text-5xl">The Dispatch</h1>
        <p className="mt-3 text-muted-foreground">
          Stories and insights from the {STRINGS.brand.name} community
        </p>
        <div className="rule mt-8" />
      </div>

      {posts.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          No articles published yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-2">
          {/* Featured — most recent post */}
          <Link href={`/blog/${featured.slug}`} className="group grid gap-6 pb-10 md:grid-cols-5">
            {featured.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.coverImage}
                alt={featured.title}
                className="aspect-[3/2] w-full rounded-sm border border-foreground/15 object-cover md:col-span-2"
              />
            ) : (
              <PlaceholderCover className="aspect-[3/2] w-full rounded-sm border border-foreground/15 md:col-span-2" />
            )}
            <div className="flex flex-col justify-center md:col-span-3">
              <p className="eyebrow">Latest</p>
              <h2 className="display mt-3 text-3xl leading-tight transition-colors group-hover:text-primary">
                {featured.title}
              </h2>
              {featured.subtitle && (
                <p className="mt-3 line-clamp-3 leading-relaxed text-muted-foreground">
                  {featured.subtitle}
                </p>
              )}
              <p className="mt-4 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {metaLine(featured)}
              </p>
            </div>
          </Link>

          {/* The rest — hairline-divided editorial rows */}
          {rest.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex items-center gap-6 border-t border-border/70 py-7"
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-xl leading-snug transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                {post.subtitle && (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {post.subtitle}
                  </p>
                )}
                <p className="mt-2.5 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  {metaLine(post)}
                  {post.tags.length > 0 && <> · {post.tags.slice(0, 2).join(", ")}</>}
                </p>
              </div>
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImage}
                  alt=""
                  className="hidden size-24 shrink-0 rounded-sm border border-foreground/15 object-cover sm:block"
                />
              ) : (
                <PlaceholderCover className="hidden size-24 shrink-0 rounded-sm border border-foreground/15 sm:block" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
