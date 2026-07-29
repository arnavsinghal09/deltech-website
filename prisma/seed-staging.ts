// Staging-only seed. Wipes the delegate/allotment/payment/blog/quiz tables and
// rebuilds a dataset you can actually exercise the product against.
//
// prisma/seed.ts creates 9 settings, 5 committees, 6 fees and one admin, but
// ZERO portfolios and ZERO delegates. A database seeded with only that has five
// empty committees, which means allotment, payment, check-in and every email
// that depends on them cannot be tested at all. This fills that in.
//
// Email is deliberately live on staging so it can be tested, which makes this
// data the blast radius. Every address here is on a domain we control. Never
// copy production data into staging.
//
//   ALLOW_DESTRUCTIVE_SEED=1 npx tsx prisma/seed-staging.ts
import "dotenv/config"
import { execFileSync } from "node:child_process"
import {
  PrismaClient,
  AppStatus,
  PayStatus,
  PortfolioStatus,
  PostStatus,
  Source,
  QuizMode,
  SlideType,
  Role,
  Prisma,
} from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// ---------------------------------------------------------------------------
// Guards. This truncates tables, so it must be impossible to point at prod.
// ---------------------------------------------------------------------------

// The production Supabase project ref. If DATABASE_URL contains this, refuse.
const PROD_DB_REF = "hktvvxtiobeaphzfmpbf"

const url = process.env.DATABASE_URL ?? ""

if (process.env.ALLOW_DESTRUCTIVE_SEED !== "1") {
  console.error(
    "Refusing to run: this seed deletes rows.\n" +
      "Set ALLOW_DESTRUCTIVE_SEED=1 if you really mean it.",
  )
  process.exit(1)
}

if (!url) {
  console.error("Refusing to run: DATABASE_URL is not set.")
  process.exit(1)
}

if (url.includes(PROD_DB_REF)) {
  console.error(
    `Refusing to run: DATABASE_URL points at the production project (${PROD_DB_REF}).\n` +
      "This script is for the staging database only.",
  )
  process.exit(1)
}

const pool = new Pool({ connectionString: url })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// ---------------------------------------------------------------------------

const DOMAIN = "deltechmun.in"
const addr = (local: string) => `staging+${local}@${DOMAIN}`

const PORTFOLIOS: Record<string, string[]> = {
  "unga-disec": ["France", "India", "Brazil", "Japan", "Kenya", "Norway", "Egypt", "Peru"],
  unhrc: ["Germany", "Canada", "Chile", "Ghana", "Nepal", "Sweden"],
  aippm: ["Home Minister", "Finance Minister", "Leader of Opposition", "Defence Minister"],
  "lok-sabha": ["Speaker", "Member, Bihar", "Member, Kerala", "Member, Assam"],
  ip: ["The Hindu", "Reuters", "Al Jazeera", "BBC"],
}

