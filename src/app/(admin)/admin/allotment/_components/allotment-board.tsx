"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { releaseHold, revokeAllotment } from "../actions"
import { PortfolioCard } from "./portfolio-card"
import { AllotDialog } from "./allot-dialog"
import type { CommitteeType, PortfolioStatus } from "@/generated/prisma/client"

// ── Serialized types (Dates converted to ISO strings for client props) ─────────

export interface SerializedAllotment {
  id: string
  delegateId: string
  committeeId: string
  portfolioId: string
  allottedAt: string
  allottedBy: string
  emailSentAt: string | null
  delegate: {
    id: string
    fullName: string
    email: string
    isDtu: boolean
    coDelegate: { id: string; fullName: string } | null
  }
}

export interface SerializedPortfolio {
  id: string
  committeeId: string
  name: string
  status: PortfolioStatus
  allotment: SerializedAllotment | null
}

export interface SerializedCommittee {
  id: string
  name: string
  type: CommitteeType
  doubleDelegation: boolean
  portfolios: SerializedPortfolio[]
}

export interface SerializedDelegate {
  id: string
  fullName: string
  email: string
  institution: string
  isDtu: boolean
  munExperience: string | null
  pref1CommitteeId: string | null
  pref1Portfolio: string | null
  pref2CommitteeId: string | null
  pref2Portfolio: string | null
  coDelegate: { id: string; fullName: string } | null
  createdAt: string
}

export interface Fee {
  id: string
  label: string
  committeeType: string
  isDtu: boolean
  amountInr: number
}

interface Props {
  committees: SerializedCommittee[]
  delegates: SerializedDelegate[]
  fees: Fee[]
  paymentsRequired: boolean
}

export function AllotmentBoard({ committees, delegates, fees, paymentsRequired }: Props) {
  const router = useRouter()
  const [selectedCommitteeId, setSelectedCommitteeId] = useState(committees[0]?.id ?? "")
  const [dialogPortfolio, setDialogPortfolio] = useState<SerializedPortfolio | null>(null)
  const [dialogCommittee, setDialogCommittee] = useState<SerializedCommittee | null>(null)

  const selectedCommittee = committees.find((c) => c.id === selectedCommitteeId)

  const handlePortfolioClick = (portfolio: SerializedPortfolio, committee: SerializedCommittee) => {
    if (portfolio.status === "ALLOTTED" || portfolio.status === "BLOCKED") return
    setDialogPortfolio(portfolio)
    setDialogCommittee(committee)
  }

  const handleDialogClose = async () => {
    if (dialogPortfolio?.status === "ON_HOLD") {
      await releaseHold(dialogPortfolio.id)
    }
    setDialogPortfolio(null)
    setDialogCommittee(null)
    router.refresh()
  }

  const handleAllotted = () => {
    setDialogPortfolio(null)
    setDialogCommittee(null)
    router.refresh()
    toast.success("Portfolio allotted successfully.")
  }

  const handleRevoke = async (portfolio: SerializedPortfolio) => {
    if (!portfolio.allotment) return
    const confirmed = window.confirm(
      `Revoke allotment for ${portfolio.allotment.delegate.fullName} from "${portfolio.name}"?`,
    )
    if (!confirmed) return

    const result = await revokeAllotment({
      allotmentId: portfolio.allotment.id,
      portfolioId: portfolio.id,
      delegateId: portfolio.allotment.delegateId,
    })

    if (result.success) {
      toast.success("Allotment revoked.")
      router.refresh()
    } else {
      toast.error(result.error ?? "Revoke failed.")
    }
  }

  if (committees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active committees. Add committees in Config.
      </p>
    )
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* Committee sidebar */}
      <aside className="w-48 shrink-0 space-y-0.5">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Committees
        </p>
        {committees.map((c) => {
          const allotted = c.portfolios.filter((p) => p.status === "ALLOTTED").length
          const total = c.portfolios.length
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCommitteeId(c.id)}
              className={cn(
                "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                c.id === selectedCommitteeId
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="block font-medium leading-tight">{c.name}</span>
              <span className="block text-xs opacity-70">{allotted}/{total} allotted</span>
            </button>
          )
        })}
      </aside>

      {/* Portfolio grid */}
      <div className="flex-1 min-w-0">
        {selectedCommittee ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">{selectedCommittee.name}</h2>
              {selectedCommittee.doubleDelegation && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  double delegation
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {selectedCommittee.portfolios.filter((p) => p.status === "AVAILABLE").length} available
                {" · "}
                {selectedCommittee.portfolios.filter((p) => p.status === "ALLOTTED").length} allotted
                {" · "}
                {selectedCommittee.portfolios.length} total
              </span>
            </div>

            {selectedCommittee.portfolios.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No portfolios configured. Add them in Config.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {selectedCommittee.portfolios.map((portfolio) => (
                  <PortfolioCard
                    key={portfolio.id}
                    portfolio={portfolio}
                    committee={selectedCommittee}
                    onClick={() => handlePortfolioClick(portfolio, selectedCommittee)}
                    onRevoke={() => handleRevoke(portfolio)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a committee.</p>
        )}
      </div>

      {/* Allot dialog — rendered outside the grid so it isn't clipped */}
      {dialogPortfolio && dialogCommittee && (
        <AllotDialog
          portfolio={dialogPortfolio}
          committee={dialogCommittee}
          delegates={delegates}
          fees={fees}
          paymentsRequired={paymentsRequired}
          onClose={handleDialogClose}
          onAllotted={handleAllotted}
        />
      )}
    </div>
  )
}
