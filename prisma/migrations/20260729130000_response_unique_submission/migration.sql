-- Two taps ~50ms apart both cleared the application-level "already submitted"
-- check and scored twice. Deduplicate any rows that bug already produced,
-- keeping the earliest submission per (session, slide, nickname), before the
-- unique index can be created.
DELETE FROM "Response" a
USING "Response" b
WHERE a."nickname" IS NOT NULL
  AND a."sessionId" = b."sessionId"
  AND a."slideId"   = b."slideId"
  AND a."nickname"  = b."nickname"
  AND (a."createdAt", a."id") > (b."createdAt", b."id");

-- CreateIndex
-- NULL nicknames stay distinct in Postgres, so this binds QUIZ mode (where
-- points matter) and leaves anonymous POLL votes unconstrained.
CREATE UNIQUE INDEX "Response_sessionId_slideId_nickname_key" ON "Response"("sessionId", "slideId", "nickname");
