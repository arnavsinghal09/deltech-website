"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
