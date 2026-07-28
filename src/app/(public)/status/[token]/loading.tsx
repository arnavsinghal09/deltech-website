import { Skeleton } from "@/components/ui/skeleton"

export default function StatusLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}
