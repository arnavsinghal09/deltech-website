import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { buildDelegateWhere } from "@/app/(admin)/admin/registrations/_lib/build-where"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const format = sp.get("format") === "csv" ? "csv" : "xlsx"

  const delegates = await prisma.delegate.findMany({
    where: buildDelegateWhere({
      q: sp.get("q") ?? undefined,
      committeeId: sp.get("committeeId") ?? undefined,
      status: sp.get("status") ?? undefined,
      source: sp.get("source") ?? undefined,
      isDtu: sp.get("isDtu") ?? undefined,
      needsAccommodation: sp.get("needsAccommodation") ?? undefined,
    }),
    orderBy: { createdAt: "desc" },
    include: { coDelegate: true },
  })

  const rows = delegates.map((d) => ({
    "Full Name": d.fullName,
    Email: d.email,
    WhatsApp: d.whatsapp,
    "Alt Phone": d.altPhone ?? "",
    Institution: d.institution,
    DTU: d.isDtu ? "Yes" : "No",
    "MUN Experience": d.munExperience ?? "",
    "Pref1 Committee ID": d.pref1CommitteeId ?? "",
    "Pref1 Portfolio": d.pref1Portfolio ?? "",
    "Pref2 Committee ID": d.pref2CommitteeId ?? "",
    "Pref2 Portfolio": d.pref2Portfolio ?? "",
    "Needs Accommodation": d.needsAccommodation ? "Yes" : "No",
    "Outside NCR": d.outsideNcr ? "Yes" : "No",
    Status: d.status,
    Source: d.source,
    Reference: d.reference ?? "",
    "Registered At": d.createdAt.toISOString(),
    "Co-delegate Name": d.coDelegate?.fullName ?? "",
    "Co-delegate Email": d.coDelegate?.email ?? "",
    "Co-delegate Phone": d.coDelegate?.phone ?? "",
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="delegates.csv"',
      },
    })
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Delegates")
  const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string
  const binary = Buffer.from(buf, "base64")

  return new NextResponse(binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength) as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="delegates.xlsx"',
    },
  })
}
