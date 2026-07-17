"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserPlus, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { bulkAssign } from "../actions"

export interface BoardApplicant {
  id: string
  fullName: string
  email: string
  phone: string | null
  year: string | null
  branch: string | null
  status: string
  gdScore: number | null
  gdVerdict: string | null
  piScore: number | null
  piVerdict: string | null
  gdSlotAt: string | null
  piSlotAt: string | null
}

export interface BoardSlot {
  id: string
  round: "GD" | "PI"
  startsAt: string
  venue: string | null
  capacity: number
  filled: number
}

const COLUMNS: { status: string; label: string; hint?: string }[] = [
  { status: "APPLIED", label: "Applied", hint: "select + assign to a GD slot" },
  { status: "GD_SCHEDULED", label: "GD scheduled" },
  { status: "GD_DONE", label: "GD done", hint: "select + assign to a PI slot" },
  { status: "PI_SCHEDULED", label: "PI scheduled" },
  { status: "PI_DONE", label: "PI done" },
  { status: "SELECTED", label: "Selected" },
  { status: "REJECTED", label: "Rejected" },
]

const COLUMN_ACCENT: Record<string, string> = {
  SELECTED: "border-t-green-500",
  REJECTED: "border-t-destructive",
  APPLIED: "border-t-primary",
}

function fmtSlot(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function RecruitmentBoard({ applicants, slots }: { applicants: BoardApplicant[]; slots: BoardSlot[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [slotId, setSlotId] = useState<string>("")

  const byStatus = useMemo(() => {
    const map = new Map<string, BoardApplicant[]>()
    for (const c of COLUMNS) map.set(c.status, [])
    for (const a of applicants) map.get(a.status)?.push(a)
    return map
  }, [applicants])

  const openSlots = slots.filter((s) => s.filled < s.capacity)

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const assign = () => {
    if (!slotId || selected.size === 0) return
    startTransition(async () => {
      const result = await bulkAssign([...selected], slotId)
      if (result.success) {
        toast.success(`Assigned ${result.assigned} applicant(s) — slot emails on the way.`)
        setSelected(new Set())
        setSlotId("")
        router.refresh()
      } else {
        toast.error(result.error ?? "Assignment failed.")
      }
    })
  }

  if (applicants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <UserPlus className="size-8 text-muted-foreground/60" />
        <p className="text-sm font-medium">No applicants yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Hook the recruitment Google Form to the webhook (docs/apps-script/gform-webhook.gs,
          kind: &quot;applicant&quot;) and applications appear here on submit.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk-assign toolbar — appears when rows are selected */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 backdrop-blur">
          <Badge>{selected.size} selected</Badge>
          <Select value={slotId} onValueChange={(v) => setSlotId(v ?? "")}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Assign to slot…" />
            </SelectTrigger>
            <SelectContent>
              {openSlots.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No open slots — create some under Manage slots.
                </div>
              )}
              {openSlots.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.round} · {fmtSlot(s.startsAt)} · {s.filled}/{s.capacity}
                  {s.venue ? ` · ${s.venue}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5" disabled={!slotId || isPending} onClick={assign}>
            <ArrowRight className="size-3.5" /> {isPending ? "Assigning…" : "Assign & email"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Columns */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = byStatus.get(col.status) ?? []
          return (
            <div
              key={col.status}
              className={`rounded-xl border border-border border-t-2 bg-card ${COLUMN_ACCENT[col.status] ?? "border-t-border"}`}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider">{col.label}</p>
                <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
              </div>
              <div className="max-h-96 space-y-1.5 overflow-y-auto px-2 pb-2">
                {items.length === 0 && (
                  <p className="px-2 pb-2 text-xs text-muted-foreground/60">{col.hint ?? "—"}</p>
                )}
                {items.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 bg-background p-2.5 transition-colors hover:border-primary/40"
                  >
                    <Checkbox
                      checked={selected.has(a.id)}
                      onCheckedChange={() => toggle(a.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[a.year, a.branch].filter(Boolean).join(" · ") || a.email}
                      </p>
                      {(a.gdSlotAt || a.piSlotAt) && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {a.status.startsWith("PI") && a.piSlotAt
                            ? `PI ${fmtSlot(a.piSlotAt)}`
                            : a.gdSlotAt
                              ? `GD ${fmtSlot(a.gdSlotAt)}`
                              : null}
                        </p>
                      )}
                      {(a.gdScore != null || a.piScore != null) && (
                        <p className="mt-0.5 text-[11px] font-medium text-primary">
                          {a.gdScore != null && `GD ${a.gdScore}/10`}
                          {a.gdScore != null && a.piScore != null && " · "}
                          {a.piScore != null && `PI ${a.piScore}/10`}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Scores and verdicts are entered on each slot&apos;s page —{" "}
        <Link href="/admin/recruitment/slots" className="text-primary underline underline-offset-4">
          Manage slots
        </Link>
        .
      </p>
    </div>
  )
}
