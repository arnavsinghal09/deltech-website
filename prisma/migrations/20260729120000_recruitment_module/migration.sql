-- Recruitment module: cycle-scoped candidates, groups, server-authoritative
-- sessions, append-only evaluations and audit, sheet imports; plus the S3
-- MediaAsset table and the SUB_MAINTAINER role.
--
-- Order matters. The new tables are created and backfilled from Applicant
-- BEFORE Applicant is dropped, so no recruitment history is lost.

-- CreateEnum
CREATE TYPE "CycleState" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'PAUSED', 'FINALISATION', 'COMPLETED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecruitmentRole" AS ENUM ('JC', 'MAINTAINER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CandidateStage" AS ENUM ('INTAKE', 'GD_PENDING', 'GD_ACTIVE', 'GD_COMPLETE', 'GD_BYPASSED', 'PI_PENDING', 'PI_ACTIVE', 'PI_COMPLETE', 'DECISION', 'CLOSED');

-- CreateEnum
CREATE TYPE "CandidateResult" AS ENUM ('PENDING', 'ON_HOLD', 'SELECTED', 'REJECTED', 'WITHDRAWN', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('GD', 'PI');

-- CreateEnum
CREATE TYPE "GroupState" AS ENUM ('DRAFT', 'READY', 'RUNNING', 'DONE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Attendance" AS ENUM ('EXPECTED', 'PRESENT', 'LATE', 'ABSENT', 'REASSIGNED');

-- CreateEnum
CREATE TYPE "SessionState" AS ENUM ('NOT_STARTED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ABORTED');

-- CreateEnum
CREATE TYPE "EvaluationState" AS ENUM ('DRAFT', 'SUBMITTED', 'SUPERSEDED', 'VOIDED');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('ADVANCE', 'HOLD', 'REJECT', 'SELECT', 'RECONSIDER');

-- CreateEnum
CREATE TYPE "AuditOutcome" AS ENUM ('SUCCESS', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportState" AS ENUM ('PENDING', 'APPLIED', 'FAILED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('POST_IMAGE', 'POST_COVER', 'MEMBER_IMAGE', 'CANDIDATE_DOC');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'SIGNED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUB_MAINTAINER';
-- CreateTable
CREATE TABLE "RecruitmentCycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "state" "CycleState" NOT NULL DEFAULT 'DRAFT',
    "config" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "finalisedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentMember" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RecruitmentRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,

    CONSTRAINT "RecruitmentMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentCandidate" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "year" TEXT,
    "branch" TEXT,
    "formAnswers" JSONB,
    "manualEditedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceSheetKey" TEXT,
    "sourceRowKey" TEXT,
    "sourceRowHash" TEXT,
    "importedById" TEXT,
    "importedAt" TIMESTAMP(3),
    "stage" "CandidateStage" NOT NULL DEFAULT 'INTAKE',
    "result" "CandidateResult" NOT NULL DEFAULT 'PENDING',
    "gdRequired" BOOLEAN NOT NULL DEFAULT true,
    "piRequired" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "recruitedUserId" TEXT,
    "recruitedById" TEXT,
    "recruitedAt" TIMESTAMP(3),
    "memberId" TEXT,
    "societyRole" "Role",
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentGroup" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "kind" "SessionKind" NOT NULL,
    "title" TEXT NOT NULL,
    "state" "GroupState" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "kind" "SessionKind" NOT NULL,
    "attendance" "Attendance" NOT NULL DEFAULT 'EXPECTED',
    "joinedAt" TIMESTAMP(3),
    "seat" INTEGER,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentStaffAssignment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" "RecruitmentRole" NOT NULL,
    "canEvaluate" BOOLEAN NOT NULL DEFAULT false,
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentStaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentSession" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "kind" "SessionKind" NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "state" "SessionState" NOT NULL DEFAULT 'NOT_STARTED',
    "version" INTEGER NOT NULL DEFAULT 0,
    "controllerId" TEXT,
    "controlExpiresAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "pausedMs" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "plannedSeconds" INTEGER,
    "startedById" TEXT,
    "endedById" TEXT,
    "abortedById" TEXT,
    "abortReason" TEXT,
    "reopenedFromId" TEXT,
    "reopenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentCandidateLock" (
    "candidateId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentCandidateLock_pkey" PRIMARY KEY ("candidateId")
);

-- CreateTable
CREATE TABLE "RecruitmentEvaluation" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "kind" "SessionKind" NOT NULL,
    "groupId" TEXT,
    "sessionId" TEXT,
    "evaluatorId" TEXT NOT NULL,
    "evaluatorRole" "RecruitmentRole" NOT NULL,
    "scores" JSONB NOT NULL DEFAULT '{}',
    "overall" DOUBLE PRECISION,
    "remarks" TEXT,
    "recommendation" "Recommendation",
    "state" "EvaluationState" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "supersedesId" TEXT,
    "overrideById" TEXT,
    "overrideReason" TEXT,
    "idempotencyKey" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentHandoff" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fromStage" "CandidateStage" NOT NULL,
    "toStage" "CandidateStage" NOT NULL,
    "bypass" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "actorId" TEXT NOT NULL,
    "actorRole" "RecruitmentRole" NOT NULL,
    "sessionId" TEXT,
    "evaluationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "previousState" JSONB,
    "newState" JSONB,
    "reversedById" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reverseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentAuditEvent" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT,
    "eventType" TEXT NOT NULL,
    "candidateId" TEXT,
    "sessionId" TEXT,
    "evaluationId" TEXT,
    "groupId" TEXT,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "actorRole" TEXT,
    "previousState" JSONB,
    "newState" JSONB,
    "reason" TEXT,
    "meta" JSONB,
    "requestId" TEXT,
    "outcome" "AuditOutcome" NOT NULL DEFAULT 'SUCCESS',
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentSheetSource" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sheetUrl" TEXT NOT NULL,
    "csvUrl" TEXT NOT NULL,
    "sheetKey" TEXT NOT NULL,
    "mapping" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentSheetSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentImport" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "state" "ImportState" NOT NULL DEFAULT 'PENDING',
    "rowsTotal" INTEGER NOT NULL DEFAULT 0,
    "rowsCreated" INTEGER NOT NULL DEFAULT 0,
    "rowsUpdated" INTEGER NOT NULL DEFAULT 0,
    "rowsSkipped" INTEGER NOT NULL DEFAULT 0,
    "rowsInvalid" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "importedById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "RecruitmentImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PUBLIC',
    "publicUrl" TEXT,
    "error" TEXT,
    "ownerType" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentCycle_slug_key" ON "RecruitmentCycle"("slug");

-- CreateIndex
CREATE INDEX "RecruitmentCycle_state_idx" ON "RecruitmentCycle"("state");

-- CreateIndex
CREATE INDEX "RecruitmentMember_userId_isActive_idx" ON "RecruitmentMember"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentMember_cycleId_userId_key" ON "RecruitmentMember"("cycleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentCandidate_recruitedUserId_key" ON "RecruitmentCandidate"("recruitedUserId");

-- CreateIndex
CREATE INDEX "RecruitmentCandidate_cycleId_stage_idx" ON "RecruitmentCandidate"("cycleId", "stage");

-- CreateIndex
CREATE INDEX "RecruitmentCandidate_cycleId_result_idx" ON "RecruitmentCandidate"("cycleId", "result");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentCandidate_cycleId_email_key" ON "RecruitmentCandidate"("cycleId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentCandidate_cycleId_sourceSheetKey_sourceRowKey_key" ON "RecruitmentCandidate"("cycleId", "sourceSheetKey", "sourceRowKey");

-- CreateIndex
CREATE INDEX "RecruitmentGroup_cycleId_kind_state_idx" ON "RecruitmentGroup"("cycleId", "kind", "state");

-- CreateIndex
CREATE INDEX "RecruitmentGroupMember_candidateId_idx" ON "RecruitmentGroupMember"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentGroupMember_groupId_candidateId_key" ON "RecruitmentGroupMember"("groupId", "candidateId");

-- CreateIndex
CREATE INDEX "RecruitmentStaffAssignment_memberId_idx" ON "RecruitmentStaffAssignment"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentStaffAssignment_groupId_memberId_key" ON "RecruitmentStaffAssignment"("groupId", "memberId");

-- CreateIndex
CREATE INDEX "RecruitmentSession_cycleId_state_idx" ON "RecruitmentSession"("cycleId", "state");

-- CreateIndex
CREATE INDEX "RecruitmentSession_cycleId_lastActivityAt_idx" ON "RecruitmentSession"("cycleId", "lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentSession_groupId_attempt_key" ON "RecruitmentSession"("groupId", "attempt");

-- CreateIndex
CREATE INDEX "RecruitmentCandidateLock_sessionId_idx" ON "RecruitmentCandidateLock"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentEvaluation_idempotencyKey_key" ON "RecruitmentEvaluation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RecruitmentEvaluation_candidateId_kind_state_idx" ON "RecruitmentEvaluation"("candidateId", "kind", "state");

-- CreateIndex
CREATE INDEX "RecruitmentEvaluation_cycleId_state_idx" ON "RecruitmentEvaluation"("cycleId", "state");

-- CreateIndex
CREATE INDEX "RecruitmentEvaluation_sessionId_evaluatorId_idx" ON "RecruitmentEvaluation"("sessionId", "evaluatorId");

-- CreateIndex
CREATE INDEX "RecruitmentHandoff_candidateId_createdAt_idx" ON "RecruitmentHandoff"("candidateId", "createdAt");

-- CreateIndex
CREATE INDEX "RecruitmentHandoff_cycleId_createdAt_idx" ON "RecruitmentHandoff"("cycleId", "createdAt");

-- CreateIndex
CREATE INDEX "RecruitmentAuditEvent_cycleId_at_idx" ON "RecruitmentAuditEvent"("cycleId", "at");

-- CreateIndex
CREATE INDEX "RecruitmentAuditEvent_candidateId_at_idx" ON "RecruitmentAuditEvent"("candidateId", "at");

-- CreateIndex
CREATE INDEX "RecruitmentAuditEvent_eventType_at_idx" ON "RecruitmentAuditEvent"("eventType", "at");

-- CreateIndex
CREATE INDEX "RecruitmentAuditEvent_outcome_at_idx" ON "RecruitmentAuditEvent"("outcome", "at");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentSheetSource_cycleId_sheetKey_key" ON "RecruitmentSheetSource"("cycleId", "sheetKey");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentImport_idempotencyKey_key" ON "RecruitmentImport"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RecruitmentImport_cycleId_startedAt_idx" ON "RecruitmentImport"("cycleId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");

-- CreateIndex
CREATE INDEX "MediaAsset_status_createdAt_idx" ON "MediaAsset"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_uploaderId_createdAt_idx" ON "MediaAsset"("uploaderId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerType_ownerId_idx" ON "MediaAsset"("ownerType", "ownerId");

-- AddForeignKey
ALTER TABLE "RecruitmentMember" ADD CONSTRAINT "RecruitmentMember_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "RecruitmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentMember" ADD CONSTRAINT "RecruitmentMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentCandidate" ADD CONSTRAINT "RecruitmentCandidate_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "RecruitmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentCandidate" ADD CONSTRAINT "RecruitmentCandidate_recruitedUserId_fkey" FOREIGN KEY ("recruitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentGroup" ADD CONSTRAINT "RecruitmentGroup_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "RecruitmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentGroupMember" ADD CONSTRAINT "RecruitmentGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RecruitmentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentGroupMember" ADD CONSTRAINT "RecruitmentGroupMember_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "RecruitmentCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentStaffAssignment" ADD CONSTRAINT "RecruitmentStaffAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RecruitmentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentStaffAssignment" ADD CONSTRAINT "RecruitmentStaffAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "RecruitmentMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentSession" ADD CONSTRAINT "RecruitmentSession_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "RecruitmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentSession" ADD CONSTRAINT "RecruitmentSession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RecruitmentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentCandidateLock" ADD CONSTRAINT "RecruitmentCandidateLock_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "RecruitmentCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentCandidateLock" ADD CONSTRAINT "RecruitmentCandidateLock_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RecruitmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentEvaluation" ADD CONSTRAINT "RecruitmentEvaluation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "RecruitmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentEvaluation" ADD CONSTRAINT "RecruitmentEvaluation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "RecruitmentCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentEvaluation" ADD CONSTRAINT "RecruitmentEvaluation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RecruitmentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentHandoff" ADD CONSTRAINT "RecruitmentHandoff_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "RecruitmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentHandoff" ADD CONSTRAINT "RecruitmentHandoff_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "RecruitmentCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentAuditEvent" ADD CONSTRAINT "RecruitmentAuditEvent_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "RecruitmentCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentSheetSource" ADD CONSTRAINT "RecruitmentSheetSource_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "RecruitmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentImport" ADD CONSTRAINT "RecruitmentImport_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "RecruitmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentImport" ADD CONSTRAINT "RecruitmentImport_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RecruitmentSheetSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Legacy backfill: fold the old flat Applicant table into an ARCHIVED cycle.
-- Scores become SUBMITTED evaluations attributed to a "legacy" evaluator so the
-- dossier still shows them, with their original verdict mapped to a
-- recommendation. No-op when there were no applicants.
-- ---------------------------------------------------------------------------
DO $legacy$
DECLARE
  cycle_id  CONSTANT TEXT := 'cyc_legacy_intake';
  row_count INT;
BEGIN
  SELECT count(*) INTO row_count FROM "Applicant";
  IF row_count = 0 THEN RETURN; END IF;

  INSERT INTO "RecruitmentCycle"
    (id, name, slug, state, config, version, "createdById", "createdAt", "updatedAt", "closedAt", "finalisedAt")
  VALUES
    (cycle_id, 'Legacy intake', 'legacy-intake', 'ARCHIVED', '{}'::jsonb, 0, 'system', now(), now(), now(), now());

  INSERT INTO "RecruitmentCandidate"
    (id, "cycleId", "fullName", email, phone, year, branch, "formAnswers",
     "manualEditedFields", stage, result, "gdRequired", "piRequired", version,
     "decidedAt", "createdAt", "updatedAt")
  SELECT
    a.id,
    cycle_id,
    a."fullName",
    lower(a.email),
    a.phone,
    a.year,
    a.branch,
    a.answers,
    ARRAY[]::TEXT[],
    CASE
      WHEN a.status IN ('SELECTED', 'REJECTED')                    THEN 'CLOSED'::"CandidateStage"
      WHEN a.status IN ('GD_DONE', 'PI_SCHEDULED', 'PI_DONE')      THEN 'DECISION'::"CandidateStage"
      ELSE                                                              'INTAKE'::"CandidateStage"
    END,
    CASE a.status
      WHEN 'SELECTED' THEN 'SELECTED'::"CandidateResult"
      WHEN 'REJECTED' THEN 'REJECTED'::"CandidateResult"
      ELSE                 'PENDING'::"CandidateResult"
    END,
    TRUE, TRUE, 0,
    CASE WHEN a.status IN ('SELECTED', 'REJECTED') THEN a."createdAt" END,
    a."createdAt",
    now()
  FROM "Applicant" a;

  INSERT INTO "RecruitmentEvaluation"
    (id, "cycleId", "candidateId", kind, "evaluatorId", "evaluatorRole", scores, overall,
     remarks, recommendation, state, version, "submittedAt", "createdAt", "updatedAt")
  SELECT
    'ev_legacy_gd_' || a.id,
    cycle_id,
    a.id,
    'GD'::"SessionKind",
    'legacy',
    'MAINTAINER'::"RecruitmentRole",
    CASE WHEN a."gdScore" IS NULL THEN '{}'::jsonb
         ELSE jsonb_build_object('legacyOverall', a."gdScore") END,
    a."gdScore"::DOUBLE PRECISION,
    'Migrated from the pre-cycle Applicant table.',
    CASE a."gdVerdict"
      WHEN 'SHORTLIST' THEN 'ADVANCE'::"Recommendation"
      WHEN 'REJECT'    THEN 'REJECT'::"Recommendation"
      WHEN 'SELECT'    THEN 'SELECT'::"Recommendation"
    END,
    'SUBMITTED'::"EvaluationState", 1, a."createdAt", a."createdAt", now()
  FROM "Applicant" a
  WHERE a."gdScore" IS NOT NULL OR a."gdVerdict" IS NOT NULL;

  INSERT INTO "RecruitmentEvaluation"
    (id, "cycleId", "candidateId", kind, "evaluatorId", "evaluatorRole", scores, overall,
     remarks, recommendation, state, version, "submittedAt", "createdAt", "updatedAt")
  SELECT
    'ev_legacy_pi_' || a.id,
    cycle_id,
    a.id,
    'PI'::"SessionKind",
    'legacy',
    'MAINTAINER'::"RecruitmentRole",
    CASE WHEN a."piScore" IS NULL THEN '{}'::jsonb
         ELSE jsonb_build_object('legacyOverall', a."piScore") END,
    a."piScore"::DOUBLE PRECISION,
    'Migrated from the pre-cycle Applicant table.',
    CASE a."piVerdict"
      WHEN 'SHORTLIST' THEN 'HOLD'::"Recommendation"
      WHEN 'REJECT'    THEN 'REJECT'::"Recommendation"
      WHEN 'SELECT'    THEN 'SELECT'::"Recommendation"
    END,
    'SUBMITTED'::"EvaluationState", 1, a."createdAt", a."createdAt", now()
  FROM "Applicant" a
  WHERE a."piScore" IS NOT NULL OR a."piVerdict" IS NOT NULL;

  INSERT INTO "RecruitmentAuditEvent"
    (id, "cycleId", "eventType", "actorEmail", "actorRole", "newState", reason, meta, outcome, at)
  VALUES
    ('rae_legacy_migration', cycle_id, 'cycle.migrated', 'system', 'ADMIN',
     jsonb_build_object('state', 'ARCHIVED'),
     'Applicant table folded into an archived cycle by the recruitment_module migration.',
     jsonb_build_object('candidates', row_count), 'SUCCESS', now());

  -- The old sheet URL, if one was configured, becomes a source on the legacy cycle.
  INSERT INTO "RecruitmentSheetSource"
    (id, "cycleId", label, "sheetUrl", "csvUrl", "sheetKey", mapping, "isActive",
     "createdById", "createdAt", "updatedAt")
  SELECT
    'shs_legacy_intake', cycle_id, 'Legacy response sheet',
    trim(both '"' from s.value::TEXT), '', 'legacy:0', '{}'::jsonb, FALSE,
    'system', now(), now()
  FROM "Setting" s
  WHERE s.key = 'recruitmentSheetUrl' AND trim(both '"' from s.value::TEXT) <> '';
END
$legacy$;
-- DropForeignKey
ALTER TABLE "Applicant" DROP CONSTRAINT "Applicant_gdSlotId_fkey";

-- DropForeignKey
ALTER TABLE "Applicant" DROP CONSTRAINT "Applicant_piSlotId_fkey";

-- DropTable
DROP TABLE "Applicant";

-- DropTable
DROP TABLE "InterviewSlot";

-- DropEnum
DROP TYPE "ApplicantStatus";

-- DropEnum
DROP TYPE "InterviewRound";

-- DropEnum
DROP TYPE "Verdict";

-- ---------------------------------------------------------------------------
-- Constraints Prisma schema cannot express.
-- ---------------------------------------------------------------------------

-- At most one non-terminal session per group. Two maintainers racing to start or
-- reopen the same group means one insert fails rather than two live sessions.
CREATE UNIQUE INDEX "RecruitmentSession_one_live_per_group"
  ON "RecruitmentSession" ("groupId")
  WHERE "state" IN ('NOT_STARTED', 'ACTIVE', 'PAUSED');

-- One open evaluation per (session, evaluator, candidate). This is what makes a
-- retried submit a no-op instead of a duplicate score; explicit revisions mark
-- the previous row SUPERSEDED first, which frees the slot.
CREATE UNIQUE INDEX "RecruitmentEvaluation_one_open"
  ON "RecruitmentEvaluation" ("sessionId", "evaluatorId", "candidateId")
  WHERE "state" IN ('DRAFT', 'SUBMITTED');

-- A candidate may hold only one live GD seat and one live PI seat. Reassignment
-- marks the old row REASSIGNED (excluded here), so history is retained rather
-- than deleted and the new seat can be created in the same transaction.
CREATE UNIQUE INDEX "RecruitmentGroupMember_one_active_per_kind"
  ON "RecruitmentGroupMember" ("candidateId", "kind")
  WHERE "attendance" <> 'REASSIGNED';

-- Audit is append-only for everyone, including the application role.
CREATE OR REPLACE FUNCTION "recruitment_audit_append_only"() RETURNS TRIGGER AS $fn$
BEGIN
  RAISE EXCEPTION 'RecruitmentAuditEvent is append-only (attempted %)', TG_OP;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER "RecruitmentAuditEvent_append_only"
  BEFORE UPDATE OR DELETE ON "RecruitmentAuditEvent"
  FOR EACH ROW EXECUTE FUNCTION "recruitment_audit_append_only"();
