import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/app/(admin)/_components/page-header"

const PAGE_SIZE = 100

export default async function LogsPage(props: {
  searchParams: Promise<{ actor?: string; entity?: string; action?: string; page?: string }>
}) {
  await requireStaff()
  const { actor, entity, action, page } = await props.searchParams

  // Was a hard take: 100 with no way to reach anything older. On a busy
  // allotment day that is a few hours of trail, and the audit log is the only
  // record of who changed what.
  const pageNum = Math.max(1, Number.parseInt(page ?? "1", 10) || 1)

  const where = {
    ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" as const } } : {}),
    ...(entity ? { entity: { equals: entity, mode: "insensitive" as const } } : {}),
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { at: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const qs = (p: number) => {
    const sp = new URLSearchParams()
    if (actor) sp.set("actor", actor)
    if (entity) sp.set("entity", entity)
    if (action) sp.set("action", action)
    if (p > 1) sp.set("page", String(p))
    const q = sp.toString()
    return q ? `/admin/logs?${q}` : "/admin/logs"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Activity log"
        description="Every change, approval, and send by admins and maintainers."
      />

      {/* GET-form filters — no client state needed */}
      <form className="flex flex-wrap gap-2" method="get">
        {/* Re-filtering must start from the first page, not keep an out-of-range one. */}
        <input
          name="actor"
          defaultValue={actor ?? ""}
          placeholder="Filter by actor email…"
          className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm"
        />
        <input
          name="action"
          defaultValue={action ?? ""}
          placeholder="Action (e.g. delegate.cancel)…"
          className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm"
        />
        <input
          name="entity"
          defaultValue={entity ?? ""}
          placeholder="Entity (Delegate, Post…)"
          className="h-9 w-44 rounded-md border border-input bg-background px-3 text-sm"
        />
        <button
          type="submit"
          className="h-9 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Filter
        </button>
      </form>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          No log entries match.
        </div>
      ) : (
        <div className="editorial-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {log.at.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="max-w-44 truncate px-4 py-2.5 text-xs">{log.actorEmail}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={
                        /delete|cancel|revoke|reject/.test(log.action) ? "destructive" : "secondary"
                      }
                      className="font-mono text-xs"
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {log.entity}
                    {log.entityId && <span className="opacity-60"> · {log.entityId.slice(0, 8)}</span>}
                  </td>
                  <td className="max-w-64 truncate px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {log.meta ? JSON.stringify(log.meta) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {(pageNum - 1) * PAGE_SIZE + 1}
            {"–"}
            {Math.min(pageNum * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link
                href={qs(pageNum - 1)}
                className="rounded-md border border-input px-3 py-1.5 hover:bg-muted"
              >
                Newer
              </Link>
            )}
            {pageNum < totalPages && (
              <Link
                href={qs(pageNum + 1)}
                className="rounded-md border border-input px-3 py-1.5 hover:bg-muted"
              >
                Older
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
