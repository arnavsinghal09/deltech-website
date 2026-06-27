import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section,
} from "@react-email/components"

interface Props {
  fullName: string
  committeeName: string
  portfolioName: string
  amountInr: number
  confirmedAt: Date
}

const brand = "#0f766e"
const bg = "#f4f4f5"
const card = "#ffffff"
const muted = "#71717a"

export function PaymentConfirmedEmail({
  fullName,
  committeeName,
  portfolioName,
  amountInr,
  confirmedAt,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your registration is confirmed — see you at the conference!</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e4e4e7" }}>
            <Text style={{ color: brand, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              DelTech MUN — Payment Confirmed
            </Text>
            <Heading style={{ color: "#18181b", fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>
              You&apos;re all set! 🎉
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 24px" }}>
              Hi {fullName}, your payment of{" "}
              <strong style={{ color: "#18181b" }}>₹{amountInr.toLocaleString("en-IN")}</strong> has
              been confirmed. Your registration for DelTech MUN is now complete.
            </Text>

            <Section style={{ backgroundColor: "#f0fdf9", border: "1px solid #99f6e4", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
              <Text style={{ color: muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 12px" }}>
                Your allotment
              </Text>
              <Text style={{ color: muted, fontSize: 11, margin: "0 0 2px" }}>Committee</Text>
              <Text style={{ color: "#18181b", fontSize: 15, fontWeight: 600, margin: "0 0 10px" }}>{committeeName}</Text>
              <Text style={{ color: muted, fontSize: 11, margin: "0 0 2px" }}>Portfolio</Text>
              <Text style={{ color: "#18181b", fontSize: 15, fontWeight: 600, margin: "0 0 10px" }}>{portfolioName}</Text>
              <Text style={{ color: muted, fontSize: 11, margin: "0 0 2px" }}>Confirmed on</Text>
              <Text style={{ color: "#3f3f46", fontSize: 14, margin: 0 }}>
                {confirmedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </Text>
            </Section>

            <Text style={{ color: "#3f3f46", fontSize: 14, lineHeight: "1.6", margin: 0 }}>
              Further details about the conference — schedule, venue, and preparation resources —
              will be shared closer to the event. We look forward to seeing you there!
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
