-- The schema had exactly two non-unique indexes. Each of these serves a query
-- that runs on a page load or on the nightly cron. Tables here are small
-- enough that a plain CREATE INDEX is effectively instant, so no CONCURRENTLY
-- (which Prisma cannot use anyway, since migrations run inside a transaction).

-- Allotment pool (status = REGISTERED) and both check-in counters.
CREATE INDEX "Delegate_status_idx" ON "Delegate"("status");
-- Registrations table default ordering; without it every page of offset
-- pagination sorts the whole table.
CREATE INDEX "Delegate_createdAt_idx" ON "Delegate"("createdAt");
CREATE INDEX "Delegate_status_checkedInAt_idx" ON "Delegate"("status", "checkedInAt");

-- Unindexed FK. delegateId and portfolioId are already unique.
CREATE INDEX "Allotment_committeeId_idx" ON "Allotment"("committeeId");

-- Dashboard revenue aggregate and the reminder cron's candidate filter.
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- Unindexed FK, used by the registrations drawer and, more importantly, by the
-- cron's correlated NOT EXISTS which otherwise scans the whole log nightly.
CREATE INDEX "EmailLog_delegateId_idx" ON "EmailLog"("delegateId");
-- Failed-email card on /admin: a count plus a top-8, on every dashboard load.
CREATE INDEX "EmailLog_status_sentAt_idx" ON "EmailLog"("status", "sentAt");

CREATE INDEX "Portfolio_status_idx" ON "Portfolio"("status");

-- Public blog index, admin review queue, and the dashboard's published count.
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_status_publishedAt_idx" ON "Post"("status", "publishedAt");

-- Unindexed FK plus the ordering every slide query uses.
CREATE INDEX "Slide_presentationId_order_idx" ON "Slide"("presentationId", "order");

-- Unresolved-rows filter on every /admin/import load.
CREATE INDEX "QuarantinedRow_resolvedAt_idx" ON "QuarantinedRow"("resolvedAt");
