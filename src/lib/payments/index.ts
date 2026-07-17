import { getContent } from "@/lib/settings"

export interface PaymentProvider {
  createPaymentLink(d: {
    delegateId: string
    publicToken: string
    amountInr: number
    email: string
  }): Promise<{ link: string; orderId?: string }>
}

export async function getActiveProvider(): Promise<PaymentProvider> {
  const content = await getContent()
  if (content.paymentProvider === "razorpay") {
    const { RazorpayProvider } = await import("./razorpay")
    return new RazorpayProvider()
  }
  if (content.paymentProvider === "static_link") {
    const { StaticLinkProvider } = await import("./static-link")
    return new StaticLinkProvider()
  }
  const { UpiProvider } = await import("./upi")
  return new UpiProvider()
}
