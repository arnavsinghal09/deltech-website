import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section,
} from "@react-email/components"

interface Props {
  coDelegateName: string
  primaryDelegateName: string
  primaryDelegateEmail: string
  eventName: string
  committeeName: string | null
  paymentsEnabled: boolean
}

const bg = "#f4f0e6"
const card = "#fffdf8"
const muted = "#71717a"
const gold = "#8a6a2f"
const serif = "Georgia, 'Times New Roman', serif"

export function CoDelegateRegisteredEmail({
  coDelegateName,
  primaryDelegateName,
  primaryDelegateEmail,
  eventName,
  committeeName,
  paymentsEnabled,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{primaryDelegateName} registered you as their co-delegate.</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e6ded0" }}>
            <Text style={{ color: gold, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              DelTech MUN
            </Text>
            <Heading style={{ color: "#18181b", fontFamily: serif, fontSize: 26, fontWeight: 700, margin: "0 0 20px" }}>
              You&apos;ve been added as a co-delegate
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              Hi {coDelegateName},
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              <strong style={{ color: "#18181b" }}>{primaryDelegateName}</strong> ({primaryDelegateEmail})
              has registered for {eventName} as a double-delegation applicant and listed you as their
              co-delegate{committeeName ? ` for ${committeeName}` : ""}.
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              Nothing is required from you right now. The secretariat processes the application as a
              single pair, and the allotment will be emailed to both of you.
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 14, lineHeight: "1.6", margin: 0 }}>
              {paymentsEnabled
                ? "Your primary delegate is responsible for the delegation fee."
                : "No payment is required for this Intra MUN."}
              {" "}If you did not expect this email, please reply so we can remove you.
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