async function main() {
  // Base seed first: settings, committees, fees, admin. All upserts.
  console.log("Running base seed…")
  execFileSync("npx", ["tsx", "prisma/seed.ts"], { stdio: "inherit" })

  console.log("Clearing staging-only tables…")
  // Order matters: children before parents.
  await prisma.response.deleteMany()
  await prisma.quizSession.deleteMany()
  await prisma.slide.deleteMany()
  await prisma.presentation.deleteMany()
  await prisma.emailLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.allotment.deleteMany()
  await prisma.coDelegate.deleteMany()
  await prisma.delegate.deleteMany()
  await prisma.quarantinedRow.deleteMany()
  await prisma.post.deleteMany()
  await prisma.portfolio.deleteMany()
  await prisma.auditLog.deleteMany()

  // Staging wants the public form open so it can be tested.
  await prisma.setting.upsert({
    where: { key: "registrationOpen" },
    update: { value: true },
    create: { key: "registrationOpen", value: true },
  })
  await prisma.setting.upsert({
    where: { key: "conferenceDates" },
    update: { value: "12 to 13 September 2026" },
    create: { key: "conferenceDates", value: "12 to 13 September 2026" },
  })
  await prisma.setting.upsert({
    where: { key: "venue" },
    update: { value: "Delhi Technological University, Rohini" },
    create: { key: "venue", value: "Delhi Technological University, Rohini" },
  })

  const committees = await prisma.committee.findMany({ select: { id: true, slug: true, name: true } })
  const bySlug = new Map(committees.map((c) => [c.slug, c]))

  console.log("Creating portfolios…")
  for (const [slug, names] of Object.entries(PORTFOLIOS)) {
    const committee = bySlug.get(slug)
    if (!committee) continue
    await prisma.portfolio.createMany({
      data: names.map((name, i) => ({ committeeId: committee.id, name, priority: i })),
    })
  }

  const disec = bySlug.get("unga-disec")!
  const unhrc = bySlug.get("unhrc")!
  const ip = bySlug.get("ip")!

  const fees = await prisma.fee.findMany()
  const feeFor = (committeeType: string, isDtu: boolean) =>
    fees.find((f) => f.committeeType === committeeType && f.isDtu === isDtu)?.amountInr ?? 1600

  // A delegate for every AppStatus, so every filter, badge and flow has
  // something to act on.
  console.log("Creating delegates…")

  const mkDelegate = (
    n: number,
    status: AppStatus,
    overrides: Partial<Prisma.DelegateCreateInput> = {},
  ): Prisma.DelegateCreateInput => ({
    fullName: `Test Delegate ${n}`,
    email: addr(`delegate${n}`),
    whatsapp: `919000000${String(n).padStart(3, "0")}`,
    institution: n % 3 === 0 ? "Delhi Technological University" : `Institution ${n}`,
    isDtu: n % 3 === 0,
    munExperience: n % 2 === 0 ? "Two previous conferences" : null,
    source: Source.SELF,
    status,
    pref1CommitteeId: disec.id,
    pref1Portfolio: "France",
    pref2CommitteeId: ip.id,
    pref2Portfolio: "Reuters",
    ...overrides,
  })

  // 6 unallotted, so the allotment board has a queue to work through.
  for (let n = 1; n <= 6; n++) {
    await prisma.delegate.create({ data: mkDelegate(n, AppStatus.REGISTERED) })
  }
  await prisma.delegate.create({
    data: mkDelegate(7, AppStatus.WAITLISTED),
  })
  await prisma.delegate.create({
    data: mkDelegate(8, AppStatus.CANCELLED),
  })

  // ALLOTTED, payment PENDING: the "allotted but no link yet" state.
  const allotted = await prisma.delegate.create({ data: mkDelegate(9, AppStatus.ALLOTTED) })
  const p9 = await prisma.portfolio.findFirstOrThrow({
    where: { committeeId: disec.id, status: PortfolioStatus.AVAILABLE },
  })
  await prisma.allotment.create({
    data: { delegateId: allotted.id, committeeId: disec.id, portfolioId: p9.id, allottedBy: "seed" },
  })
  await prisma.portfolio.update({ where: { id: p9.id }, data: { status: PortfolioStatus.ALLOTTED } })
  await prisma.payment.create({
    data: {
      delegateId: allotted.id,
      provider: "upi_qr",
      amountInr: feeFor("STANDARD", false),
      status: PayStatus.PENDING,
    },
  })

  // PAYMENT_SENT with a link: this is what /pay/[token] renders.
  const paying = await prisma.delegate.create({ data: mkDelegate(10, AppStatus.PAYMENT_SENT) })
  const p10 = await prisma.portfolio.findFirstOrThrow({
    where: { committeeId: disec.id, status: PortfolioStatus.AVAILABLE },
  })
  await prisma.allotment.create({
    data: { delegateId: paying.id, committeeId: disec.id, portfolioId: p10.id, allottedBy: "seed" },
  })
  await prisma.portfolio.update({ where: { id: p10.id }, data: { status: PortfolioStatus.ALLOTTED } })
  await prisma.payment.create({
    data: {
      delegateId: paying.id,
      provider: "upi_qr",
      amountInr: feeFor("STANDARD", false),
      status: PayStatus.SENT,
      paymentLink: `/pay/${paying.publicToken}`,
    },
  })

  // CONFIRMED and paid: the check-in desk needs one of these to scan.
  const confirmed = await prisma.delegate.create({
    data: mkDelegate(11, AppStatus.CONFIRMED, { isDtu: true }),
  })
  const p11 = await prisma.portfolio.findFirstOrThrow({
    where: { committeeId: ip.id, status: PortfolioStatus.AVAILABLE },
  })
  await prisma.allotment.create({
    data: { delegateId: confirmed.id, committeeId: ip.id, portfolioId: p11.id, allottedBy: "seed" },
  })
  await prisma.portfolio.update({ where: { id: p11.id }, data: { status: PortfolioStatus.ALLOTTED } })
  await prisma.payment.create({
    data: {
      delegateId: confirmed.id,
      provider: "upi_qr",
      amountInr: feeFor("PRESS", true),
      status: PayStatus.PAID,
      confirmedAt: new Date(),
    },
  })

  // UNHRC double delegation: its own allotment branch and its own emails.
  const primary = await prisma.delegate.create({
    data: {
      ...mkDelegate(12, AppStatus.REGISTERED, {
        pref1CommitteeId: unhrc.id,
        pref1Portfolio: "Germany",
        pref2CommitteeId: null,
        pref2Portfolio: null,
      }),
      coDelegate: {
        create: {
          fullName: "Test Co-delegate",
          email: addr("codelegate"),
          phone: "919000000912",
          institution: "Institution 12",
        },
      },
    },
  })
  console.log(`  double-delegation primary: ${primary.email}`)

  console.log("Creating quarantined rows…")
  await prisma.quarantinedRow.createMany({
    data: [
      {
        source: Source.CROSS_DEL,
        presetName: "Partner MUN",
        raw: { fullName: "Broken Row", email: "not-an-email", committee: "Unknown Committee" },
        errors: ["email: Invalid email", "committee: did not resolve"],
      },
      {
        source: Source.CROSS_DEL,
        presetName: "Partner MUN",
        raw: { fullName: "", email: addr("quarantine2"), committee: "UNGA-DISEC" },
        errors: ["fullName: Required"],
      },
    ],
  })

  console.log("Creating blog posts…")
  const admin = await prisma.user.findFirstOrThrow({ where: { role: Role.ADMIN } })
  const body = (text: string) => ({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  })
  const posts: Array<[PostStatus, string, string | null]> = [
    [PostStatus.PUBLISHED, "Notes from the floor", null],
    [PostStatus.PENDING, "A draft awaiting review", null],
    [PostStatus.CHANGES_REQUESTED, "Needs a tighter intro", "Tighten the opening two paragraphs."],
    [PostStatus.REJECTED, "Not running this one", "Off-topic for the dispatch."],
    [PostStatus.DRAFT, "Untitled draft", null],
  ]
  for (const [status, title, reviewNote] of posts) {
    await prisma.post.create({
      data: {
        authorId: admin.id,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
        contentJson: body(`Staging fixture for the ${status} state.`),
        status,
        reviewNote,
        readMin: 3,
        tags: ["staging"],
        submittedAt: status === PostStatus.DRAFT ? null : new Date(),
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      },
    })
  }

  console.log("Creating a quiz…")
  const presentation = await prisma.presentation.create({
    data: { ownerId: admin.id, title: "Staging quiz", mode: QuizMode.QUIZ },
  })
  await prisma.slide.createMany({
    data: [
      {
        presentationId: presentation.id,
        order: 0,
        type: SlideType.MCQ,
        prompt: "Which body can authorise the use of force?",
        config: {
          options: ["General Assembly", "Security Council", "ECOSOC", "Secretariat"],
          correct: [1],
          timerSeconds: 20,
        },
      },
      {
        presentationId: presentation.id,
        order: 1,
        type: SlideType.WORDCLOUD,
        prompt: "One word for this committee so far",
        config: { maxWords: 3 },
      },
    ],
  })

  const counts = {
    delegates: await prisma.delegate.count(),
    portfolios: await prisma.portfolio.count(),
    allotments: await prisma.allotment.count(),
    payments: await prisma.payment.count(),
    posts: await prisma.post.count(),
    quarantined: await prisma.quarantinedRow.count(),
  }
  console.log("\nStaging seed complete:", counts)
  console.log(`Admin sign-in: ${admin.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
