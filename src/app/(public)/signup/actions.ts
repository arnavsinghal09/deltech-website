"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { validatePassword } from "@/lib/schemas/password";
import { AuthError } from "next-auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && "code" in err &&
    (err as { code: unknown }).code === "P2002"
  );
}

export async function signupWithPassword(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirmPassword") as string;

  // A missing email used to report "passwordTooShort", so the user was told
  // to fix their password when the actual problem was a blank email field.
  if (!email) return { error: "emailRequired" };
  const invalid = validatePassword(password, confirm);
  if (invalid) return { error: invalid };

  const limit = await rateLimit(RATE_LIMITS.signup, email);
  if (!limit.ok) return { error: "tooManyRequests" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "REGISTERER") return { error: "nonDelegateAccount" };
    return { error: "accountExists" };
  }

  const passwordHash = await hashPassword(password);
  try {
    await prisma.user.create({
      data: { email, role: "REGISTERER", passwordHash },
    });
  } catch (err) {
    // The findUnique above is only for the friendly message; hashing takes
    // ~100ms, which is a wide enough window for a double submit to slip two
    // creates past it. The unique constraint is the real guard.
    if (isUniqueViolation(err)) return { error: "accountExists" };
    throw err;
  }

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
    // Already a registerer, so just resend the link so they can sign in.
  } else {
    try {
      await prisma.user.create({ data: { email, role: "REGISTERER" } });
    } catch (err) {
      // Lost a race with a concurrent signup for the same address. The row we
      // wanted now exists, which is all this step needed, so carry on.
      if (!isUniqueViolation(err)) throw err;
    }
  }

  try {
    // /go dispatches by role, a new REGISTERER lands on /dashboard.
    await signIn("resend", { email, redirectTo: "/go" });
    return {};
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    if (err instanceof AuthError) return { error: "errorDefault" };
    return { error: "errorDefault" };
  }
}
