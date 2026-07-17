import Link from "next/link";
import { t } from "@/content/strings";
import { SignInForm } from "./_components/sign-in-form";

export default async function SignInPage(props: {
  searchParams: Promise<{ created?: string; callbackUrl?: string }>;
}) {
  const { created } = await props.searchParams;

  return (
    <div className="paper-grid flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="display text-3xl text-foreground">
            {t("brand.name")}
          </Link>
          <p className="eyebrow mt-3">Delegate sign-in</p>
        </div>

        {created && (
          <div className="mb-4 rounded-md border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
            Account created! Sign in with your email and password below.
          </div>
        )}

        <div className="editorial-card p-6 sm:p-8">
          <h1 className="font-heading text-2xl">{t("auth.signInTitle")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We&apos;ll email you a link — no password needed.
          </p>
          <div className="rule mt-5 mb-6" />
          <SignInForm />
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          New delegate?{" "}
          <Link href="/signup" className="text-foreground underline-offset-2 hover:underline">
            {t("auth.signUpLinkText")}
          </Link>
        </p>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Organiser?{" "}
          <Link href="/signin/staff" className="underline-offset-2 hover:text-foreground hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
