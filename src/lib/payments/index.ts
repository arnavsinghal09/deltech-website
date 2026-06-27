import { getContent } from "@/lib/settings"

export interface PaymentProvider {
  createPaymentLink(d: {
    delegateId: string
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
  const { UpiProvider } = await import("./upi")
  return new UpiProvider()
}
