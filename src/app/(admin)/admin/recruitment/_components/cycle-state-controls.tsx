"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { t } from "@/content/strings"
import type { CycleStateName } from "@/lib/recruitment/permissions"
import { transitionCycle } from "../actions"

// Open, pause, finalise, complete, archive and cancel are all one guarded
// transition. `options` comes from CYCLE_TRANSITIONS on the server, so the buttons
// can only ever offer moves the state machine permits.
export function CycleStateControls({
  cycleId,
  state,
  version,
  options,
  disabled,
}: {
  cycleId: string
  state: CycleStateName
  version: number
  options: readonly CycleStateName[]
  disabled: boolean
}) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()

  function move(to: CycleStateName) {
    startTransition(async () => {
      const result = await transitionCycle({
        cycleId,
        to,
        reason: reason.trim() || undefined,
        // Optimistic lock: if someone else already moved the cycle, this is refused
        // rather than silently overwriting their change.
        expectedVersion: version,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(to)
      setReason("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <Badge className="bg-secondary font-normal text-secondary-foreground">{state}</Badge>

      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("recruitment.audit.empty")}</p>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="transition-reason" className="text-xs">
              {t("recruitment.control.transitionReasonLabel")}
            </Label>
            <Input
              id="transition-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={disabled || pending}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {options.map((to) => (
              <Button
                key={to}
                size="sm"
                variant={to === "CANCELLED" ? "ghost" : "outline"}
                disabled={disabled || pending}
                onClick={() => move(to)}
              >
                {t("recruitment.control.transitionTo")} {to}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
