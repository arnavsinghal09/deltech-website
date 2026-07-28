import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { safeLanding } from "@/lib/nav"

// Post-authentication dispatch. Every sign-in path (magic link, password,
// signup) sends the user here; this is the single place that resolves where
// they actually land, by role, honoring a sanitized intended destination.
// Not in the proxy matcher — it guards itself via auth().
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.redirect(new URL("/signin", req.nextUrl))
  }
  const role = (session.user as { role?: string } | undefined)?.role
  const to = req.nextUrl.searchParams.get("to")
  return NextResponse.redirect(new URL(safeLanding(to, role), req.nextUrl))
}
