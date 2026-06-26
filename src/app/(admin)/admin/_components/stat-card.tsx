import { type LucideIcon } from "lucide-react"

interface Props {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: string
}

export function StatCard({ title, value, icon: Icon, description, trend }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-card-foreground">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">
              {description}
              {trend && (
                <span className="ml-1 font-medium text-primary">{trend}</span>
              )}
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-lg bg-primary/10 p-2.5">
          <Icon className="size-5 text-primary" />
        </div>
      </div>
    </div>
  )
}
