import { prisma } from "@/lib/prisma"
import { requireStaff } from "@/lib/authz"
import { Badge } from "@/components/ui/badge"

export default async function LogsPage(props: {
  searchParams: Promise<{ actor?: string; entity?: string; action?: string }>
}) {
  await requireStaff()
  const { actor, entity, action } = await props.searchParams

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" } } : {}),
      ...(entity ? { entity: { equals: entity, mode: "insensitive" } } : {}),
      ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
    },
    orderBy: { at: "desc" },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every change, approval, and send by admins and maintainers. Latest 100 shown.
        </p>
      </div>

      {/* GET-form filters — no client state needed */}
      <form className="flex flex-wrap gap-2" method="get">
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
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {log.at.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="max-w-44 truncate px-4 py-2.5 text-xs">{log.actorEmail}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={
                        /delete|cancel|revoke|reject/.test(log.action) ? "destructive" : "secondary"
                      }
                      className="font-mono text-[11px]"
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {log.entity}
                    {log.entityId && <span className="opacity-60"> · {log.entityId.slice(0, 8)}</span>}
                  </td>
                  <td className="max-w-64 truncate px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                    {log.meta ? JSON.stringify(log.meta) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
