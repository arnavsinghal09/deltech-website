// Pure decision helpers for account lifecycle. Kept free of Prisma and of
// next-auth so scripts/check-user-admin.ts can assert them directly.

// How long a signed-in session may keep using the role baked into its JWT
// before the row is re-read. Bounds how long a demoted, disabled or deleted
// account stays usable.
export const SESSION_REVALIDATE_MS = 60_000

// A token with no checkedAt predates this feature (or was just minted by an
// older deploy), so it must be re-checked rather than trusted.
export function sessionNeedsRefresh(checkedAt: unknown, now: number): boolean {
  if (typeof checkedAt !== "number" || !Number.isFinite(checkedAt)) return true
  if (checkedAt > now) return true // clock skew or a forged future stamp
  return now - checkedAt >= SESSION_REVALIDATE_MS
}

// Post.authorId is ON DELETE RESTRICT and non-nullable, and Presentation.ownerId
// has no FK at all, so it would silently orphan. Refuse the hard delete in both
// cases and point at disable, which revokes access without losing the content.
// Returns null when the delete is safe.
export function deleteBlockReason(posts: number, presentations: number): string | null {
  const owns = [
    posts > 0 ? `${posts} blog post${posts === 1 ? "" : "s"}` : null,
    presentations > 0 ? `${presentations} quiz${presentations === 1 ? "" : "zes"}` : null,
  ].filter(Boolean)

  if (owns.length === 0) return null
  return `Can't delete: this account owns ${owns.join(" and ")}. Disable it instead to revoke access without losing that content.`
}
