import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section, Button,
} from "@react-email/components"

interface Props {
  authorName: string
  postTitle: string
  postUrl: string
}

const brand = "#0f766e"
const bg = "#f4f0e6"
const card = "#fffdf8"
const muted = "#71717a"
const gold = "#8a6a2f"
const serif = "Georgia, 'Times New Roman', serif"

export function BlogApprovedEmail({ authorName, postTitle, postUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your article has been published on the DelTech MUN blog.</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e6ded0" }}>
            <Text style={{ color: gold, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              DelTech MUN — Blog
            </Text>
            <Heading style={{ color: "#18181b", fontFamily: serif, fontSize: 26, fontWeight: 700, margin: "0 0 20px" }}>
              Your article is live!
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              Hi {authorName},
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 24px" }}>
              Your article <strong style={{ color: "#18181b" }}>&ldquo;{postTitle}&rdquo;</strong> has
              been approved and is now published on the DelTech MUN blog.
            </Text>

            <Button
              href={postUrl}
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
              View your article →
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
