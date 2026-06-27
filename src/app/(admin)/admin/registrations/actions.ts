"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { delegateInclude, serializeDelegate, type SerializedDelegate } from "./_lib/types"
import { sendPaymentConfirmed, resendByLogId } from "@/lib/resend"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") redirect("/signin")
  return session
}

export interface DelegateEditData {
  fullName: string
  email: string
  whatsapp: string
  altPhone?: string
  institution: string
  isDtu: boolean
  munExperience?: string
  pref1Portfolio?: string
  pref2Portfolio?: string
  needsAccommodation: boolean
  outsideNcr: boolean
  reference?: string
}

export async function updateDelegate(
  id: string,
  data: DelegateEditData,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await prisma.delegate.update({
      where: { id },
      data: {
        fullName: data.fullName,
        email: data.email,
        whatsapp: data.whatsapp,
        altPhone: data.altPhone || null,
        institution: data.institution,
        isDtu: data.isDtu,
        munExperience: data.munExperience || null,
        pref1Portfolio: data.pref1Portfolio || null,
        pref2Portfolio: data.pref2Portfolio || null,
        needsAccommodation: data.needsAccommodation,
        outsideNcr: data.outsideNcr,
        reference: data.reference || null,
      },
    })
    return { success: true }
  } catch {
    return { success: false, error: "Update failed. Please try again." }
  }
}

export async function markPaidOffline(
  delegateId: string,
): Promise<{ success: boolean; error?: string; delegate?: SerializedDelegate }> {
  await requireAdmin()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { delegateId },
        data: { status: "OFFLINE", confirmedAt: new Date(), method: "upi_manual" },
      })
      await tx.delegate.update({
        where: { id: delegateId },
        data: { status: "CONFIRMED" },
      })
    })
    const updated = await prisma.delegate.findUniqueOrThrow({
      where: { id: delegateId },
      include: delegateInclude,
    })
    try {
      await sendPaymentConfirmed(delegateId)
    } catch {
      // email failure must not surface to the admin
    }
    return { success: true, delegate: serializeDelegate(updated) }
  } catch {
    return { success: false, error: "Failed to mark as paid. Please try again." }
  }
}

export async function resendEmail(
  logId: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try {
    await resendByLogId(logId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Resend failed." }
  }
}
