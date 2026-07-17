-- CreateEnum
CREATE TYPE "InterviewRound" AS ENUM ('GD', 'PI');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('SHORTLIST', 'REJECT', 'SELECT');

-- CreateEnum
CREATE TYPE "ApplicantStatus" AS ENUM ('APPLIED', 'GD_SCHEDULED', 'GD_DONE', 'PI_SCHEDULED', 'PI_DONE', 'SELECTED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "AppStatus_new" AS ENUM ('REGISTERED', 'ALLOTTED', 'PAYMENT_SENT', 'CONFIRMED', 'CANCELLED', 'WAITLISTED');
ALTER TABLE "public"."Delegate" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Delegate" ALTER COLUMN "status" TYPE "AppStatus_new" USING ("status"::text::"AppStatus_new");
ALTER TYPE "AppStatus" RENAME TO "AppStatus_old";
ALTER TYPE "AppStatus_new" RENAME TO "AppStatus";
DROP TYPE "public"."AppStatus_old";
ALTER TABLE "Delegate" ALTER COLUMN "status" SET DEFAULT 'REGISTERED';
COMMIT;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MAINTAINER';

-- AlterTable
ALTER TABLE "Committee" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable (hand-edited: publicToken added nullable, backfilled, then NOT NULL —
-- Prisma's uuid() default is client-side and cannot fill existing rows)
ALTER TABLE "Delegate" ADD COLUMN     "pref3CommitteeId" TEXT,
ADD COLUMN     "pref3Portfolio" TEXT,
ADD COLUMN     "publicToken" TEXT;

UPDATE "Delegate" SET "publicToken" = gen_random_uuid()::text WHERE "publicToken" IS NULL;

ALTER TABLE "Delegate" ALTER COLUMN "publicToken" SET NOT NULL;

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "year" TEXT,
    "branch" TEXT,
    "answers" JSONB,
    "status" "ApplicantStatus" NOT NULL DEFAULT 'APPLIED',
    "gdSlotId" TEXT,
    "gdScore" INTEGER,
    "gdVerdict" "Verdict",
    "piSlotId" TEXT,
    "piScore" INTEGER,
    "piVerdict" "Verdict",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSlot" (
    "id" TEXT NOT NULL,
    "round" "InterviewRound" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 8,
    "panel" JSONB,

    CONSTRAINT "InterviewSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "socials" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarantinedRow" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "presetName" TEXT,
    "raw" JSONB NOT NULL,
    "errors" TEXT[],
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuarantinedRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_email_key" ON "Applicant"("email");

-- CreateIndex
CREATE INDEX "AuditLog_at_idx" ON "AuditLog"("at");

-- CreateIndex
CREATE UNIQUE INDEX "Delegate_publicToken_key" ON "Delegate"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "Delegate_email_key" ON "Delegate"("email");

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_gdSlotId_fkey" FOREIGN KEY ("gdSlotId") REFERENCES "InterviewSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_piSlotId_fkey" FOREIGN KEY ("piSlotId") REFERENCES "InterviewSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
