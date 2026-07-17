import Link from "next/link";
import { t, STRINGS } from "@/content/strings";
import { SignInForm } from "../_components/sign-in-form";

export const metadata = {
  title: `Secretariat — ${STRINGS.brand.name}`,
};

// The staff door: quieter than the delegate page, password-first.
// Same providers and actions — only the UX differs; role-based routing
// after sign-in is handled by the authorized() callback.
export default function StaffSignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="display text-2xl text-foreground">
            {t("brand.name")}
          </Link>
          <div className="mx-auto mt-4 flex w-24 items-center gap-3">
            <div className="rule-gold flex-1" />
            <span aria-hidden className="text-[9px] text-gold-500">◆</span>
            <div className="rule-gold flex-1" />
          </div>
          <p className="eyebrow mt-4">Secretariat access</p>
        </div>

        <div className="editorial-card p-6 sm:p-8">
          <h1 className="font-heading text-xl">Staff sign-in</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use the email your admin added. Magic link works too if you haven&apos;t
            set a password.
          </p>
          <div className="rule mt-5 mb-6" />
          <SignInForm defaultTab="password" />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Delegate?{" "}
          <Link href="/signin" className="underline-offset-2 hover:text-foreground hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
