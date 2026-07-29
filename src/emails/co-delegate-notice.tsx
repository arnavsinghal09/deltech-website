import { EmailShell, P, B, Panel, Row } from "./_shell"

interface Props {
  coDelegateName: string
  primaryDelegateName: string
  committeeName: string
  portfolioName: string
  paymentsEnabled: boolean
}

export function CoDelegateNoticeEmail({
  coDelegateName,
  primaryDelegateName,
  committeeName,
  portfolioName,
  paymentsEnabled,
}: Props) {
  return (
    <EmailShell
      preview={`Your co-delegate seat in ${committeeName} is set.`}
      eyebrow="DelTech MUN · Co-delegate"
      heading="Your seat is set"
    >
      <P>Hi {coDelegateName},</P>
      <P>
        You are confirmed as <B>{primaryDelegateName}</B>&apos;s co-delegate.
      </P>

      <Panel title="Your allotment">
        <Row label="Committee" value={committeeName} />
        <Row label="Portfolio" value={portfolioName} />
      </Panel>

      <P last>
        {paymentsEnabled
          ? "Payment is your primary delegate's responsibility. Schedule and prep material follow closer to the date."
          : "Nothing to pay for this Intra MUN. Your shared allotment is already confirmed."}
      </P>
    </EmailShell>
  )
}
