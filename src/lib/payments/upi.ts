import type { PaymentProvider } from "./index"
import { absoluteAppUrl } from "@/lib/app-url"

export class UpiProvider implements PaymentProvider {
  async createPaymentLink({
    publicToken,
  }: {
    delegateId: string
    publicToken: string
    amountInr: number
    email: string
  }): Promise<{ link: string }> {
    return { link: absoluteAppUrl(`/pay/${publicToken}`) }
  }
}
