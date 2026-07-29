import { EmailShell, P, B, A, Callout } from "./_shell"

interface Props {
  fullName: string
  email: string
  eventName: string
  paymentsEnabled: boolean
  statusUrl?: string
}

export function RegistrationReceivedEmail({
  fullName,
  email,
  eventName,
  paymentsEnabled,
  statusUrl,
}: Props) {
  return (
    <EmailShell
      preview="We have your registration. Allotments follow shortly."
      heading="Registration received"
    >
      <P>Hi {fullName},</P>
      <P>
        You are registered for {eventName}. The secretariat reviews preferences in batches, and your
        committee and portfolio allotment will reach <B>{email}</B> once yours is through.
      </P>

      <Callout>
        {paymentsEnabled
          ? "If you are allotted, that email carries the payment link."
          : "This is a free Intra MUN. There is nothing to pay and no proof to upload."}
      </Callout>

      <P last={!statusUrl}>Allotments usually go out within a few days of the deadline closing.</P>

      {statusUrl && (
        <P last>
          You can check where you stand at any time at <A href={statusUrl}>{statusUrl}</A>. That link
          is yours alone, so keep it to yourself.
        </P>
      )}
    </EmailShell>
  )
}
