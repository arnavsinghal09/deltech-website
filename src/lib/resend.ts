import type React from "react"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { getContent } from "@/lib/settings"
import { STRINGS } from "@/content/strings"
import { RegistrationReceivedEmail } from "@/emails/registration-received"
import { AllotmentEmail } from "@/emails/allotment"
import { CoDelegateNoticeEmail } from "@/emails/co-delegate-notice"
import { PaymentConfirmedEmail } from "@/emails/payment-confirmed"
import { PaymentReminderEmail } from "@/emails/payment-reminder"
import { BlogApprovedEmail } from "@/emails/blog-approved"
import { BlogChangesRequestedEmail } from "@/emails/blog-changes-requested"

const resend = new Resend(process.env.AUTH_RESEND_KEY)
const FROM = process.env.EMAIL_FROM ?? "noreply@deltechmun.in"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ""

// ---------------------------------------------------------------------------
// Core send + log helper
// ---------------------------------------------------------------------------

async function loggedSend({
  delegateId,
  template,
  toEmail,
  subject,
  reactElement,
}: {
  delegateId?: string
  template: string
  toEmail: string
  subject: string
  reactElement: React.ReactElement
}): Promise<void> {
  let status = "SENT"
  let error: string | undefined

  try {
    const { error: apiError } = await resend.emails.send({
      from: FROM,
      to: toEmail,
      subject,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      react: reactElement as any,
    })
    if (apiError) {
      status = "FAILED"
      error = apiError.message
    }
  } catch (err) {
    status = "FAILED"
    error = err instanceof Error ? err.message : String(err)
  }

  await prisma.emailLog.create({
    data: { delegateId, template, toEmail, status, error },
  })

  if (status === "FAILED") {
    throw new Error(`Email send failed [${template}→${toEmail}]: ${error}`)
  }
}

// ---------------------------------------------------------------------------
// Per-template helpers (each fetches its own data from delegateId)
// ---------------------------------------------------------------------------

export async function sendRegistrationReceived(delegateId: string): Promise<void> {
  const delegate = await prisma.delegate.findUniqueOrThrow({
    where: { id: delegateId },
    select: { fullName: true, email: true },
  })

  await loggedSend({
    delegateId,
    template: "registration-received",
    toEmail: delegate.email,
    subject: STRINGS.email.subjects.registrationReceived,
    reactElement: RegistrationReceivedEmail({ fullName: delegate.fullName, email: delegate.email }),
  })
}

export async function sendAllotmentEmail(delegateId: string): Promise<void> {
  const delegate = await prisma.delegate.findUniqueOrThrow({
    where: { id: delegateId },
    select: {
      fullName: true,
      email: true,
      needsAccommodation: true,
      allotment: {
        include: {
          portfolio: { include: { committee: true } },
        },
      },
      payment: { select: { amountInr: true, paymentLink: true } },
    },
  })

  if (!delegate.allotment || !delegate.payment) {
    throw new Error(`Delegate ${delegateId} has no allotment or payment record`)
  }

  const committee = delegate.allotment.portfolio.committee
  const portfolio = delegate.allotment.portfolio
  const content = await getContent()

  const subject = STRINGS.email.subjects.allotmentSent
    .replace("{committee}", committee.name)
    .replace("{portfolio}", portfolio.name)

  const payLink = delegate.payment.paymentLink ?? `${APP_URL}/pay/${delegateId}`

  await loggedSend({
    delegateId,
    template: "allotment",
    toEmail: delegate.email,
    subject,
    reactElement: AllotmentEmail({
      fullName: delegate.fullName,
      committeeName: committee.name,
      portfolioName: portfolio.name,
      agenda: committee.agenda ?? null,
      amountInr: delegate.payment.amountInr,
      payLink,
      needsAccommodation: delegate.needsAccommodation,
      accommodationNote: content.accommodationNote,
    }),
  })

  await prisma.allotment.update({
    where: { delegateId },
    data: { emailSentAt: new Date() },
  })
}

export async function sendCoDelegateNotice(delegateId: string): Promise<void> {
  const delegate = await prisma.delegate.findUniqueOrThrow({
    where: { id: delegateId },
    select: {
      fullName: true,
      coDelegate: true,
      allotment: {
        include: { portfolio: { include: { committee: true } } },
      },
    },
  })

  if (!delegate.coDelegate || !delegate.allotment) return

  const committee = delegate.allotment.portfolio.committee
  const portfolio = delegate.allotment.portfolio
  const subject = STRINGS.email.subjects.coDelegateNotice.replace("{committee}", committee.name)

  await loggedSend({
    delegateId,
    template: "co-delegate-notice",
    toEmail: delegate.coDelegate.email,
    subject,
    reactElement: CoDelegateNoticeEmail({
      coDelegateName: delegate.coDelegate.fullName,
      primaryDelegateName: delegate.fullName,
      committeeName: committee.name,
      portfolioName: portfolio.name,
    }),
  })
}

