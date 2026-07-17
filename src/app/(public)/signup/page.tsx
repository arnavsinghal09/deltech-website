import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { t } from "@/content/strings";
import { SignupForm } from "./_components/signup-form";
import Link from "next/link";

export default async function SignupPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="paper-grid flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="display text-3xl text-foreground">
            {t("brand.name")}
          </Link>
          <p className="eyebrow mt-3">Delegate account</p>
        </div>

        <div className="editorial-card p-6 sm:p-8">
          <h1 className="font-heading text-2xl">{t("auth.signUpTitle")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("auth.signUpDescription")}</p>
          <div className="rule mt-5 mb-6" />
          <SignupForm />
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="text-foreground underline-offset-2 hover:underline">
            {t("auth.signInLinkText")}
          </Link>
        </p>
      </div>
    </div>
  );
}
