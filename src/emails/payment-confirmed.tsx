import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section, Button,
} from "@react-email/components"

interface Props {
  eventName: string
  fullName: string
  committeeName: string
  portfolioName: string
  amountInr: number
  confirmedAt: Date
  whatsappCommunityUrl: string
  contactEmail: string
  contacts: Array<{ name: string; role: string; phone: string }>
}

const brand = "#0f766e"
const bg = "#f4f0e6"
const card = "#fffdf8"
const muted = "#71717a"
const gold = "#8a6a2f"
const serif = "Georgia, 'Times New Roman', serif"

export function PaymentConfirmedEmail({
  eventName,
  fullName,
  committeeName,
  portfolioName,
  amountInr,
  confirmedAt,
  whatsappCommunityUrl,
  contactEmail,
  contacts,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your registration is confirmed, see you at the conference!</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e6ded0" }}>
            <Text style={{ color: gold, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              {eventName}. Payment confirmed
            </Text>
            <Heading style={{ color: "#18181b", fontFamily: serif, fontSize: 26, fontWeight: 700, margin: "0 0 20px" }}>
              You&apos;re all set! 🎉
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 24px" }}>
              Hi {fullName}, your payment of{" "}
              <strong style={{ color: "#18181b" }}>₹{amountInr.toLocaleString("en-IN")}</strong> has
              been confirmed. Your registration for {eventName} is now complete.
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
              Your seat is officially confirmed. Schedule, venue, preparation material, and committee notices will follow through official channels.
            </Text>
            {whatsappCommunityUrl && (
              <Button href={whatsappCommunityUrl} style={{ backgroundColor: brand, color: "#fff", fontSize: 15, fontWeight: 700, borderRadius: 8, padding: "12px 24px", textDecoration: "none", display: "block", textAlign: "center", marginTop: 24 }}>
                Join the official WhatsApp community
              </Button>
            )}
            <Hr style={{ borderColor: "#e4e4e7", margin: "28px 0 20px" }} />
            <Text style={{ color: "#3f3f46", fontSize: 13, lineHeight: "1.6", margin: "0 0 12px" }}>
              Need help? Contact <strong>{contactEmail}</strong>.
            </Text>
            {contacts.map((contact) => (
              <Text key={contact.name + contact.phone} style={{ color: "#18181b", fontSize: 13, lineHeight: "1.5", margin: "4px 0" }}>
                <strong>{contact.name}</strong> · {contact.role}{contact.phone ? " · " + contact.phone : ""}
              </Text>
            ))}
          </Section>

          <Hr style={{ borderColor: "transparent", margin: "12px 0 0" }} />
          <Text style={{ color: muted, fontSize: 11, textAlign: "center", margin: 0 }}>
            {eventName} · Delhi Technological University · Delhi
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
