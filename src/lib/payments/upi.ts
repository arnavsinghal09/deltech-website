import type { PaymentProvider } from "./index"

export class UpiProvider implements PaymentProvider {
  async createPaymentLink({
    delegateId,
  }: {
    delegateId: string
    amountInr: number
    email: string
  }): Promise<{ link: string }> {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? ""
    return { link: `${base}/pay/${delegateId}` }
  }
}
