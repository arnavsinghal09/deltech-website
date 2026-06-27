"use client"

import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { ColumnMapping, ValidatedRow, PaymentMode } from "@/lib/schemas/import"
import type { ImportPresetRecord } from "../actions"
import { StepUpload } from "./step-upload"
import { StepMapping } from "./step-mapping"
import { StepPreview } from "./step-preview"
import { StepCommit } from "./step-commit"

export type WizardStep = "upload" | "mapping" | "preview" | "commit" | "done"

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "upload",  label: "Upload"  },
  { key: "mapping", label: "Map columns" },
  { key: "preview", label: "Preview" },
  { key: "commit",  label: "Import"  },
]

interface Props {
  presets:        ImportPresetRecord[]
  committeeNames: string[]
}

export function ImportWizard({ presets: initialPresets, committeeNames }: Props) {
  const [step,          setStep]          = useState<WizardStep>("upload")
  const [headers,       setHeaders]       = useState<string[]>([])
  const [rawRows,       setRawRows]       = useState<Record<string, string>[]>([])
  const [mapping,       setMapping]       = useState<ColumnMapping>({})
  const [validated,     setValidated]     = useState<ValidatedRow[]>([])
  const [skipped,       setSkipped]       = useState<Set<number>>(new Set())
  const [paymentMode,   setPaymentMode]   = useState<PaymentMode>("comp")
  const [partnerNote,   setPartnerNote]   = useState("")
  const [presets,       setPresets]       = useState(initialPresets)

  const currentIndex = STEPS.findIndex((s) => s.key === step)

  const goNext = () => {
    const next = STEPS[currentIndex + 1]
    if (next) setStep(next.key)
  }
  const goBack = () => {
    const prev = STEPS[currentIndex - 1]
    if (prev) setStep(prev.key)
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done    = i < currentIndex
          const active  = s.key === step
          const future  = i > currentIndex
          return (
            <div key={s.key} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done   && "bg-primary text-primary-foreground",
                    active && "bg-primary/10 text-primary ring-2 ring-primary",
                    future && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    active && "text-foreground",
                    !active && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <Separator
                  orientation="horizontal"
                  className={cn("mx-3 flex-1", done ? "bg-primary/40" : "bg-border")}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step panels */}
      {step === "upload" && (
        <StepUpload
          onParsed={(h, r) => {
            setHeaders(h)
            setRawRows(r)
            setMapping({})
            setValidated([])
            setSkipped(new Set())
            goNext()
          }}
        />
      )}

      {step === "mapping" && (
        <StepMapping
          headers={headers}
          rawRows={rawRows}
          mapping={mapping}
          presets={presets}
          onMappingChange={setMapping}
          onPresetsChange={setPresets}
          onBack={goBack}
          onNext={(m, v) => {
            setMapping(m)
            setValidated(v)
            setSkipped(new Set())
            goNext()
          }}
        />
      )}

      {step === "preview" && (
        <StepPreview
          validated={validated}
          skipped={skipped}
          committeeNames={committeeNames}
          onSkipChange={setSkipped}
          onBack={goBack}
          onNext={() => goNext()}
        />
      )}

      {step === "commit" && (
        <StepCommit
          validated={validated}
          skipped={skipped}
          paymentMode={paymentMode}
          partnerNote={partnerNote}
          onPaymentModeChange={setPaymentMode}
          onPartnerNoteChange={setPartnerNote}
          onBack={goBack}
          onDone={() => setStep("done")}
        />
      )}

      {step === "done" && (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-2xl font-bold text-foreground">Import complete</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Delegates have been created and appear in the registrations table.
          </p>
          <button
            className="mt-6 text-sm font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => {
              setStep("upload")
              setHeaders([])
              setRawRows([])
              setMapping({})
              setValidated([])
              setSkipped(new Set())
            }}
          >
            Start another import
          </button>
        </div>
      )}
    </div>
  )
}
