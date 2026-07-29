// The origin this deployment puts in outbound links: status pages, payment
// links, check-in QR codes, blog links, quiz join URLs.
//
// Each consumer used to read NEXT_PUBLIC_APP_URL directly, defaulting to "".
// That was fine when previews shared the production database and were told to
// point at production anyway, but it makes a staging environment untestable:
// every link in a staging email would open production.
//
//   Production   NEXT_PUBLIC_APP_URL = https://deltechmun.in
//   Staging      NEXT_PUBLIC_APP_URL = https://test.deltechmun.in
//   PR preview   unset, so it falls through to that deployment's own URL and
//                the mail it sends links back to itself
//
// Both variables are NEXT_PUBLIC_, so this resolves identically on the server
// and in the one client component that needs it (the quiz presenter).
// NEXT_PUBLIC_VERCEL_URL is injected by Vercel and carries no scheme.

/** Pure so scripts/check-app-url.ts can pin the fallback order. */
export function resolveAppUrl(
  explicit: string | undefined,
  vercelUrl: string | undefined,
): string {
  const set = explicit?.trim()
  if (set) return stripTrailingSlash(set)

  const vercel = vercelUrl?.trim()
  if (vercel) return `https://${stripTrailingSlash(vercel.replace(/^https?:\/\//, ""))}`

  // Local dev, or a build with neither set. Callers already tolerated "".
  return ""
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "")
}

export const APP_URL: string = resolveAppUrl(
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_VERCEL_URL,
)

/** Join a path onto the deployment origin. Returns the bare path when unset. */
export function appUrl(path: string): string {
  return `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`
}
