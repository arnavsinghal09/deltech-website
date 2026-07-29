-- Speed scoring used the participant's own clock (a `submittedAt` field in the
-- request body), so posting 0 always scored full marks. The server now needs
-- to know when the current slide went live.
ALTER TABLE "QuizSession" ADD COLUMN "currentSlideStartedAt" TIMESTAMP(3);

-- Nothing was rate limited: sign-in, magic-link requests, signup, registration
-- and the quiz endpoints were all unthrottled. DB-backed because serverless
-- instances do not share memory.
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimit_windowStart_idx" ON "RateLimit"("windowStart");
