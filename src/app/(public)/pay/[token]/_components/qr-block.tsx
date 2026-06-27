"use client"

import { QRCodeSVG } from "qrcode.react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface Props {
  upiString: string
  amountInr: number
}

export function QRBlock({ upiString, amountInr }: Props) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <QRCodeSVG value={upiString} size={220} level="M" />
      </div>

      <p className="text-sm text-muted-foreground">
        Scan with any UPI app (GPay, PhonePe, Paytm, BHIM…)
      </p>

      <a
        href={upiString}
        className={cn(buttonVariants({ size: "lg" }), "w-full max-w-xs")}
      >
        Open in UPI App
      </a>

      <p className="text-xs text-muted-foreground">
        Amount to pay:{" "}
        <strong className="text-foreground">₹{amountInr.toLocaleString("en-IN")}</strong>
      </p>
    </div>
  )
}
