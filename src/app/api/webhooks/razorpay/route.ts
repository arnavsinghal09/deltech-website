// TODO: verify Razorpay webhook signature and handle payment events
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  return NextResponse.json({ received: true })
}
