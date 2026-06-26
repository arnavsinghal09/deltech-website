"use client"

import { useState } from "react"
import { X, Edit2 } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { SerializedDelegate } from "../_lib/types"
import { DelegateEditForm } from "./delegate-edit-form"

interface Props {
  delegate: SerializedDelegate | null
  committees: { id: string; name: string }[]
  onClose: () => void
  onUpdated: (updated: SerializedDelegate) => void
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  REGISTERED: "secondary", ALLOTTED: "outline", PAYMENT_SENT: "outline",
  PAID: "default", CONFIRMED: "default", CANCELLED: "destructive", WAITLISTED: "secondary",
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value ?? "—"}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{title}</p>
      {children}
    </div>
  )
}

export function DelegateDrawer({ delegate, committees, onClose, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)

  const committeeMap = new Map(committees.map(c => [c.id, c.name]))

  const handleClose = () => {
    setEditing(false)
    onClose()
  }

  const handleUpdated = (updated: SerializedDelegate) => {
    setEditing(false)
    onUpdated(updated)
  }

  return (
    <Drawer
      open={!!delegate}
      onOpenChange={(open) => { if (!open) handleClose() }}
      direction="right"
    >
      <DrawerContent className="sm:max-w-lg overflow-hidden flex flex-col">
        <DrawerHeader className="flex items-start justify-between border-b border-border/60 pb-4">
          <div className="min-w-0 flex-1">
            <DrawerTitle className="truncate text-base font-semibold">
              {delegate?.fullName ?? "Delegate"}
            </DrawerTitle>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{delegate?.email}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 pl-2">
            {!editing && (
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setEditing(true)}>
                <Edit2 className="size-3.5" /> Edit
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <X className="size-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {delegate && (
            editing ? (
              <DelegateEditForm
                delegate={delegate}
                onSuccess={handleUpdated}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <div className="space-y-6">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <Badge variant={STATUS_VARIANT[delegate.status] ?? "secondary"} className="text-xs">
                    {delegate.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Registered {new Date(delegate.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>

                <Separator />

                {/* Personal */}
                <Section title="Personal">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Full name" value={delegate.fullName} />
                    <Field label="Email" value={delegate.email} />
                    <Field label="WhatsApp" value={delegate.whatsapp} />
                    <Field label="Alt phone" value={delegate.altPhone} />
                    <Field label="Institution" value={delegate.institution} />
                    <Field label="DTU student" value={delegate.isDtu ? "Yes" : "No"} />
                  </div>
                  {delegate.munExperience && (
                    <Field label="MUN experience" value={delegate.munExperience} />
                  )}
                </Section>

                <Separator />

                {/* Preferences */}
                <Section title="Preferences">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Pref 1 committee"
                      value={delegate.pref1CommitteeId ? (committeeMap.get(delegate.pref1CommitteeId) ?? delegate.pref1CommitteeId) : null}
                    />
                    <Field label="Pref 1 portfolio" value={delegate.pref1Portfolio} />
                    {!delegate.coDelegate && (
                      <>
                        <Field
                          label="Pref 2 committee"
                          value={delegate.pref2CommitteeId ? (committeeMap.get(delegate.pref2CommitteeId) ?? delegate.pref2CommitteeId) : null}
                        />
                        <Field label="Pref 2 portfolio" value={delegate.pref2Portfolio} />
                      </>
                    )}
                  </div>
                </Section>

                {/* Co-delegate */}
                {delegate.coDelegate && (
                  <>
                    <Separator />
                    <Section title="Co-delegate">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Name" value={delegate.coDelegate.fullName} />
                        <Field label="Email" value={delegate.coDelegate.email} />
                        <Field label="Phone" value={delegate.coDelegate.phone} />
                        <Field label="Institution" value={delegate.coDelegate.institution} />
                      </div>
                      {delegate.coDelegate.munExperience && (
                        <Field label="MUN experience" value={delegate.coDelegate.munExperience} />
                      )}
                    </Section>
                  </>
                )}

                <Separator />

                {/* Accommodation */}
                <Section title="Accommodation">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Needs accommodation" value={delegate.needsAccommodation ? "Yes" : "No"} />
                    <Field label="Outside NCR" value={delegate.outsideNcr ? "Yes" : "No"} />
                  </div>
                </Section>

                {delegate.reference && (
                  <>
                    <Separator />
                    <Section title="Reference">
                      <Field label="How they heard" value={delegate.reference} />
                    </Section>
                  </>
                )}

                <Separator />

                {/* Allotment */}
                <Section title="Allotment">
                  {delegate.allotment ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Committee"
                        value={committeeMap.get(delegate.allotment.committeeId) ?? delegate.allotment.committeeId}
                      />
                      <Field label="Portfolio" value={delegate.allotment.portfolio?.name ?? delegate.allotment.portfolioId} />
                      <Field
                        label="Allotted at"
                        value={new Date(delegate.allotment.allottedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      />
                      <Field label="Allotted by" value={delegate.allotment.allottedBy} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not yet allotted.</p>
                  )}
                </Section>

                <Separator />

                {/* Payment */}
                <Section title="Payment">
                  {delegate.payment ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Provider" value={delegate.payment.provider} />
                      <Field label="Amount" value={`₹${delegate.payment.amountInr.toLocaleString("en-IN")}`} />
                      <Field label="Status" value={delegate.payment.status} />
                      {delegate.payment.paymentLink && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Link</p>
                          <a href={delegate.payment.paymentLink} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-xs text-primary hover:underline">
                            {delegate.payment.paymentLink}
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No payment record yet.</p>
                  )}
                </Section>

                <Separator />

                {/* Email history */}
                <Section title="Email history">
                  <p className="text-sm text-muted-foreground">Email history available after Phase 6.</p>
                </Section>
              </div>
            )
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
