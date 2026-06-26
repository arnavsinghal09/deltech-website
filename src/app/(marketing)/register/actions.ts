"use server"

import { prisma } from "@/lib/prisma"
import { getContent } from "@/lib/settings"
import { registerSchema, type RegisterFormValues } from "@/lib/schemas/register"
import { sendRegistrationReceived } from "@/lib/resend"

type ActionResult =
  | { success: true; delegateId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function registerDelegate(data: RegisterFormValues): Promise<ActionResult> {
  // Server-side registration guard
  const content = await getContent()
  if (!content.registrationOpen) {
    return { success: false, error: "Registrations are currently closed." }
  }

  // Validate with shared schema
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return { success: false, error: "Validation failed.", fieldErrors }
  }

  const vals = parsed.data

  // Look up whether pref1 committee uses double-delegation
  const pref1Committee = vals.pref1CommitteeId
    ? await prisma.committee.findUnique({
        where: { id: vals.pref1CommitteeId },
        select: { doubleDelegation: true },
      })
    : null
  const isDoubleDelegation = pref1Committee?.doubleDelegation ?? false

  // Enforce co-delegate requirement for double-delegation committees
  if (isDoubleDelegation && !vals.coDelegate) {
    return { success: false, error: "Co-delegate information is required for this committee." }
  }

  // Duplicate email guard
  const existing = await prisma.delegate.findFirst({ where: { email: vals.email } })
  if (existing) {
    return { success: false, error: "An application with this email already exists." }
  }

  const delegate = await prisma.delegate.create({
    data: {
      fullName: vals.fullName,
      email: vals.email,
      whatsapp: vals.whatsapp,
      altPhone: vals.altPhone ?? null,
      institution: vals.institution,
      isDtu: vals.isDtu,
      munExperience: vals.munExperience || null,
      source: "SELF",
      pref1CommitteeId: vals.pref1CommitteeId,
      pref1Portfolio: vals.pref1Portfolio,
      // For double-delegation committees, clear pref2 — it is not applicable
      pref2CommitteeId: isDoubleDelegation ? null : (vals.pref2CommitteeId ?? null),
      pref2Portfolio: isDoubleDelegation ? null : (vals.pref2Portfolio ?? null),
      needsAccommodation: vals.needsAccommodation,
      outsideNcr: vals.outsideNcr,
      reference: vals.reference || null,
      status: "REGISTERED",
      ...(isDoubleDelegation && vals.coDelegate
        ? {
            coDelegate: {
              create: {
                fullName: vals.coDelegate.fullName,
                email: vals.coDelegate.email,
                phone: vals.coDelegate.phone,
                institution: vals.coDelegate.institution ?? null,
                munExperience: vals.coDelegate.munExperience || null,
              },
            },
          }
        : {}),
    },
  })

  // Fire stub email — real template Day 15; failure must not block registration
  try {
    await sendRegistrationReceived(delegate.email, delegate.fullName)
  } catch {
    // intentionally silent
  }

  return { success: true, delegateId: delegate.id }
}
