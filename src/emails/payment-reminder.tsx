import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section, Button,
} from "@react-email/components"

interface Props {
  fullName: string
  committeeName: string
  portfolioName: string
  amountInr: number
  payLink: string
}

const brand = "#0f766e"
const bg = "#f4f0e6"
const card = "#fffdf8"
const muted = "#71717a"
const gold = "#8a6a2f"
const serif = "Georgia, 'Times New Roman', serif"

export function PaymentReminderEmail({
  fullName,
  committeeName,
  portfolioName,
  amountInr,
  payLink,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your allotment is waiting, complete payment to secure your spot.</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e6ded0" }}>
            <Text style={{ color: "#b45309", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              DelTech MUN · Reminder
            </Text>
            <Heading style={{ color: "#18181b", fontFamily: serif, fontSize: 26, fontWeight: 700, margin: "0 0 20px" }}>
              Your payment is pending
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 24px" }}>
              Hi {fullName}, you have been allotted to{" "}
              <strong style={{ color: "#18181b" }}>{committeeName}</strong> as{" "}
              <strong style={{ color: "#18181b" }}>{portfolioName}</strong>, but your payment of{" "}
              <strong style={{ color: "#18181b" }}>₹{amountInr.toLocaleString("en-IN")}</strong> is
              still pending.
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 28px" }}>
              Complete your payment to secure your spot. Unpaid allotments may be released and offered
              to other delegates.
            </Text>

            <Button
              href={payLink}
              style={{
                backgroundColor: "#b45309",
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
              Complete payment · ₹{amountInr.toLocaleString("en-IN")} →
            </Button>

            <Text style={{ color: muted, fontSize: 12, textAlign: "center", margin: 0 }}>
              If you have already paid, please ignore this reminder.
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
