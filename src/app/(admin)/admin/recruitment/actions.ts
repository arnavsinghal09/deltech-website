"use server"

import { prisma } from "@/lib/prisma"
import { requireStaff, requireAdmin } from "@/lib/authz"
import { audit } from "@/lib/audit"
import type { ApplicantStatus, InterviewRound, Verdict } from "@/generated/prisma/client"

// Recruitment is deliberately simple and offline: a GD panel scores applicants
// and shortlists them, a PI panel scores the shortlist and finalises selection.
// No scheduling, venues, or emails.

// Score + verdict per round. GD SHORTLIST → PI stage; GD/PI REJECT → rejected;
// PI SELECT → selected.
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

// Manual override — e.g. move someone back a stage, or un-reject.
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
