"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { AuthError } from "next-auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function signupWithPassword(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!email || !password) return { error: "passwordTooShort" };

  const limit = await rateLimit(RATE_LIMITS.signup, email);
  if (!limit.ok) return { error: "tooManyRequests" };
  if (password.length < 8) return { error: "passwordTooShort" };
  if (password !== confirm) return { error: "passwordMismatch" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "REGISTERER") return { error: "nonDelegateAccount" };
    return { error: "accountExists" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { email, role: "REGISTERER", passwordHash },
  });

  // Redirect to sign-in with a success flag so the user can sign in with
  // their new credentials. (Auto-signin via credentials inside a server action
  // is unreliable in NextAuth v5 beta.)
  redirect("/signin?created=1");
}

export async function signupWithMagicLink(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "errorDefault" };

  const limit = await rateLimit(RATE_LIMITS.magicLink, email);
  if (!limit.ok) return { error: "tooManyRequests" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "REGISTERER") return { error: "nonDelegateAccount" };
    // Already a registerer — just resend the link so they can sign in.
  } else {
    await prisma.user.create({ data: { email, role: "REGISTERER" } });
  }

  try {
    // /go dispatches by role — a new REGISTERER lands on /dashboard.
    await signIn("resend", { email, redirectTo: "/go" });
    return {};
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    if (err instanceof AuthError) return { error: "errorDefault" };
    return { error: "errorDefault" };
  }
}
