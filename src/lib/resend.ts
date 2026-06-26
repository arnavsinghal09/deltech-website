import { Resend } from "resend"
import { RegistrationReceivedEmail } from "@/emails/registration-received"
import { STRINGS } from "@/content/strings"

const resend = new Resend(process.env.AUTH_RESEND_KEY)
const FROM = process.env.EMAIL_FROM ?? "noreply@deltechmun.in"

export async function sendRegistrationReceived(to: string, fullName: string): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: STRINGS.email.subjects.registrationReceived,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    react: RegistrationReceivedEmail({ fullName, email: to }) as any,
  })
}
