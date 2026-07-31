// Shared by auth.ts (which sets the provider's maxAge) and resend.ts (which
// tells the recipient how long they have). Kept in its own module so neither
// has to import the other just for a number, and so the email can never
// promise an expiry the provider does not enforce.
export const MAGIC_LINK_MAX_AGE_S = 30 * 60
export const MAGIC_LINK_MAX_AGE_MIN = MAGIC_LINK_MAX_AGE_S / 60
