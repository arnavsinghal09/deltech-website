import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { t } from "@/content/strings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getContent } from "@/lib/settings"

export default async function RegisterSuccessPage(props: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t: token } = await props.searchParams
  const content = await getContent()
  const isFreeIntra = content.eventMode === "INTRA_MUN"
  return (
    <div className="noise-wash grid min-h-[calc(100svh-5rem)] place-items-center px-4 py-20 text-center">
      <div className="section-shell">
      <CheckCircle2 className="mx-auto mb-6 size-16 text-primary" />
      <p className="eyebrow">{t("marketing.registrationSuccessEyebrow")}</p>
      <h1 className="display-section mx-auto mt-6 max-w-[10ch]">{t("register.success.title")}</h1>
      <p className="body-large mx-auto mt-6 max-w-2xl text-muted-foreground">
        {isFreeIntra
          ? "Your free Intra MUN registration is in. The secretariat will email your committee and portfolio allotment, no payment is required."
          : t("register.success.message")}
      </p>
      {token && (
        <div className="mx-auto mt-9 max-w-xl border-y border-border bg-card/70 p-6 text-left">
          <p className="data-label text-primary">{t("register.success.trackTitle")}</p>
          <Link
            href={`/status/${token}`}
            className="mt-3 block break-all font-mono text-base font-semibold text-primary underline underline-offset-4"
          >
            /status/{token}
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">{t("register.success.trackNote")}</p>
        </div>
      )}
      <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-9")}>
        {t("nav.home")}
      </Link>
      </div>
    </div>
  )
}
