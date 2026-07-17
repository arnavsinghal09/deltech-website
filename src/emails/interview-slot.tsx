import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section,
} from "@react-email/components"

interface Props {
  fullName: string
  roundLabel: string
  startsAt: Date
  venue: string | null
}

const brand = "#0f766e"
const bg = "#f4f4f5"
const card = "#ffffff"
const muted = "#71717a"

export function InterviewSlotEmail({ fullName, roundLabel, startsAt, venue }: Props) {
  const when = startsAt.toLocaleString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  })

  return (
    <Html>
      <Head />
      <Preview>Your {roundLabel} is scheduled — details inside.</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e4e4e7" }}>
            <Text style={{ color: brand, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              DelTech MUN — Recruitment
            </Text>
            <Heading style={{ color: "#18181b", fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>
              Your {roundLabel} is scheduled
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              Hi {fullName},
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 16px" }}>
              You&apos;ve been scheduled for your <strong>{roundLabel}</strong>:
            </Text>
            <Section style={{ backgroundColor: "#f0fdfa", borderRadius: 8, padding: "16px 20px", border: "1px solid #ccfbf1" }}>
              <Text style={{ color: "#134e4a", fontSize: 15, fontWeight: 600, margin: 0 }}>{when} IST</Text>
              {venue && (
                <Text style={{ color: "#134e4a", fontSize: 14, margin: "6px 0 0" }}>
                  {venue.startsWith("http") ? "Join link: " : "Venue: "}
                  {venue}
                </Text>
              )}
            </Section>
            <Text style={{ color: "#3f3f46", fontSize: 14, lineHeight: "1.6", margin: "16px 0 0" }}>
              Please be on time. Reply to this email if you cannot make the slot.
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