export async function sendPaymentConfirmed(delegateId: string): Promise<void> {
  const delegate = await prisma.delegate.findUniqueOrThrow({
    where: { id: delegateId },
    select: {
      fullName: true,
      email: true,
      allotment: {
        include: { portfolio: { include: { committee: true } } },
      },
      payment: { select: { amountInr: true, confirmedAt: true } },
    },
  })

  if (!delegate.allotment || !delegate.payment) return

  const committee = delegate.allotment.portfolio.committee
  const portfolio = delegate.allotment.portfolio

  await loggedSend({
    delegateId,
    template: "payment-confirmed",
    toEmail: delegate.email,
    subject: STRINGS.email.subjects.paymentConfirmed,
    reactElement: PaymentConfirmedEmail({
      fullName: delegate.fullName,
      committeeName: committee.name,
      portfolioName: portfolio.name,
      amountInr: delegate.payment.amountInr,
      confirmedAt: delegate.payment.confirmedAt ?? new Date(),
    }),
  })
}

export async function sendPaymentReminder(delegateId: string): Promise<void> {
  const delegate = await prisma.delegate.findUniqueOrThrow({
    where: { id: delegateId },
    select: {
      fullName: true,
      email: true,
      allotment: {
        include: { portfolio: { include: { committee: true } } },
      },
      payment: { select: { amountInr: true, paymentLink: true } },
    },
  })

  if (!delegate.allotment || !delegate.payment) return

  const committee = delegate.allotment.portfolio.committee
  const portfolio = delegate.allotment.portfolio
  const payLink = delegate.payment.paymentLink ?? `${APP_URL}/pay/${delegateId}`

  await loggedSend({
    delegateId,
    template: "payment-reminder",
    toEmail: delegate.email,
    subject: STRINGS.email.subjects.paymentReminder,
    reactElement: PaymentReminderEmail({
      fullName: delegate.fullName,
      committeeName: committee.name,
      portfolioName: portfolio.name,
      amountInr: delegate.payment.amountInr,
      payLink,
    }),
  })
}

export async function sendBlogApproved(postId: string): Promise<void> {
  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
    select: { title: true, slug: true, author: { select: { name: true, email: true } } },
  })

  const subject = STRINGS.email.subjects.blogApproved.replace("{title}", post.title)
  const postUrl = `${APP_URL}/blog/${post.slug}`

  await loggedSend({
    template: "blog-approved",
    toEmail: post.author.email!,
    subject,
    reactElement: BlogApprovedEmail({
      authorName: post.author.name ?? "Author",
      postTitle: post.title,
      postUrl,
    }),
  })
}

export async function sendBlogChangesRequested(postId: string): Promise<void> {
  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
    select: {
      title: true,
      reviewNote: true,
      author: { select: { name: true, email: true } },
    },
  })

  const subject = STRINGS.email.subjects.blogChangesRequested.replace("{title}", post.title)
  const editUrl = `${APP_URL}/write/${postId}`

  await loggedSend({
    template: "blog-changes-requested",
    toEmail: post.author.email!,
    subject,
    reactElement: BlogChangesRequestedEmail({
      authorName: post.author.name ?? "Author",
      postTitle: post.title,
      reviewNote: post.reviewNote ?? "",
      editUrl,
    }),
  })
}

// ---------------------------------------------------------------------------
// Resend by log ID (admin drawer)
// ---------------------------------------------------------------------------

const RESENDABLE_TEMPLATES: Record<string, (id: string) => Promise<void>> = {
  "registration-received": sendRegistrationReceived,
  allotment: sendAllotmentEmail,
  "co-delegate-notice": sendCoDelegateNotice,
  "payment-confirmed": sendPaymentConfirmed,
  "payment-reminder": sendPaymentReminder,
}

export async function resendByLogId(logId: string): Promise<void> {
  const log = await prisma.emailLog.findUniqueOrThrow({ where: { id: logId } })
  const fn = RESENDABLE_TEMPLATES[log.template]
  if (!fn) throw new Error(`Template "${log.template}" cannot be resent via logId`)
  if (!log.delegateId) throw new Error(`Log ${logId} has no delegateId`)
  await fn(log.delegateId)
}
