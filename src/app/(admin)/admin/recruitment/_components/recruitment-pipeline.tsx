"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Search, Undo2 } from "lucide-react"
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
import { saveScore, setApplicantStatus } from "../actions"

export interface PipelineApplicant {
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
}

type Round = "GD" | "PI"

// Which visual stage an applicant sits in. Legacy *_SCHEDULED statuses (from the
// old slot flow) fold into the round they belong to so nobody is stranded.
function stageOf(status: string): "gd" | "pi" | "selected" | "rejected" {
  if (status === "SELECTED") return "selected"
  if (status === "REJECTED") return "rejected"
  if (status === "GD_DONE" || status === "PI_SCHEDULED" || status === "PI_DONE") return "pi"
  return "gd" // APPLIED, GD_SCHEDULED
}

const GD_VERDICTS = [
  { value: "SHORTLIST", label: "Shortlist for PI" },
  { value: "REJECT", label: "Reject" },
]
const PI_VERDICTS = [
  { value: "SELECT", label: "Select" },
  { value: "REJECT", label: "Reject" },
  { value: "SHORTLIST", label: "Hold" },
]

export function RecruitmentPipeline({ applicants }: { applicants: PipelineApplicant[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return applicants
    return applicants.filter(
      (a) => a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    )
  }, [applicants, query])

  const groups = useMemo(() => {
    const g = { gd: [] as PipelineApplicant[], pi: [] as PipelineApplicant[], selected: [] as PipelineApplicant[], rejected: [] as PipelineApplicant[] }
    for (const a of filtered) g[stageOf(a.status)].push(a)
    return g
  }, [filtered])

  if (applicants.length === 0) {
    return (
      <div className="editorial-card flex flex-col items-center gap-3 py-16 text-center">
        <p className="font-heading text-lg">No applicants yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Point the recruitment Google Form at the webhook
          (docs/apps-script/gform-webhook.gs, kind: &quot;applicant&quot;) and applications
          land here on submit.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or email…"
          className="h-9 pl-8"
        />
      </div>

      <Stage
        eyebrow="Round one"
        title="GD round"
        hint="Score each applicant and shortlist for PI or reject."
        round="GD"
        applicants={groups.gd}
      />
      <Stage
        eyebrow="Round two"
        title="PI round"
        hint="Shortlisted applicants. Score and make the final call."
        round="PI"
        applicants={groups.pi}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Outcome title="Selected" tone="selected" applicants={groups.selected} />
        <Outcome title="Rejected" tone="rejected" applicants={groups.rejected} />
      </div>
    </div>
  )
}

function Stage({
  eyebrow,
  title,
  hint,
  round,
  applicants,
}: {
  eyebrow: string
  title: string
  hint: string
  round: Round
  applicants: PipelineApplicant[]
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="font-heading text-2xl">{title}</h2>
        </div>
        <Badge variant="secondary" className="tabular-nums">{applicants.length}</Badge>
      </div>
      {applicants.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">{hint}</p>
      ) : (
        <div className="space-y-2">
          {applicants.map((a) => (
            <ScoreRow key={a.id} applicant={a} round={round} />
          ))}
        </div>
      )}
    </section>
  )
}

function ScoreRow({ applicant, round }: { applicant: PipelineApplicant; round: Round }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [score, setScore] = useState(
    (round === "GD" ? applicant.gdScore : applicant.piScore)?.toString() ?? "",
  )
  const [verdict, setVerdict] = useState((round === "GD" ? applicant.gdVerdict : applicant.piVerdict) ?? "")

  const verdicts = round === "GD" ? GD_VERDICTS : PI_VERDICTS

  const save = () => {
    const s = score === "" ? null : Number(score)
    if (s != null && (isNaN(s) || s < 0 || s > 10)) {
      toast.error("Score must be 0–10.")
      return
    }
    startTransition(async () => {
      const result = await saveScore(applicant.id, round, s, (verdict || null) as never)
      if (result.success) {
        toast.success(`Saved ${applicant.fullName.split(" ")[0]}.`)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to save.")
      }
    })
  }

  return (
    <div className="editorial-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{applicant.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[applicant.year, applicant.branch, applicant.email].filter(Boolean).join(" · ")}
          </p>
        </div>
        {round === "PI" && applicant.gdScore != null && (
          <Badge variant="outline" className="text-xs tabular-nums">
            GD {applicant.gdScore}/10
          </Badge>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          type="number"
          min={0}
          max={10}
          placeholder="Score /10"
          className="h-8 w-28 text-sm tabular-nums"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
        <Select value={verdict} onValueChange={(v) => setVerdict(v ?? "")}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="Verdict…" />
          </SelectTrigger>
          <SelectContent>
            {verdicts.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={isPending} onClick={save}>
          <Check className="size-3.5" /> Save
        </Button>
      </div>
    </div>
  )
}

function Outcome({
  title,
  tone,
  applicants,
}: {
  title: string
  tone: "selected" | "rejected"
  applicants: PipelineApplicant[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const moveBack = (id: string) =>
    startTransition(async () => {
      await setApplicantStatus(id, "GD_DONE")
      router.refresh()
    })

  return (
    <section
      className={`editorial-card border-t-2 p-5 ${tone === "selected" ? "border-t-primary" : "border-t-destructive"}`}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading text-lg">{title}</h2>
        <Badge variant={tone === "selected" ? "default" : "destructive"} className="tabular-nums">
          {applicants.length}
        </Badge>
      </div>
      {applicants.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {applicants.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 border-b border-border/50 py-2 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.fullName}</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {a.gdScore != null && `GD ${a.gdScore}`}
                  {a.gdScore != null && a.piScore != null && " · "}
                  {a.piScore != null && `PI ${a.piScore}`}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 shrink-0 text-muted-foreground"
                title="Move back to PI round"
                disabled={isPending}
                onClick={() => moveBack(a.id)}
              >
                <Undo2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
