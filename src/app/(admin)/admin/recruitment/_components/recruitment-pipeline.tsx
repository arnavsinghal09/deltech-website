"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowRight, Check, ChevronDown, ChevronUp, Download, FileSpreadsheet,
  Mail, Phone, RefreshCw, Search, Undo2, UserRoundCheck, UsersRound,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { saveScore, setApplicantStatus, syncRecruitmentSheet } from "../actions"

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
  answers: Record<string, string>
}

type Round = "GD" | "PI"
type StageKey = "gd" | "pi" | "selected" | "rejected"

function stageOf(status: string): StageKey {
  if (status === "SELECTED") return "selected"
  if (status === "REJECTED") return "rejected"
  if (status === "GD_DONE" || status === "PI_SCHEDULED" || status === "PI_DONE") return "pi"
  return "gd"
}

const STAGES: Array<{ key: StageKey; step: string; label: string; help: string }> = [
  { key: "gd", step: "01", label: "GD desk", help: "Read applications, score discussion, send the shortlist forward." },
  { key: "pi", step: "02", label: "PI desk", help: "Review the GD record, interview, and make the final call." },
  { key: "selected", step: "03", label: "Final team", help: "The clean selected list, ready to export." },
  { key: "rejected", step: "-", label: "Not selected", help: "Archived decisions that can still be restored." },
]

const VERDICTS = {
  GD: [
    { value: "SHORTLIST", label: "Send to PI" },
    { value: "REJECT", label: "Not selected" },
  ],
  PI: [
    { value: "SELECT", label: "Final select" },
    { value: "SHORTLIST", label: "Hold for review" },
    { value: "REJECT", label: "Not selected" },
  ],
}

