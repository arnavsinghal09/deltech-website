import { EmailShell, P, Cta, Fine } from "./_shell"

interface Props {
  role: string
  signInUrl: string
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "an administrator",
  MAINTAINER: "a maintainer",
  AUTHOR: "an author",
  REGISTERER: "a registerer",
}

export function StaffInviteEmail({ role, signInUrl }: Props) {
  return (
    <EmailShell
      preview="You have been added to the DelTech MUN secretariat."
      eyebrow="DelTech MUN · Secretariat"
      heading="You're on the team"
    >
      <P>
        You have been added to the DelTech MUN platform as{" "}
        {ROLE_LABEL[role] ?? `a ${role.toLowerCase()}`}.
      </P>
      <P>
        Sign in with this email address. The first time, use the magic link tab and we will send you
        a one-time link. You can set a password afterwards from your account page.
      </P>

      <Cta href={signInUrl}>Open staff sign-in</Cta>

      <Fine>Not expecting this? Let the secretariat know and we will remove the account.</Fine>
    </EmailShell>
  )
}
