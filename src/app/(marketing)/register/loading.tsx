import { Skeleton } from "@/components/ui/skeleton"

export default function RegisterLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Skeleton className="mb-3 h-4 w-40" />
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="h-2 w-full rounded-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  )
}
