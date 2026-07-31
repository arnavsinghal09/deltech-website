ALTER TABLE "Portfolio"
ADD COLUMN "holdToken" TEXT,
ADD COLUMN "holdExpiresAt" TIMESTAMP(3);

CREATE INDEX "Portfolio_holdExpiresAt_idx" ON "Portfolio"("holdExpiresAt");

UPDATE "Portfolio"
SET "status" = 'AVAILABLE'
WHERE "status" = 'ON_HOLD';
