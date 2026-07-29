import { EmailShell, P, B, Cta, Fine, amber } from "./_shell"

interface Props {
  fullName: string
  committeeName: string
  portfolioName: string
  amountInr: number
  payLink: string
}

export function PaymentReminderEmail({
  fullName,
  committeeName,
  portfolioName,
  amountInr,
  payLink,
}: Props) {
  const amount = `₹${amountInr.toLocaleString("en-IN")}`
  return (
    <EmailShell
      preview="Your seat is held but unpaid."
      eyebrow="DelTech MUN · Reminder"
      accent={amber}
      heading="Your payment is still pending"
    >
      <P>
        Hi {fullName}, your seat in <B>{committeeName}</B> as <B>{portfolioName}</B> is held, but the{" "}
        <B>{amount}</B> has not come through yet.
      </P>
      <P>
        Unpaid allotments get released to other delegates once the deadline passes, so please settle
        it while the seat is still yours.
      </P>

      <Cta href={payLink} tone="amber">
        Pay {amount}
      </Cta>

      <Fine>Already paid? Then this crossed with your payment. Nothing more to do.</Fine>
    </EmailShell>
  )
}
