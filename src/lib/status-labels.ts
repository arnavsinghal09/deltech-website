// Shared delegate + payment status display maps. Previously copy-pasted (and
// already drifting) between the delegate dashboard and the public status page.

export const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "Registered",
  ALLOTTED: "Allotted — payment link coming soon",
  PAYMENT_SENT: "Payment pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  WAITLISTED: "Waitlisted",
}

export const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  REGISTERED: "secondary",
  ALLOTTED: "outline",
  PAYMENT_SENT: "outline",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  WAITLISTED: "secondary",
}

export const PAY_STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  SENT: "Payment link sent",
  PAID: "Paid",
  OFFLINE: "Confirmed (UPI)",
  COMPED: "Comped",
  FAILED: "Payment failed",
}
