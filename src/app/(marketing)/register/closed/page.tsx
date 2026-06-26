import Link from "next/link";
import { redirect } from "next/navigation";
import { getContent } from "@/lib/settings";
import { t } from "@/content/strings";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function RegistrationClosedPage() {
  const content = await getContent();

  if (content.registrationOpen) redirect("/register");

  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">{t("landing.registrationClosed")}</h1>
      <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
        {content.registrationClosedMessage}
      </p>
      <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-8")}>
        {t("nav.home")}
      </Link>
    </div>
  );
}
