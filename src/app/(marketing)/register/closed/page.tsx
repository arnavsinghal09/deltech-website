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
    <div className="noise-wash grid min-h-[calc(100svh-5rem)] place-items-center px-4 py-20">
      <div className="section-shell text-center">
        <p className="eyebrow">{t("marketing.registrationClosedEyebrow")}</p>
        <h1 className="display-section mx-auto mt-6 max-w-[10ch]">{t("marketing.registrationClosedTitle")}</h1>
        <p className="body-large mx-auto mt-7 max-w-2xl text-muted-foreground">{content.registrationClosedMessage}</p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-10")}>
          {t("nav.home")}
        </Link>
      </div>
    </div>
  );
}
