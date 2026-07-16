import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { t } from "@/content/strings";
import { SignupForm } from "./_components/signup-form";
import Link from "next/link";

export default async function SignupPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold tracking-tight">{t("brand.name")}</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("auth.signUpTitle")}</CardTitle>
            <CardDescription>{t("auth.signUpDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-foreground underline-offset-2 hover:underline"
          >
            {t("auth.signInLinkText")}
          </Link>
        </p>
      </div>
    </div>
  );
}
