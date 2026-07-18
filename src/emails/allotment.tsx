import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section, Button, Row, Column,
} from "@react-email/components"

interface Props {
  eventName: string
  fullName: string
  committeeName: string
  portfolioName: string
  agenda: string | null
  amountInr?: number
  payLink?: string
  paymentsEnabled: boolean
  needsAccommodation: boolean
  accommodationNote: string
  conferenceDates: string
  venue: string
  paymentDeadline: string
  paymentProofUrl: string
  refundPolicy: string
  contactEmail: string
  contacts: Array<{ name: string; role: string; phone: string }>
}

const brand = "#0f766e"
const bg = "#f4f0e6"
const card = "#fffdf8"
const muted = "#71717a"
const gold = "#8a6a2f"
const serif = "Georgia, 'Times New Roman', serif"

export function AllotmentEmail({
  eventName,
  fullName,
  committeeName,
  portfolioName,
  agenda,
  amountInr,
  payLink,
  paymentsEnabled,
  needsAccommodation,
  accommodationNote,
  conferenceDates,
  venue,
  paymentDeadline,
  paymentProofUrl,
  refundPolicy,
  contactEmail,
  contacts,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{paymentsEnabled ? "Your portfolio allotment and payment link are inside." : "Your portfolio allotment is confirmed."}</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e6ded0" }}>
            <Text style={{ color: gold, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              {eventName} — Portfolio allotment
            </Text>
            <Heading style={{ color: "#18181b", fontFamily: serif, fontSize: 26, fontWeight: 700, margin: "0 0 20px" }}>
              Your portfolio is confirmed!
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 24px" }}>
              Hi {fullName}, congratulations — the Secretariat has allotted you to{" "}
              <strong style={{ color: "#18181b" }}>{committeeName}</strong> as{" "}
              <strong style={{ color: "#18181b" }}>{portfolioName}</strong>.
            </Text>

            {/* Allotment details */}
            <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
              <Row style={{ marginBottom: 10 }}>
                <Column style={{ width: "40%" }}>
                  <Text style={{ color: muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>Committee</Text>
                  <Text style={{ color: "#18181b", fontSize: 14, fontWeight: 600, margin: "4px 0 0" }}>{committeeName}</Text>
                </Column>
                <Column>
                  <Text style={{ color: muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>Portfolio</Text>
                  <Text style={{ color: "#18181b", fontSize: 14, fontWeight: 600, margin: "4px 0 0" }}>{portfolioName}</Text>
                </Column>
              </Row>
              {agenda && (
                <Row>
                  <Column>
                    <Text style={{ color: muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>Agenda</Text>
                    <Text style={{ color: "#3f3f46", fontSize: 13, margin: "4px 0 0" }}>{agenda}</Text>
                  </Column>
                </Row>
              )}
            </Section>

            {(conferenceDates || venue) && (
              <Section style={{ borderTop: "1px solid #e4e4e7", borderBottom: "1px solid #e4e4e7", padding: "14px 0", marginBottom: 24 }}>
                {conferenceDates && <Text style={{ color: "#18181b", fontSize: 14, margin: "0 0 6px" }}><strong>Conference:</strong> {conferenceDates}</Text>}
                {venue && <Text style={{ color: "#18181b", fontSize: 14, margin: 0 }}><strong>Venue:</strong> {venue}</Text>}
              </Section>
            )}

            {paymentsEnabled && amountInr != null && payLink ? <>
            <Section style={{ backgroundColor: "#f0fdf9", border: "1px solid #99f6e4", borderRadius: 8, padding: "16px 20px", marginBottom: 28 }}>
              <Text style={{ color: muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>Registration fee</Text>
              <Text style={{ color: "#18181b", fontSize: 24, fontWeight: 700, margin: "0 0 0" }}>
                ₹{amountInr.toLocaleString("en-IN")}
              </Text>
            </Section>

            <Button
              href={payLink}
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
                marginBottom: 20,
              }}
            >
              Pay ₹{amountInr.toLocaleString("en-IN")} →
            </Button>

            <Text style={{ color: "#3f3f46", fontSize: 13, lineHeight: "1.6", margin: "0 0 0" }}>
              Your spot is reserved. Complete payment{paymentDeadline ? <> by <strong>{paymentDeadline}</strong></> : " within the stated deadline"} to confirm your registration.
            </Text>
            {paymentProofUrl && (
              <Button href={paymentProofUrl} style={{ color: brand, fontSize: 13, fontWeight: 700, textDecoration: "underline", display: "block", marginTop: 14 }}>
                Submit payment proof after paying
              </Button>
            )}
            {refundPolicy && <Text style={{ color: muted, fontSize: 12, lineHeight: "1.6", margin: "14px 0 0" }}>{refundPolicy}</Text>}
            </> : (
              <Section style={{ backgroundColor: "#f0fdf9", border: "1px solid #99f6e4", borderRadius: 8, padding: "16px 20px", marginBottom: 20 }}>
                <Text style={{ color: brand, fontSize: 14, fontWeight: 700, margin: 0 }}>
                  No payment is required. Your allotment is confirmed.
                </Text>
              </Section>
            )}

            {needsAccommodation && accommodationNote && (
              <>
                <Hr style={{ borderColor: "#e4e4e7", margin: "24px 0" }} />
                <Text style={{ color: muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  Accommodation
                </Text>
                <Text style={{ color: "#3f3f46", fontSize: 13, lineHeight: "1.6", margin: 0 }}>
                  {accommodationNote}
                </Text>
              </>
            )}

            <Hr style={{ borderColor: "#e4e4e7", margin: "28px 0 20px" }} />
            <Text style={{ color: "#3f3f46", fontSize: 13, lineHeight: "1.6", margin: "0 0 12px" }}>
              Questions? Reply to this email or contact <strong>{contactEmail}</strong>.
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
