import { Html, Head, Body, Container, Heading, Text, Hr } from "@react-email/components"

interface Props {
  fullName: string
  email: string
}

export function RegistrationReceivedEmail({ fullName, email }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px", backgroundColor: "#fff" }}
        >
          <Heading style={{ fontSize: 24, fontWeight: 700 }}>Registration received!</Heading>
          <Text>Hi {fullName},</Text>
          <Text>
            Thank you for registering for DelTech MUN. We have received your application and will
            send your allotment and payment link to <strong>{email}</strong> once the secretariat
            processes your application.
          </Text>
          <Hr />
          <Text style={{ color: "#888", fontSize: 12 }}>
            DelTech MUN — Delhi Technological University
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
