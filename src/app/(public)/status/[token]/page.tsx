import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "Registered",
  ALLOTTED: "Allotted — payment link coming soon",
  PAYMENT_SENT: "Payment pending",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  WAITLISTED: "Waitlisted",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  REGISTERED: "secondary",
  ALLOTTED: "outline",
  PAYMENT_SENT: "outline",
  PAID: "default",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  WAITLISTED: "secondary",
}

const PAY_STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  SENT: "Payment link sent",
  PAID: "Paid",
  OFFLINE: "Confirmed (UPI)",
  COMPED: "Comped",
  FAILED: "Payment failed",
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value ?? "—"}</p>
    </div>
  )
}

export default async function StatusPage(props: {
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
              committee: { select: { name: true, agenda: true } },
            },
          },
        },
      },
    },
  })

  if (!delegate) notFound()

  const session = await auth()
  const isOwner = session?.user?.email?.toLowerCase() === delegate.email.toLowerCase()

  const { payment, allotment } = delegate
  const needsPayment =
    payment && (payment.status === "PENDING" || payment.status === "SENT") && payment.paymentLink
  const isConfirmed = delegate.status === "CONFIRMED"

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              DelTech MUN — Application Status
            </p>
            <h1 className="mt-1 text-xl font-bold">{delegate.fullName}</h1>
            <p className="text-sm text-muted-foreground">{delegate.email}</p>
          </div>
          <Badge variant={STATUS_VARIANT[delegate.status] ?? "secondary"}>
            {STATUS_LABEL[delegate.status] ?? delegate.status}
          </Badge>
        </div>

        <Separator />

        {/* Allotment */}
        {allotment ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Allotment
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Committee" value={allotment.portfolio.committee.name} />
              <Field label="Portfolio" value={allotment.portfolio.name} />
              {allotment.portfolio.committee.agenda && (
                <div className="col-span-2">
                  <Field label="Agenda" value={allotment.portfolio.committee.agenda} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Allotment
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Not yet allotted. You&apos;ll receive your committee and portfolio once the admin
              reviews your application.
            </p>
          </div>
        )}

        <Separator />

        {/* Payment */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Payment</p>
          {payment ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Amount"
                  value={`₹${payment.amountInr.toLocaleString("en-IN")}`}
                />
                <Field
                  label="Status"
                  value={PAY_STATUS_LABEL[payment.status] ?? payment.status}
                />
                {isConfirmed && payment.confirmedAt && (
                  <Field
                    label="Confirmed on"
                    value={new Date(payment.confirmedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  />
                )}
              </div>

              {needsPayment && (
                <Link
                  href={payment.paymentLink!}
                  className={cn(buttonVariants({ size: "lg" }), "w-full")}
                >
                  Pay Now — ₹{payment.amountInr.toLocaleString("en-IN")}
                </Link>
              )}

              {isConfirmed && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  ✓ Your registration is confirmed. See you at the conference!
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Payment details will appear here once you&apos;ve been allotted a committee.
            </p>
          )}
        </div>

        {/* Login prompt for guests */}
        {!isOwner && (
          <>
            <Separator />
            <p className="text-center text-xs text-muted-foreground">
              This link is unique to you — keep it safe.{" "}
              <Link
                href="/signin"
                className="text-primary underline-offset-2 hover:underline"
              >
                Sign in
              </Link>{" "}
              to access your account.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
