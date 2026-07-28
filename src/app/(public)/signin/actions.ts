"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

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

  try {
    await signIn("credentials", { email, password, redirectTo: dispatchTarget(formData) });
    return {};
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    if (err instanceof AuthError) return { error: "invalidCredentials" };
    return { error: "errorDefault" };
  }
}
