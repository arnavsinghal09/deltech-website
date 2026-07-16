import type { Metadata } from "next"
import Link from "next/link"
import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { STRINGS } from "@/content/strings"

export const metadata: Metadata = {
  title: `Blog — ${STRINGS.brand.name}`,
  description: `Stories, insights, and updates from the ${STRINGS.brand.name} community.`,
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-bold text-foreground">Blog</h1>
        <p className="mt-2 text-muted-foreground">Stories and insights from the {STRINGS.brand.name} community</p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border bg-card py-20 text-center text-muted-foreground">
          No articles published yet. Check back soon.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Cover */}
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-44 w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-44 w-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
                  <span className="font-serif text-3xl text-teal-300">DM</span>
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-serif text-lg font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>

                {post.subtitle && (
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.subtitle}
                  </p>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{post.author.name ?? "Anonymous"}</span>
                    {post.publishedAt && (
                      <> · {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
                    )}
                  </div>
                  {post.readMin && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="size-3" />
                      {post.readMin} min
                    </span>
                  )}
                </div>

                {post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
