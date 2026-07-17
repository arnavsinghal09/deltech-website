import type { PaymentProvider } from "./index"
import { getContent } from "@/lib/settings"

// Fixed external payment link (Google Form, GPay link, anything) set in /admin/config.
export class StaticLinkProvider implements PaymentProvider {
  async createPaymentLink(): Promise<{ link: string }> {
    const content = await getContent()
    if (!content.staticPaymentLink) {
      throw new Error(
        "paymentProvider is static_link but staticPaymentLink is empty — set it in /admin/config",
      )
    }
    return { link: content.staticPaymentLink }
  }
}
