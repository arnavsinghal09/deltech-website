"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveScore } from "../../../actions"

interface ScoringApplicant {
  id: string
  fullName: string
  email: string
  phone: string | null
  year: string | null
  branch: string | null
  status: string
  score: number | null
  verdict: string | null
  otherScore: number | null
}

const GD_VERDICTS = [
  { value: "SHORTLIST", label: "Shortlist for PI" },
  { value: "REJECT", label: "Reject" },
]
const PI_VERDICTS = [
  { value: "SELECT", label: "Select" },
  { value: "REJECT", label: "Reject" },
  { value: "SHORTLIST", label: "Hold / discuss" },
]

export function SlotScoring({ round, applicants }: { round: "GD" | "PI"; applicants: ScoringApplicant[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [drafts, setDrafts] = useState<Record<string, { score: string; verdict: string }>>({})

  const verdicts = round === "GD" ? GD_VERDICTS : PI_VERDICTS

  const draft = (a: ScoringApplicant) =>
    drafts[a.id] ?? { score: a.score?.toString() ?? "", verdict: a.verdict ?? "" }

  const setDraft = (id: string, patch: Partial<{ score: string; verdict: string }>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...draft(applicants.find((a) => a.id === id)!), ...prev[id], ...patch } }))

  const save = (a: ScoringApplicant) => {
    const d = draft(a)
    const score = d.score === "" ? null : Number(d.score)
    if (score != null && (isNaN(score) || score < 0 || score > 10)) {
      toast.error("Score must be 0–10.")
      return
    }
    startTransition(async () => {
      const result = await saveScore(a.id, round, score, (d.verdict || null) as never)
      if (result.success) {
        toast.success(`Saved ${a.fullName.split(" ")[0]}.`)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to save.")
      }
    })
  }

  if (applicants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
        Nobody assigned to this slot yet — select applicants on the board and assign them here.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {applicants.map((a) => {
        const d = draft(a)
        return (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{a.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[a.year, a.branch, a.email].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {round === "PI" && a.otherScore != null && (
                  <Badge variant="outline" className="text-xs">GD {a.otherScore}/10</Badge>
                )}
                <Badge variant="secondary" className="text-xs">{a.status.replace("_", " ")}</Badge>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min={0}
                max={10}
                placeholder="Score /10"
                className="h-8 w-28 text-sm"
                value={d.score}
                onChange={(e) => setDraft(a.id, { score: e.target.value })}
              />
              <Select value={d.verdict} onValueChange={(v) => setDraft(a.id, { verdict: v ?? "" })}>
                <SelectTrigger className="h-8 w-44 text-sm">
                  <SelectValue placeholder="Verdict…" />
                </SelectTrigger>
                <SelectContent>
                  {verdicts.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                disabled={isPending}
                onClick={() => save(a)}
              >
                <Check className="size-3.5" /> Save
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
