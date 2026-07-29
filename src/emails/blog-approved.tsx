import { EmailShell, P, B, Cta } from "./_shell"

interface Props {
  authorName: string
  postTitle: string
  postUrl: string
}

export function BlogApprovedEmail({ authorName, postTitle, postUrl }: Props) {
  return (
    <EmailShell
      preview="Your article is now live on the DelTech MUN blog."
      eyebrow="DelTech MUN · Blog"
      heading="Your article is live"
    >
      <P>Hi {authorName},</P>
      <P>
        <B>{postTitle}</B> cleared review and is published on the DelTech MUN blog. Thanks for
        writing it.
      </P>

      <Cta href={postUrl}>Read it on the site</Cta>
    </EmailShell>
  )
}
