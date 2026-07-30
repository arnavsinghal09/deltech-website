import { absoluteAppUrl } from "@/lib/app-url"

function isLoopbackLink(link: string): boolean {
  try {
    return ["localhost", "127.0.0.1", "::1"].includes(new URL(link).hostname)
  } catch {
    return false
  }
}

export function publicPaymentLink(
  storedLink: string | null | undefined,
  publicToken: string,
): string {
  const fallback = () => absoluteAppUrl(`/pay/${publicToken}`)
  if (!storedLink?.trim()) return fallback()
  if (storedLink.startsWith("/")) return fallback()
  if (isLoopbackLink(storedLink)) return fallback()
  return storedLink
}
