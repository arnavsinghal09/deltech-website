import { Text } from "@react-email/components"
import { EmailShell, P, B, Cta, Panel, muted, bodyInk } from "./_shell"

interface Props {
  authorName: string
  postTitle: string
  reviewNote: string
  editUrl: string
}

export function BlogChangesRequestedEmail({ authorName, postTitle, reviewNote, editUrl }: Props) {
  return (
    <EmailShell
      preview="An editor has asked for changes on your article."
      eyebrow="DelTech MUN · Blog"
      heading="Changes requested"
    >
      <P>Hi {authorName},</P>
      <P>
        An editor read <B>{postTitle}</B> and wants a few things adjusted before it goes up.
      </P>

      <Panel>
        <Text
          style={{
            color: muted,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          Editor&apos;s note
        </Text>
        <Text style={{ color: bodyInk, fontSize: 14, lineHeight: "1.6", margin: 0 }}>
          {reviewNote}
        </Text>
      </Panel>

      <Cta href={editUrl}>Make the changes</Cta>
    </EmailShell>
  )
}
