import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  steps: string[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: Props) {
  return (
    <nav aria-label="Registration progress" className="border-b border-foreground/20 pb-7">
      <p className="mb-5 font-heading text-2xl sm:hidden">{steps[currentStep]}</p>
      <ol className="flex items-start">
        {steps.map((label, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <li key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary bg-background text-primary",
                    !done && !active && "border-muted-foreground/40 bg-background text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "hidden max-w-20 text-center text-xs font-semibold leading-tight sm:block",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 mt-5 h-px flex-1 transition-colors",
                    i < currentStep ? "bg-primary" : "bg-muted-foreground/20",
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
