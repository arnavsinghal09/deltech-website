import { Skeleton } from "@/components/ui/skeleton"

// This page is `revalidate = 0` and joins every committee, portfolio,
// allotment and delegate on each request, and it is the CTA target from the
// public homepage. Without this, visitors sat on a blank frame.
export default function AvailabilityLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-6 h-12 w-80" />
      <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-4 w-full max-w-xl" />

      <div className="mt-14 space-y-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-6 w-52" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, j) => (
                <Skeleton key={j} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
