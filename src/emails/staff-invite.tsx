import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section, Button,
} from "@react-email/components"

interface Props {
  role: string
  signInUrl: string
}

const brand = "#0f766e"
const bg = "#f4f0e6"
const card = "#fffdf8"
const muted = "#71717a"
const gold = "#8a6a2f"
const serif = "Georgia, 'Times New Roman', serif"

export function StaffInviteEmail({ role, signInUrl }: Props) {
  const roleLabel = role === "ADMIN" ? "an administrator" : role === "MAINTAINER" ? "a maintainer" : `a ${role.toLowerCase()}`
  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been added to the DelTech MUN secretariat.</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e6ded0" }}>
            <Text style={{ color: gold, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              DelTech MUN — Secretariat
            </Text>
            <Heading style={{ color: "#18181b", fontFamily: serif, fontSize: 26, fontWeight: 700, margin: "0 0 20px" }}>
              You&apos;re on the team
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              You&apos;ve been added as {roleLabel} on the DelTech MUN platform.
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 20px" }}>
              Sign in with this email address — we&apos;ll send you a magic link, no
              password needed.
            </Text>
            <Button
              href={signInUrl}
              style={{ backgroundColor: brand, color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 8 }}
            >
              Open staff sign-in
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
