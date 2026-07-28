import { Skeleton } from "@/components/ui/skeleton"

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Skeleton className="mb-10 h-10 w-56" />
      <Skeleton className="mb-8 aspect-[16/9] w-full rounded-lg" />
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 border-t border-border/60 pt-6">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
