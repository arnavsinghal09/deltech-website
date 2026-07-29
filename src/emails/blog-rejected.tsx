import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section,
} from "@react-email/components"

interface Props {
  authorName: string
  postTitle: string
  reviewNote: string
}

const bg = "#f4f0e6"
const card = "#fffdf8"
const muted = "#71717a"
const gold = "#8a6a2f"
const serif = "Georgia, 'Times New Roman', serif"

export function BlogRejectedEmail({ authorName, postTitle, reviewNote }: Props) {
  return (
    <Html>
      <Head />
      <Preview>An editor has decided not to run your article.</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e6ded0" }}>
            <Text style={{ color: gold, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              DelTech MUN · Blog
            </Text>
            <Heading style={{ color: "#18181b", fontFamily: serif, fontSize: 26, fontWeight: 700, margin: "0 0 20px" }}>
              Not running this one
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              Hi {authorName},
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 24px" }}>
              An editor read <strong style={{ color: "#18181b" }}>{postTitle}</strong> and decided
              not to publish it. The reason is below.
            </Text>

            <Section style={{ backgroundColor: "#fefce8", border: "1px solid #fde047", borderRadius: 8, padding: "16px 20px", margin: "0 0 24px" }}>
              <Text style={{ color: "#713f12", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
                Editor&apos;s note
              </Text>
              <Text style={{ color: "#3f3f46", fontSize: 14, lineHeight: "1.6", margin: 0 }}>
                {reviewNote}
              </Text>
            </Section>

            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: 0 }}>
              This decision is on the piece, not on you. Start a new draft whenever you want to
              pitch again.
            </Text>
          </Section>

          <Hr style={{ borderColor: "transparent", margin: "12px 0 0" }} />
          <Text style={{ color: muted, fontSize: 11, textAlign: "center", margin: 0 }}>
            DelTech MUN · Delhi Technological University · Rohini, Delhi
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
