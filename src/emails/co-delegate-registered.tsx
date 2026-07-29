import { EmailShell, P, B } from "./_shell"

interface Props {
  coDelegateName: string
  primaryDelegateName: string
  primaryDelegateEmail: string
  eventName: string
  committeeName: string | null
  paymentsEnabled: boolean
}

export function CoDelegateRegisteredEmail({
  coDelegateName,
  primaryDelegateName,
  primaryDelegateEmail,
  eventName,
  committeeName,
  paymentsEnabled,
}: Props) {
  return (
    <EmailShell
      preview={`${primaryDelegateName} registered you as their co-delegate.`}
      heading="You have been listed as a co-delegate"
    >
      <P>Hi {coDelegateName},</P>
      <P>
        <B>{primaryDelegateName}</B> ({primaryDelegateEmail}) has applied to {eventName} as a double
        delegation{committeeName ? ` for ${committeeName}` : ""} and put you down as their partner.
      </P>
      <P>
        There is nothing for you to do yet. The pair is processed as one application, and the
        allotment goes to both of you.
      </P>
      <P last>
        {paymentsEnabled
          ? "The delegation fee is your primary delegate's to pay."
          : "This Intra MUN is free, so there is nothing to pay."}{" "}
        If you were not expecting this, reply and we will take you off.
      </P>
    </EmailShell>
  )
}
