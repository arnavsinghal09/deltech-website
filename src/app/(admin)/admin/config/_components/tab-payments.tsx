"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { savePaymentConfig } from "../actions"

type Provider = "upi_qr" | "razorpay" | "static_link"

interface Props {
  paymentProvider: Provider
  staticPaymentLink: string
  sheetSyncUrl: string
}

// The single source of truth for how delegates pay. Everything (allotment
// emails, pay page, reminders) reads the active provider from here.
export function TabPayments({ paymentProvider, staticPaymentLink, sheetSyncUrl }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [provider, setProvider] = useState<Provider>(paymentProvider)
  const [staticLink, setStaticLink] = useState(staticPaymentLink)
  const [syncUrl, setSyncUrl] = useState(sheetSyncUrl)

  function save() {
    if (provider === "static_link" && !staticLink.trim()) {
      toast.error("Static link provider needs a link.")
      return
    }
    startTransition(async () => {
      const result = await savePaymentConfig({
        paymentProvider: provider,
        staticPaymentLink: staticLink.trim(),
        sheetSyncUrl: syncUrl.trim(),
      })
      if (result.success) {
        toast.success("Payment settings saved.")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to save.")
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Payment Provider
        </p>
        <p className="text-sm text-muted-foreground">
          Change it here once — allotment emails, the pay page, and reminders all follow.
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Active provider</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upi_qr">UPI / QR (manual verify)</SelectItem>
              <SelectItem value="razorpay">Razorpay (auto-confirm)</SelectItem>
              <SelectItem value="static_link">Fixed link (Google Form / GPay / other)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {provider === "static_link" && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Payment link</Label>
            <Input
              value={staticLink}
              onChange={(e) => setStaticLink(e.target.value)}
              placeholder="https://forms.gle/… or a GPay link"
            />
            <p className="text-xs text-muted-foreground">
              Sent to every delegate in the allotment email. Payments made here need manual
              confirmation from the registrations table.
            </p>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Google Sheet Mirror
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Apps Script web app URL (optional)
          </Label>
          <Input
            value={syncUrl}
            onChange={(e) => setSyncUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/…/exec"
          />
          <p className="text-xs text-muted-foreground">
            When set, every allotment and payment change updates the public Google Sheet
            automatically. Setup: docs/apps-script/sheet-mirror.gs
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save payment settings"}
        </Button>
      </div>
    </div>
  )
}
