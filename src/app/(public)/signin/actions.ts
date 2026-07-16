"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function requestMagicLink(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim();

  try {
    // redirectTo "/" lets NextAuth use the callbackUrl from the URL query param
    // (e.g. /signin?callbackUrl=/admin preserves the intended destination).
    await signIn("resend", { email, redirectTo: "/" });
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
    await signIn("credentials", { email, password, redirectTo: "/" });
    return {};
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    if (err instanceof AuthError) return { error: "invalidCredentials" };
    return { error: "errorDefault" };
  }
}
