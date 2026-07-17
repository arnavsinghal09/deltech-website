import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section,
} from "@react-email/components"

interface Props {
  fullName: string
  email: string
  statusUrl?: string
}

const brand = "#0f766e"
const bg = "#f4f4f5"
const card = "#ffffff"
const muted = "#71717a"

export function RegistrationReceivedEmail({ fullName, email, statusUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>We have your application — allotments will be sent soon.</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e4e4e7" }}>
            <Text style={{ color: brand, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              DelTech MUN
            </Text>
            <Heading style={{ color: "#18181b", fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>
              Application received!
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              Hi {fullName},
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              Thank you for registering for DelTech MUN. We have received your application and will
              send your committee allotment and payment link to{" "}
              <strong style={{ color: "#18181b" }}>{email}</strong> once the secretariat processes
              your application.
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: 0 }}>
              Allotments are typically sent within a few days of the registration deadline.
            </Text>
            {statusUrl && (
              <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "12px 0 0" }}>
                Track your application any time at{" "}
                <a href={statusUrl} style={{ color: brand }}>
                  {statusUrl}
                </a>
                . This link is private to you — don&apos;t share it.
              </Text>
            )}
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
