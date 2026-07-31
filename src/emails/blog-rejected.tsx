import { Text } from "@react-email/components";
import { EmailShell, P, B, Panel, muted, bodyInk } from "./_shell";

interface Props {
  authorName: string;
  postTitle: string;
  reviewNote: string;
}

export function BlogRejectedEmail({
  authorName,
  postTitle,
  reviewNote,
}: Props) {
  return (
    <EmailShell
      preview="An editor has decided not to run your article."
      eyebrow="DelTech MUN · Blog"
      heading="Not running this one"
    >
      <P>Hi {authorName},</P>
      <P>
        An editor read <B>{postTitle}</B> and decided not to publish it. The
        reason is below.
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
        <Text
          style={{ color: bodyInk, fontSize: 14, lineHeight: "1.6", margin: 0 }}
        >
          {reviewNote}
        </Text>
      </Panel>

      <P last>
        This decision is on the piece, not on you. Start a new draft whenever
        you want to pitch again.
      </P>
    </EmailShell>
  );
}
