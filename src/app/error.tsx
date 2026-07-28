"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[route error]", error)
  }, [error])

  return (
    <div className="paper-grid grid min-h-svh place-items-center px-4 py-20">
      <div className="editorial-card w-full max-w-md p-8 text-center">
        <p className="eyebrow text-gold-500">Error</p>
        <h1 className="display mt-4 text-4xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          An unexpected error occurred. You can try again — if it keeps happening, the secretariat
          has been notified.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground/70">ref: {error.digest}</p>
        )}
        <div className="rule my-6" />
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  )
}
