// TODO: configure NextAuth handlers and wire up in src/lib/auth.ts
// export { GET, POST } from "@/lib/auth"

import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({ message: "Auth not yet configured" }, { status: 501 })
}

export function POST() {
  return NextResponse.json({ message: "Auth not yet configured" }, { status: 501 })
}
