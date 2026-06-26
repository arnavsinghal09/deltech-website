import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { t } from "@/content/strings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function RegisterSuccessPage() {
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-4 py-24 text-center">
      <CheckCircle2 className="mb-6 size-16 text-primary" />
      <h1 className="text-3xl font-bold tracking-tight">{t("register.success.title")}</h1>
      <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
        {t("register.success.message")}
      </p>
      <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-8")}>
        {t("nav.home")}
      </Link>
    </div>
  )
}
