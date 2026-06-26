"use client"

import { useState, useMemo, useEffect, useTransition } from "react"
import { Search, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { holdPortfolio, allotPortfolio } from "../actions"
import type { SerializedPortfolio, SerializedCommittee, SerializedDelegate, Fee } from "./allotment-board"

interface Props {
  portfolio: SerializedPortfolio
  committee: SerializedCommittee
  delegates: SerializedDelegate[]
  fees: Fee[]
  adminEmail: string
  onClose: () => void
  onAllotted: () => void
}

interface RankedDelegate extends SerializedDelegate {
  preferenceRank: 1 | 2 | null
}

export function AllotDialog({
  portfolio,
  committee,
  delegates,
  fees,
  adminEmail,
  onClose,
  onAllotted,
}: Props) {
  const [open, setOpen] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<SerializedDelegate | null>(null)
  const [isPending, startTransition] = useTransition()
  const [heldByUs, setHeldByUs] = useState(false)

  // Soft-lock the portfolio when the dialog mounts
  useEffect(() => {
    holdPortfolio(portfolio.id)
      .then((r) => setHeldByUs(r.success))
      .catch(() => {})
  }, [portfolio.id])

  // Ranked candidate list: pref1 matches first, then pref2, then unmatched;
  // within each group, earlier registration wins.
  const rankedDelegates = useMemo((): RankedDelegate[] => {
    return delegates
      .map((d) => ({
        ...d,
        preferenceRank: (d.pref1CommitteeId === committee.id
          ? 1
          : d.pref2CommitteeId === committee.id
            ? 2
            : null) as 1 | 2 | null,
      }))
      .sort((a, b) => {
        const ra = a.preferenceRank ?? 99
        const rb = b.preferenceRank ?? 99
        if (ra !== rb) return ra - rb
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
  }, [delegates, committee.id])

  const filtered = useMemo(() => {
    if (!search.trim()) return rankedDelegates
    const q = search.toLowerCase()
    return rankedDelegates.filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.institution.toLowerCase().includes(q),
    )
  }, [rankedDelegates, search])

  const computedFee = useMemo(() => {
    if (!selected) return null
    return fees.find((f) => f.committeeType === committee.type && f.isDtu === selected.isDtu) ?? null
  }, [selected, fees, committee.type])

  const handleConfirm = () => {
    if (!selected) return
    startTransition(async () => {
      const result = await allotPortfolio({
        portfolioId: portfolio.id,
        committeeId: committee.id,
        delegateId: selected.id,
      })
      if (result.success) {
        setOpen(false)
        onAllotted()
      } else {
        toast.error(result.error ?? "Allotment failed.")
        if (result.code === "ALREADY_ALLOTTED") {
          setOpen(false)
          onClose()
        }
      }
    })
  }

  const handleOpenChange = (o: boolean) => {
    if (!o && !isPending) {
      setOpen(false)
      onClose()
    }
  }

  const onHoldByOther = portfolio.status === "ON_HOLD" && !heldByUs

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Allot portfolio</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{portfolio.name}</span>
            {" — "}
            {committee.name}
            {onHoldByOther && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                ⚠ On hold by another admin
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {committee.doubleDelegation && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            UNHRC: selecting this delegate also brings their co-delegate on the same allotment.
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search delegates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Candidate list */}
        <div className="max-h-64 divide-y divide-border/40 overflow-y-auto rounded-lg border border-border/60">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No matching delegates.</p>
          ) : (
            filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                  selected?.id === d.id && "bg-primary/10",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate font-medium">{d.fullName}</span>
                    {d.isDtu && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                        DTU
                      </span>
                    )}
                    {d.preferenceRank === 1 && (
                      <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                        Pref 1
                      </span>
                    )}
                    {d.preferenceRank === 2 && (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Pref 2
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.email} · {d.institution}
                  </p>
                  {committee.doubleDelegation && d.coDelegate && (
                    <p className="truncate text-xs text-muted-foreground">
                      + {d.coDelegate.fullName} (co-delegate)
                    </p>
                  )}
                </div>
                {selected?.id === d.id && (
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Selected summary with computed fee */}
        {selected && (
          <div className="space-y-1 rounded-lg bg-muted/60 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{selected.fullName}</span>
              {computedFee ? (
                <span className="font-semibold text-primary">
                  ₹{computedFee.amountInr.toLocaleString("en-IN")}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No fee row found</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{selected.email}</p>
            {!computedFee && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠ No fee for {committee.type} / {selected.isDtu ? "DTU" : "non-DTU"}. Payment row
                will be skipped.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selected || isPending}>
            {isPending ? "Allotting…" : "Confirm allotment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
