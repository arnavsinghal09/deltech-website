"use server"

import { prisma } from "@/lib/prisma"
import { requireStaff, requireAdmin } from "@/lib/authz"
import { audit } from "@/lib/audit"
import type { ApplicantStatus, InterviewRound, Verdict } from "@/generated/prisma/client"

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

export async function createSlot(data: {
  round: InterviewRound
  startsAt: string // ISO from <input type="datetime-local">
  venue?: string
  capacity: number
  panel: string[]
}): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  const startsAt = new Date(data.startsAt)
  if (isNaN(startsAt.getTime())) return { success: false, error: "Invalid date/time." }
  if (data.capacity < 1) return { success: false, error: "Capacity must be at least 1." }
  const slot = await prisma.interviewSlot.create({
    data: {
      round: data.round,
      startsAt,
      venue: data.venue?.trim() || null,
      capacity: data.capacity,
      panel: data.panel.filter(Boolean),
    },
  })
  await audit(session.user?.email ?? "unknown", "slot.create", "InterviewSlot", slot.id, {
    round: data.round,
    startsAt: data.startsAt,
  })
  return { success: true }
}

export async function updateSlot(
  id: string,
  data: { startsAt: string; venue?: string; capacity: number; panel: string[] },
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  const startsAt = new Date(data.startsAt)
  if (isNaN(startsAt.getTime())) return { success: false, error: "Invalid date/time." }
  await prisma.interviewSlot.update({
    where: { id },
    data: {
      startsAt,
      venue: data.venue?.trim() || null,
      capacity: data.capacity,
      panel: data.panel.filter(Boolean),
    },
  })
  await audit(session.user?.email ?? "unknown", "slot.update", "InterviewSlot", id)
  return { success: true }
}

export async function deleteSlot(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin()
  const assigned = await prisma.applicant.count({
    where: { OR: [{ gdSlotId: id }, { piSlotId: id }] },
  })
  if (assigned > 0) {
    return { success: false, error: `${assigned} applicant(s) are assigned to this slot — move them first.` }
  }
  await prisma.interviewSlot.delete({ where: { id } })
  await audit(session.user?.email ?? "unknown", "slot.delete", "InterviewSlot", id)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Assignment & scoring
// ---------------------------------------------------------------------------

export async function bulkAssign(
  applicantIds: string[],
  slotId: string,
): Promise<{ success: boolean; assigned: number; error?: string }> {
  const session = await requireStaff()
  const slot = await prisma.interviewSlot.findUnique({ where: { id: slotId } })
  if (!slot) return { success: false, assigned: 0, error: "Slot not found." }

  const already = await prisma.applicant.count({
    where: slot.round === "GD" ? { gdSlotId: slotId } : { piSlotId: slotId },
  })
  if (already + applicantIds.length > slot.capacity) {
    return {
      success: false,
      assigned: 0,
      error: `Slot capacity ${slot.capacity} — has ${already}, tried to add ${applicantIds.length}.`,
    }
  }

  const data =
    slot.round === "GD"
      ? { gdSlotId: slotId, status: "GD_SCHEDULED" as ApplicantStatus }
      : { piSlotId: slotId, status: "PI_SCHEDULED" as ApplicantStatus }

  const result = await prisma.applicant.updateMany({
    where: { id: { in: applicantIds } },
    data,
  })

  await audit(session.user?.email ?? "unknown", "applicant.bulkAssign", "InterviewSlot", slotId, {
    count: result.count,
    round: slot.round,
  })

  // Slot emails, best-effort, after the DB write.
  void import("@/lib/resend")
    .then(async ({ sendInterviewSlot }) => {
      for (const id of applicantIds) {
        await sendInterviewSlot(id, slot.round).catch(() => undefined)
      }
    })
    .catch(() => undefined)

  return { success: true, assigned: result.count }
}

export async function unassign(
  applicantId: string,
  round: InterviewRound,
): Promise<{ success: boolean }> {
  const session = await requireStaff()
  await prisma.applicant.update({
    where: { id: applicantId },
    data:
      round === "GD"
        ? { gdSlotId: null, status: "APPLIED" }
        : { piSlotId: null, status: "GD_DONE" },
  })
  await audit(session.user?.email ?? "unknown", "applicant.unassign", "Applicant", applicantId, { round })
  return { success: true }
}

// Score + verdict per round. A PI verdict of SELECT/REJECT finalizes the applicant.
export async function saveScore(
  applicantId: string,
  round: InterviewRound,
  score: number | null,
  verdict: Verdict | null,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireStaff()
  if (score != null && (score < 0 || score > 10)) {
    return { success: false, error: "Score must be 0–10." }
  }

  let status: ApplicantStatus | undefined
  if (round === "GD") {
    status = verdict === "REJECT" ? "REJECTED" : verdict ? "GD_DONE" : undefined
  } else {
    status =
      verdict === "SELECT" ? "SELECTED" : verdict === "REJECT" ? "REJECTED" : verdict ? "PI_DONE" : undefined
  }

  await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      ...(round === "GD" ? { gdScore: score, gdVerdict: verdict } : { piScore: score, piVerdict: verdict }),
      ...(status ? { status } : {}),
    },
  })
  await audit(session.user?.email ?? "unknown", "applicant.score", "Applicant", applicantId, {
    round,
    score,
    verdict,
  })
  return { success: true }
}

export async function setApplicantStatus(
  applicantId: string,
  status: ApplicantStatus,
): Promise<{ success: boolean }> {
  const session = await requireStaff()
  await prisma.applicant.update({ where: { id: applicantId }, data: { status } })
  await audit(session.user?.email ?? "unknown", "applicant.setStatus", "Applicant", applicantId, { status })
  return { success: true }
}

export async function deleteApplicant(applicantId: string): Promise<{ success: boolean }> {
  const session = await requireAdmin()
  await prisma.applicant.delete({ where: { id: applicantId } })
  await audit(session.user?.email ?? "unknown", "applicant.delete", "Applicant", applicantId)
  return { success: true }
}
