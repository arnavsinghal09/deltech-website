import Link from "next/link"
import { Plus, Presentation, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { t } from "@/content/strings"
import { PageHeader } from "@/app/(admin)/_components/page-header"

export default async function AdminQuizPage() {
  const presentations = await prisma.presentation.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      mode: true,
      createdAt: true,
      _count: { select: { slides: true } },
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Content" title={t("admin.nav.quiz")} description="Build interactive polls and quizzes">
        <Link
          href="/admin/quiz/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          {t("quiz.builder.newPresentation")}
        </Link>
      </PageHeader>

      {presentations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-20 text-center">
          <Presentation className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No presentations yet.</p>
          <Link
            href="/admin/quiz/new"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <Plus className="size-3.5" />
            Create one
          </Link>
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {presentations.map((p) => (
            <Link
              key={p.id}
              href={`/admin/quiz/${p.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Presentation className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{p.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  <span>·</span>
                  <span>{p._count.slides} {p._count.slides === 1 ? "slide" : "slides"}</span>
                </div>
              </div>

              <Badge variant={p.mode === "QUIZ" ? "default" : "secondary"} className="shrink-0 text-xs">
                {t(`quiz.modes.${p.mode}`)}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
