import { EmailShell, P, Cta, Fine, A } from "./_shell"

interface Props {
  url: string
  expiryMinutes: number
}

export function MagicLinkEmail({ url, expiryMinutes }: Props) {
  return (
    <EmailShell
      preview="Your sign-in link for DelTech MUN."
      eyebrow="DelTech MUN"
      heading="Sign in"
    >
      <P>Use the button below to sign in. It works once, and only from this email.</P>

      <Cta href={url}>Sign in to DelTech MUN</Cta>

      <P>
        The link expires in {expiryMinutes} minutes. If it has, request a new one from the sign-in
        page.
      </P>

      <P style={{ fontSize: 13, color: "#71717a", wordBreak: "break-all" }} last>
        Button not working? Paste this into your browser: <A href={url}>{url}</A>
      </P>

      <Fine>If you did not ask to sign in, you can ignore this email.</Fine>
    </EmailShell>
  )
}
