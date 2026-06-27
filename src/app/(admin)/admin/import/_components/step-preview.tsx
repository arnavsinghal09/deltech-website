"use client"

import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { ValidatedRow } from "@/lib/schemas/import"

interface Props {
  validated:      ValidatedRow[]
  skipped:        Set<number>
  committeeNames: string[]
  onSkipChange:   (s: Set<number>) => void
  onBack:         () => void
  onNext:         () => void
}

export function StepPreview({ validated, skipped, onSkipChange, onBack, onNext }: Props) {
  const toggleSkip = (index: number) => {
    const next = new Set(skipped)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    onSkipChange(next)
  }

  const validCount   = validated.filter((r) => r.errors.length === 0 && !skipped.has(r.index)).length
  const errorCount   = validated.filter((r) => r.errors.length > 0  && !skipped.has(r.index)).length
  const skippedCount = skipped.size
  const canProceed   = validCount > 0

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-3">
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="size-4 text-green-600" />
          <span className="font-medium text-foreground">{validCount}</span>
          <span className="text-muted-foreground">valid</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <XCircle className="size-4 text-destructive" />
            <span className="font-medium text-foreground">{errorCount}</span>
            <span className="text-muted-foreground">with errors</span>
          </div>
        )}
        {skippedCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <AlertCircle className="size-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{skippedCount}</span>
            <span className="text-muted-foreground">skipped</span>
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            onClick={() => {
              const errorIndices = new Set(validated.filter((r) => r.errors.length > 0).map((r) => r.index))
              onSkipChange(errorIndices)
            }}
          >
            Skip all errors
          </button>
          <button
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            onClick={() => onSkipChange(new Set())}
          >
            Unskip all
          </button>
        </div>
      </div>

      {/* Preview table */}
      <div className="overflow-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-10 py-2 pl-3 text-left">
                <span className="sr-only">Skip</span>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Full name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Email</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Institution</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Committee</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Portfolio</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {validated.map((row) => {
              const isSkipped = skipped.has(row.index)
              const hasErrors = row.errors.length > 0
              return (
                <tr
                  key={row.index}
                  className={
                    isSkipped
                      ? "opacity-40"
                      : hasErrors
                      ? "bg-destructive/5"
                      : ""
                  }
                >
                  <td className="py-2 pl-3">
                    <Checkbox
                      checked={isSkipped}
                      onCheckedChange={() => toggleSkip(row.index)}
                      title={isSkipped ? "Unskip row" : "Skip row"}
                    />
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{row.index + 1}</td>
                  <td className="px-3 py-2 text-xs">{row.mapped.fullName || <span className="text-destructive">—</span>}</td>
                  <td className="px-3 py-2 text-xs">{row.mapped.email || <span className="text-destructive">—</span>}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{row.mapped.institution ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{row.mapped.committee ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{row.mapped.portfolio ?? "—"}</td>
                  <td className="px-3 py-2">
                    {isSkipped ? (
                      <Badge variant="outline" className="text-[10px]">skip</Badge>
                    ) : hasErrors ? (
                      <div className="space-y-0.5">
                        {row.errors.map((e, i) => (
                          <p key={i} className="text-[10px] text-destructive">{e}</p>
                        ))}
                      </div>
                    ) : (
                      <CheckCircle2 className="size-4 text-green-600" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Import {validCount} delegates →
        </Button>
      </div>
    </div>
  )
}
