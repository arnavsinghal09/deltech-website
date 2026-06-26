import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  steps: string[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: Props) {
  return (
    <nav aria-label="Registration progress">
      <ol className="flex items-center">
        {steps.map((label, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <li key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
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
                    "hidden text-[10px] font-medium sm:block",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 transition-colors",
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
