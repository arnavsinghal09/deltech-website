import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { QRBlock } from "./_components/qr-block"
import { STRINGS } from "@/content/strings"

export default async function PayPage(props: {
  params: Promise<{ token: string }>
}) {
  const { token } = await props.params

  // token = delegateId
  const delegate = await prisma.delegate.findUnique({
    where: { id: token },
    include: {
      payment: true,
      allotment: {
        include: {
          portfolio: {
            include: {
              committee: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  if (!delegate?.payment) notFound()

  const { payment, allotment } = delegate
  const isPaid =
    ["PAID", "OFFLINE", "COMPED"].includes(payment.status) ||
    delegate.status === "CONFIRMED"

  // UPI intent string — only built when provider is upi_qr
  const upiString =
    payment.provider === "upi_qr"
      ? (() => {
          const vpa = process.env.UPI_VPA ?? ""
          const payeeName = process.env.UPI_PAYEE_NAME ?? "DelTech MUN"
          return (
            `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payeeName)}` +
            `&am=${payment.amountInr.toFixed(2)}&tn=${encodeURIComponent(delegate.id)}&cu=INR`
          )
        })()
      : null

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {STRINGS.brand.name} — Payment
          </p>
          <h1 className="mt-1 text-xl font-bold">{delegate.fullName}</h1>
          <p className="text-sm text-muted-foreground">{delegate.email}</p>
        </div>

        <Separator />

        {/* Allotment summary */}
        {allotment && (
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Committee</span>
              <span className="font-medium">{allotment.portfolio.committee.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Portfolio</span>
              <span className="font-medium">{allotment.portfolio.name}</span>
            </div>
          </div>
        )}

        <Separator />

        {/* Amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Registration fee</span>
          <span className="text-2xl font-bold">₹{payment.amountInr.toLocaleString("en-IN")}</span>
        </div>

        <Separator />

        {isPaid ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Badge className="text-sm">Payment Confirmed</Badge>
            <p className="text-center text-sm text-muted-foreground">
              Your payment has been received. You&apos;re all set!
            </p>
          </div>
        ) : payment.provider === "razorpay" && payment.paymentLink ? (
          /* ── Razorpay ── */
          <div className="flex flex-col items-center gap-4 py-2">
            <a
              href={payment.paymentLink}
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              Pay ₹{payment.amountInr.toLocaleString("en-IN")} with Razorpay
            </a>
            <p className="text-center text-xs text-muted-foreground">
              Secured by Razorpay. Supports UPI, cards, netbanking, and wallets.
            </p>
          </div>
        ) : upiString ? (
          /* ── UPI QR ── */
          <>
            <QRBlock upiString={upiString} amountInr={payment.amountInr} />

            <Separator />

            <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">After paying:</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Screenshot your payment confirmation.</li>
                <li>Your spot is held — no action needed on your end.</li>
                <li>
                  We&apos;ll confirm your registration once we verify the payment (within 24 hrs).
                </li>
              </ol>
            </div>
          </>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Payment link is being generated. Please check back shortly.
          </p>
        )}
      </div>
    </div>
  )
}
