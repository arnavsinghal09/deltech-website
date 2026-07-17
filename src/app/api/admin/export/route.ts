import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { buildDelegateWhere } from "@/app/(admin)/admin/registrations/_lib/build-where"

function sheetResponse(
  rows: Record<string, string | number>[],
  format: "csv" | "xlsx",
  name: string,
) {
  const ws = XLSX.utils.json_to_sheet(rows)

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}.csv"`,
      },
    })
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, name)
  const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string
  const binary = Buffer.from(buf, "base64")
  return new NextResponse(binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength) as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}.xlsx"`,
    },
  })
}

async function exportApplicants(format: "csv" | "xlsx") {
  const applicants = await prisma.applicant.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      gdSlot: { select: { startsAt: true } },
      piSlot: { select: { startsAt: true } },
    },
  })

  const rows = applicants.map((a) => ({
    "Full Name": a.fullName,
    Email: a.email,
    Phone: a.phone ?? "",
    Year: a.year ?? "",
    Branch: a.branch ?? "",
    Status: a.status,
    "GD Slot": a.gdSlot?.startsAt.toISOString() ?? "",
    "GD Score": a.gdScore ?? "",
    "GD Verdict": a.gdVerdict ?? "",
    "PI Slot": a.piSlot?.startsAt.toISOString() ?? "",
    "PI Score": a.piScore ?? "",
    "PI Verdict": a.piVerdict ?? "",
    "Applied At": a.createdAt.toISOString(),
  }))

  return sheetResponse(rows, format, "applicants")
}

export async function GET(request: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session || (role !== "ADMIN" && role !== "MAINTAINER")) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const format = sp.get("format") === "csv" ? "csv" : "xlsx"

  if (sp.get("entity") === "applicants") {
    return exportApplicants(format)
  }

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
