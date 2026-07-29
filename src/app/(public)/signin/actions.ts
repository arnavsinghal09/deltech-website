"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Everything lands on /go, the role-aware dispatch route. It resolves the final
// destination from the intended callbackUrl (sanitized) + the user's role —
// so magic-link users don't get stranded on the marketing home.
function dispatchTarget(formData: FormData): string {
  const callbackUrl = (formData.get("callbackUrl") as string | null)?.trim();
  return callbackUrl ? `/go?to=${encodeURIComponent(callbackUrl)}` : "/go";
}

export async function requestMagicLink(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim();
  if (!email) return { error: "errorDefault" };

  // Otherwise anyone can mail-bomb an address and burn the Resend quota.
  const limit = await rateLimit(RATE_LIMITS.magicLink, email);
  if (!limit.ok) return { error: "tooManyRequests" };

  try {
    await signIn("resend", { email, redirectTo: dispatchTarget(formData) });
    return {};
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    if (err instanceof AuthError) return { error: "errorDefault" };
    return { error: "errorDefault" };
  }
}

export async function signInWithPassword(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  if (!email) return { error: "invalidCredentials" };

  // Credential stuffing against an 8-character-minimum password with no
  // lockout. Keyed on the email, so one account under attack cannot lock
  // anyone else out.
  const limit = await rateLimit(RATE_LIMITS.signIn, email);
  if (!limit.ok) return { error: "tooManyRequests" };

  try {
    await signIn("credentials", { email, password, redirectTo: dispatchTarget(formData) });
    return {};
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    if (err instanceof AuthError) return { error: "invalidCredentials" };
    return { error: "errorDefault" };
  }
}
