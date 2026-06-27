import type { PaymentProvider } from "./index"

interface RazorpayPaymentLinkResponse {
  id: string
  short_url: string
  status: string
}

export class RazorpayProvider implements PaymentProvider {
  private auth(): string {
    const keyId = process.env.RAZORPAY_KEY_ID ?? ""
    const keySecret = process.env.RAZORPAY_KEY_SECRET ?? ""
    return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`
  }

  async createPaymentLink({
    delegateId,
    amountInr,
    email,
  }: {
    delegateId: string
    amountInr: number
    email: string
  }): Promise<{ link: string; orderId?: string }> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""

    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.auth(),
      },
      body: JSON.stringify({
        amount: amountInr * 100, // paise
        currency: "INR",
        description: "DelTech MUN Registration Fee",
        customer: { email },
        notify: { email: true },
        reminder_enable: false,
        notes: { delegateId },
        // After payment, Razorpay redirects back to our pay page
        callback_url: `${appUrl}/pay/${delegateId}`,
        callback_method: "get",
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Razorpay API error ${res.status}: ${err}`)
    }

    const data = (await res.json()) as RazorpayPaymentLinkResponse
    return { link: data.short_url, orderId: data.id }
  }
}
