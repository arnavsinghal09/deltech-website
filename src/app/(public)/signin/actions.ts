"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function requestMagicLink(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim();

  try {
    await signIn("resend", { email, redirectTo: "/" });
    // signIn always throws a redirect on success — the return below is unreachable
    return {};
  } catch (err) {
    // Re-throw Next.js redirects so the browser navigates to /signin/sent
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    if (err instanceof AuthError) {
      return { error: "auth.errorDefault" };
    }
    return { error: "auth.errorDefault" };
  }
}