export function RecruitmentPipeline({
  applicants,
  sheetUrl,
}: {
  applicants: PipelineApplicant[]
  sheetUrl: string
}) {
  const router = useRouter()
  const [activeStage, setActiveStage] = useState<StageKey>("gd")
  const [query, setQuery] = useState("")
  const [sourceUrl, setSourceUrl] = useState(sheetUrl)
  const [isSyncing, startSync] = useTransition()

  const groups = useMemo(() => {
    const result: Record<StageKey, PipelineApplicant[]> = { gd: [], pi: [], selected: [], rejected: [] }
    const normalizedQuery = query.trim().toLowerCase()
    for (const applicant of applicants) {
      if (
        normalizedQuery &&
        ![applicant.fullName, applicant.email, applicant.phone ?? "", applicant.branch ?? ""]
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      ) continue
      result[stageOf(applicant.status)].push(applicant)
    }
    return result
  }, [applicants, query])

  const sync = () => {
    if (!sourceUrl.trim()) {
      toast.error("Paste the Google Sheet sharing link.")
      return
    }
    startSync(async () => {
      const result = await syncRecruitmentSheet(sourceUrl)
      if (!result.success) {
        toast.error(result.error ?? "Could not sync the sheet.")
        return
      }
      toast.success(
        result.created
          ? result.created + " new · " + result.updated + " refreshed · " + result.skipped + " skipped"
          : "No new applicants · " + result.updated + " refreshed · " + result.skipped + " skipped",
      )
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <section className="grid overflow-hidden border border-foreground/15 bg-foreground text-background xl:grid-cols-[0.75fr_1.25fr]">
        <div className="p-7 sm:p-9">
          <FileSpreadsheet className="size-8 text-primary" />
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.22em] text-background/55">Google Form response source</p>
          <h2 className="mt-3 font-heading text-3xl">Pull the live response sheet.</h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-background/65">
            Paste the Form&apos;s linked Google Sheet once. Sync before every GD or PI session; existing scores and decisions are preserved.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 border-t border-background/15 bg-background/5 p-7 xl:border-l xl:border-t-0 sm:p-9">
          <label htmlFor="recruitment-sheet" className="text-sm font-semibold">Google Sheet sharing link</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="recruitment-sheet"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className="h-12 border-background/25 bg-background text-foreground placeholder:text-muted-foreground sm:flex-1"
            />
            <Button size="lg" onClick={sync} disabled={isSyncing} className="h-12 bg-primary text-primary-foreground hover:bg-primary/90">
              <RefreshCw className={cn(isSyncing && "animate-spin")} />
              {isSyncing ? "Reading sheet…" : "Sync responses"}
            </Button>
          </div>
          <p className="text-sm text-background/55">Sharing must be “Anyone with the link can view”. Missing name/email rows are skipped and reported.</p>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-4">
        {STAGES.map((stage) => {
          const active = activeStage === stage.key
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => setActiveStage(stage.key)}
              className={cn(
                "min-h-44 bg-background p-5 text-left transition-colors hover:bg-muted",
                active && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              <div className="flex items-start justify-between">
                <span className={cn("font-mono text-xs tracking-wider text-muted-foreground", active && "text-primary-foreground/60")}>{stage.step}</span>
                <span className="font-heading text-3xl">{groups[stage.key].length}</span>
              </div>
              <p className="mt-8 text-xl font-bold">{stage.label}</p>
              <p className={cn("mt-2 text-sm leading-relaxed text-muted-foreground", active && "text-primary-foreground/70")}>{stage.help}</p>
            </button>
          )
        })}
      </section>

      <div className="flex flex-col gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, phone, or branch" className="h-12 pl-10 text-base" />
        </div>
        {activeStage === "selected" && (
          <a href="/api/admin/export?entity=applicants&status=SELECTED&format=xlsx" className={cn(buttonVariants({ size: "lg" }), "h-12")}>
            <Download /> Export final team
          </a>
        )}
      </div>

      {activeStage === "gd" || activeStage === "pi" ? (
        <RoundDesk round={activeStage === "gd" ? "GD" : "PI"} applicants={groups[activeStage]} />
      ) : (
        <OutcomeDesk tone={activeStage} applicants={groups[activeStage]} />
      )}
    </div>
  )
}

function RoundDesk({ round, applicants }: { round: Round; applicants: PipelineApplicant[] }) {
  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{round === "GD" ? "Round one" : "Round two"}</p>
          <h2 className="mt-2 font-heading text-3xl">{round === "GD" ? "Group discussion desk" : "Personal interview desk"}</h2>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-1.5 text-sm">{applicants.length} awaiting decision</Badge>
      </div>
      {applicants.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center">
          <UsersRound className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold">This desk is clear.</p>
          <p className="mt-1 text-sm text-muted-foreground">{round === "GD" ? "Sync the sheet to pull new applications." : "Shortlist people from GD to send them here."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((applicant, index) => (
            <ApplicantCard key={applicant.id} applicant={applicant} round={round} index={index + 1} />
          ))}
        </div>
      )}
    </section>
  )
}

