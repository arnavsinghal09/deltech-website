import {
  Html, Head, Body, Container, Heading, Text, Hr, Preview, Section,
} from "@react-email/components"

interface Props {
  coDelegateName: string
  primaryDelegateName: string
  committeeName: string
  portfolioName: string
  paymentsEnabled: boolean
}

const bg = "#f4f0e6"
const card = "#fffdf8"
const muted = "#71717a"
const gold = "#8a6a2f"
const serif = "Georgia, 'Times New Roman', serif"

export function CoDelegateNoticeEmail({
  coDelegateName,
  primaryDelegateName,
  committeeName,
  portfolioName,
  paymentsEnabled,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>You have been added as a co-delegate for {committeeName}.</Preview>
      <Body style={{ fontFamily: "Inter, ui-sans-serif, sans-serif", backgroundColor: bg, margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: card, borderRadius: 12, padding: "40px 40px 32px", border: "1px solid #e6ded0" }}>
            <Text style={{ color: gold, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
              DelTech MUN · Co-delegate Notice
            </Text>
            <Heading style={{ color: "#18181b", fontFamily: serif, fontSize: 26, fontWeight: 700, margin: "0 0 20px" }}>
              You&apos;ve been added as a co-delegate!
            </Heading>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 12px" }}>
              Hi {coDelegateName},
            </Text>
            <Text style={{ color: "#3f3f46", fontSize: 15, lineHeight: "1.6", margin: "0 0 24px" }}>
              You have been registered as the co-delegate of{" "}
              <strong style={{ color: "#18181b" }}>{primaryDelegateName}</strong> for{" "}
              <strong style={{ color: "#18181b" }}>{committeeName}</strong>.
            </Text>

            <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
              <Text style={{ color: muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>Committee</Text>
              <Text style={{ color: "#18181b", fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>{committeeName}</Text>
              <Text style={{ color: muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>Portfolio</Text>
              <Text style={{ color: "#18181b", fontSize: 15, fontWeight: 600, margin: 0 }}>{portfolioName}</Text>
            </Section>

            <Text style={{ color: "#3f3f46", fontSize: 14, lineHeight: "1.6", margin: 0 }}>
              {paymentsEnabled
                ? "Your primary delegate is responsible for payment. You will receive further event details closer to the date."
                : "No payment is required for this Intra MUN. Your shared allotment is already confirmed."}
              {" "}If you have any questions, please contact the secretariat.
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
