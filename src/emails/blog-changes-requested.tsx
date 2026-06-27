import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section, Button,
} from "@react-email/components"

interface Props {
  authorName: string
  postTitle: string
  reviewNote: string
  editUrl: string
}

const brand = "#0f766e"
const bg = "#f4f4f5"
const card = "#ffffff"
const muted = "#71717a"

export function BlogChangesRequestedEmail({ authorName, postTitle, reviewNote, editUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>The editor has requested changes on your article.</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e4e4e7" }}>
            <Text style={{ color: brand, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              DelTech MUN — Blog
            </Text>
            <Heading style={{ color: "#18181b", fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>
              Changes requested
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              Hi {authorName},
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 24px" }}>
              Our editor has reviewed{" "}
              <strong style={{ color: "#18181b" }}>&ldquo;{postTitle}&rdquo;</strong> and requested
              some changes before it can be published.
            </Text>

            <Section style={{ backgroundColor: "#fefce8", border: "1px solid #fde047", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
              <Text style={{ color: "#713f12", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
                Editor&apos;s note
              </Text>
              <Text style={{ color: "#3f3f46", fontSize: 14, lineHeight: "1.6", margin: 0 }}>
                {reviewNote}
              </Text>
            </Section>

            <Button
              href={editUrl}
              style={{
                backgroundColor: brand,
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 8,
                padding: "12px 28px",
                textDecoration: "none",
                display: "block",
                textAlign: "center",
              }}
            >
              Edit your article →
            </Button>
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