function ApplicantCard({ applicant, round, index }: { applicant: PipelineApplicant; round: Round; index: number }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [score, setScore] = useState((round === "GD" ? applicant.gdScore : applicant.piScore)?.toString() ?? "")
  const [verdict, setVerdict] = useState((round === "GD" ? applicant.gdVerdict : applicant.piVerdict) ?? "")
  const answerRows = Object.entries(applicant.answers).filter(([, value]) => value.trim())
  const verdictLabel = VERDICTS[round].find((item) => item.value === verdict)?.label

  const save = () => {
    const parsedScore = score === "" ? null : Number(score)
    if (parsedScore == null || Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
      toast.error("Record a score from 0 to 10.")
      return
    }
    if (!verdict) {
      toast.error("Choose a decision before saving.")
      return
    }
    startTransition(async () => {
      const result = await saveScore(applicant.id, round, parsedScore, verdict as never)
      if (!result.success) {
        toast.error(result.error ?? "Could not save this decision.")
        return
      }
      toast.success(round === "GD" && verdict === "SHORTLIST" ? applicant.fullName + " sent to PI." : "Decision saved for " + applicant.fullName + ".")
      router.refresh()
    })
  }

  return (
    <article className="border border-border bg-background">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-5 sm:p-6">
          <div className="flex gap-4">
            <span className="font-mono text-sm text-muted-foreground">{String(index).padStart(2, "0")}</span>
            <div className="min-w-0">
              <h3 className="font-heading text-2xl">{applicant.fullName}</h3>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <a className="flex items-center gap-1.5 hover:text-primary" href={"mailto:" + applicant.email}><Mail className="size-3.5" />{applicant.email}</a>
                {applicant.phone && <a className="flex items-center gap-1.5 hover:text-primary" href={"tel:" + applicant.phone}><Phone className="size-3.5" />{applicant.phone}</a>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {applicant.year && <Badge variant="secondary">{applicant.year}</Badge>}
                {applicant.branch && <Badge variant="secondary">{applicant.branch}</Badge>}
                {round === "PI" && applicant.gdScore != null && <Badge variant="outline">GD · {applicant.gdScore}/10</Badge>}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {expanded ? "Close application dossier" : "Read full application · " + answerRows.length + " responses"}
          </button>
        </div>

        <div className="border-t border-border bg-muted/35 p-5 lg:border-l lg:border-t-0 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{round} panel decision</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[0.55fr_1fr]">
            <div>
              <label className="text-sm font-semibold">Score / 10</label>
              <Input type="number" min={0} max={10} value={score} onChange={(event) => setScore(event.target.value)} placeholder="0–10" className="mt-2 h-12 text-base" />
            </div>
            <div>
              <label className="text-sm font-semibold">Decision</label>
              <Select value={verdict} onValueChange={(value) => setVerdict(value ?? "")}>
                <SelectTrigger className="mt-2 h-12 text-base"><span>{verdictLabel ?? "Choose outcome"}</span></SelectTrigger>
                <SelectContent>{VERDICTS[round].map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={save} disabled={isPending} className="mt-4 h-11 w-full">
            {isPending ? <RefreshCw className="animate-spin" /> : round === "GD" && verdict === "SHORTLIST" ? <ArrowRight /> : <Check />}
            {isPending ? "Saving…" : verdictLabel ? "Save · " + verdictLabel : "Save decision"}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t-4 border-foreground bg-[#f1ede4] p-5 sm:p-7">
          <p className="eyebrow">Application dossier</p>
          {answerRows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No Form answers were stored for this applicant.</p>
          ) : (
            <dl className="mt-5 grid gap-px overflow-hidden border border-black/10 bg-black/10 lg:grid-cols-2">
              {answerRows.map(([question, answer]) => (
                <div key={question} className="bg-[#f8f5ee] p-5">
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{question}</dt>
                  <dd className="mt-2 whitespace-pre-wrap text-base leading-relaxed">{answer}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </article>
  )
}

function OutcomeDesk({ tone, applicants }: { tone: "selected" | "rejected"; applicants: PipelineApplicant[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const restore = (id: string) => startTransition(async () => {
    await setApplicantStatus(id, "GD_DONE")
    toast.success("Applicant returned to the PI desk.")
    router.refresh()
  })

  return (
    <section>
      <div className={cn("p-7 text-background", tone === "selected" ? "bg-primary" : "bg-foreground")}>
        {tone === "selected" ? <UserRoundCheck className="size-8" /> : <UsersRound className="size-8" />}
        <h2 className="mt-8 font-heading text-4xl">{tone === "selected" ? "The final team" : "Not selected"}</h2>
        <p className="mt-2 max-w-2xl text-base text-background/70">
          {tone === "selected" ? "Only final PI selections appear here. Export this list when the council is ready." : "Decisions remain reversible; restoring someone sends them back to PI."}
        </p>
      </div>
      {applicants.length === 0 ? (
        <div className="border-x border-b border-border p-12 text-center text-muted-foreground">Nobody here yet.</div>
      ) : (
        <div className="divide-y divide-border border-x border-b border-border">
          {applicants.map((applicant, index) => (
            <div key={applicant.id} className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-lg font-semibold">{applicant.fullName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {applicant.email} · GD {applicant.gdScore ?? "-"}/10 · PI {applicant.piScore ?? "-"}/10
                </p>
              </div>
              <Button variant="ghost" disabled={isPending} onClick={() => restore(applicant.id)}>
                <Undo2 /> Return to PI
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
