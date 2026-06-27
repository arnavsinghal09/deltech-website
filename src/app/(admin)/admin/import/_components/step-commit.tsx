"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, XCircle, AlertCircle, Users, Kanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ValidatedRow, PaymentMode } from "@/lib/schemas/import"
import type { CommitResult } from "../actions"
import { commitImport } from "../actions"

interface Props {
  validated:            ValidatedRow[]
  skipped:              Set<number>
  paymentMode:          PaymentMode
  partnerNote:          string
  onPaymentModeChange:  (m: PaymentMode) => void
  onPartnerNoteChange:  (n: string) => void
  onBack:               () => void
  onDone:               () => void
}

export function StepCommit({
  validated,
  skipped,
  paymentMode,
  partnerNote,
  onPaymentModeChange,
  onPartnerNoteChange,
  onBack,
  onDone,
}: Props) {
  const [result,   setResult]   = useState<CommitResult | null>(null)
  const [pending,  startCommit] = useTransition()

  const importRows = validated.filter((r) => !skipped.has(r.index) && r.errors.length === 0)
  const withAllotment = importRows.filter((r) => r.mapped.committee && r.mapped.portfolio).length

  const handleCommit = () => {
    startCommit(async () => {
      const res = await commitImport({
        rows:        importRows.map((r) => r.mapped),
        skippedRows: [],
        paymentMode,
        partnerNote,
      })
      setResult(res)
      if (res.created > 0) {
        toast.success(`Imported ${res.created} delegate${res.created !== 1 ? "s" : ""}.`)
      } else {
        toast.error("No delegates were created.")
      }
    })
  }

  if (result) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 space-y-6">
        <div>
          <p className="text-base font-semibold text-foreground">Import results</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{result.created}</p>
            <p className="text-xs text-green-600 mt-1">Created</p>
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center">
            <p className="text-2xl font-bold text-primary">{result.allotted}</p>
            <p className="text-xs text-primary/70 mt-1">Auto-allotted</p>
          </div>
          <div className="rounded-lg bg-muted border border-border p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>
            <p className="text-xs text-muted-foreground mt-1">Skipped (duplicate)</p>
          </div>
        </div>

        {result.errors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Errors</p>
            <div className="overflow-auto max-h-48 rounded-lg border border-destructive/30 bg-destructive/5">
              {result.errors.map((e, i) => (
                <div key={i} className="flex gap-3 px-4 py-2 border-b border-destructive/10 last:border-0">
                  <XCircle className="size-4 shrink-0 text-destructive mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-foreground">{e.email}</span>
                    <span className="text-xs text-muted-foreground"> — {e.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button className="w-full" onClick={onDone}>Done</Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Users className="size-4 text-primary" />
          <span className="font-medium">{importRows.length}</span>
          <span className="text-muted-foreground">delegates to import</span>
        </div>
        {withAllotment > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Kanban className="size-4 text-primary" />
            <span className="font-medium">{withAllotment}</span>
            <span className="text-muted-foreground">will be auto-allotted</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Payment choice */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Payment arrangement
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPaymentModeChange("comp")}
            className={cn(
              "rounded-lg border-2 p-4 text-left transition-colors",
              paymentMode === "comp"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40",
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className={cn("size-4", paymentMode === "comp" ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-semibold text-foreground">Comp</span>
              <Badge variant="secondary" className="text-[10px]">free</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Mark delegates as <strong>CONFIRMED</strong> immediately. No payment record created.
              Use for partner delegates covered by your MoU.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onPaymentModeChange("upi")}
            className={cn(
              "rounded-lg border-2 p-4 text-left transition-colors",
              paymentMode === "upi"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40",
            )}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className={cn("size-4", paymentMode === "upi" ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-semibold text-foreground">Collect via UPI</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Create a <strong>PENDING</strong> payment for allotted delegates. Admin marks paid
              in the drawer after verifying. Avoids Razorpay's 2% fee.
            </p>
          </button>
        </div>
      </div>

      {/* Partner note */}
      <div className="space-y-1.5">
        <Label htmlFor="partner-note" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Partner / source note (optional)
        </Label>
        <Input
          id="partner-note"
          placeholder="e.g. NITI Aayog MUN 2026"
          className="h-9 text-sm"
          value={partnerNote}
          onChange={(e) => onPartnerNoteChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Stored as <code className="text-[11px]">sourceNote</code> on each delegate record.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack} disabled={pending}>← Back</Button>
        <Button onClick={handleCommit} disabled={pending || importRows.length === 0}>
          {pending ? "Importing…" : `Import ${importRows.length} delegates`}
        </Button>
      </div>
    </div>
  )
}
