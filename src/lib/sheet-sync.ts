import { prisma } from "@/lib/prisma"
import { getContent } from "@/lib/settings"

export type SheetCellState = "available" | "allotted" | "paid"

// Mirrors one matrix cell to the public Google Sheet via the Apps Script web
// app (docs/apps-script/sheet-mirror.gs). Fire-and-best-effort, never throws,
// no-ops when sheetSyncUrl is unset. A missed sync self-corrects on the next
// state change for that cell.
export async function syncSheetCell(d: {
  committee: string
  portfolio: string
  state: SheetCellState
}): Promise<void> {
  try {
    const content = await getContent()
    if (!content.sheetSyncUrl) return
    const res = await fetch(content.sheetSyncUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: process.env.SHEET_SYNC_SECRET ?? "", ...d }),
      signal: AbortSignal.timeout(4000),
      redirect: "follow", // Apps Script web apps respond via a 302 to script.googleusercontent.com
    })
    if (!res.ok) console.error("[sheet-sync]", res.status, d.committee, d.portfolio)
  } catch (err) {
    console.error("[sheet-sync]", err instanceof Error ? err.message : err, d.committee, d.portfolio)
  }
}

// For call sites that only have the delegateId (payment webhooks, mark-paid):
// looks the delegate's cell up and mirrors its current state.
export async function syncSheetForDelegate(delegateId: string): Promise<void> {
  try {
    const allotment = await prisma.allotment.findUnique({
      where: { delegateId },
      include: { portfolio: { include: { committee: true } }, delegate: true },
    })
    if (!allotment) return
    await syncSheetCell({
      committee: allotment.portfolio.committee.name,
      portfolio: allotment.portfolio.name,
      state: allotment.delegate.status === "CONFIRMED" ? "paid" : "allotted",
    })
  } catch (err) {
    console.error("[sheet-sync]", err instanceof Error ? err.message : err)
  }
}
