import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { t } from "@/content/strings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function RegisterSuccessPage(props: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t: token } = await props.searchParams
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-4 py-24 text-center">
      <CheckCircle2 className="mb-6 size-16 text-primary" />
      <h1 className="text-3xl font-bold tracking-tight">{t("register.success.title")}</h1>
      <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
        {t("register.success.message")}
      </p>
      {token && (
        <div className="mx-auto mt-8 max-w-md rounded-xl border border-border bg-card p-4 text-left text-sm">
          <p className="font-medium">Track your application any time:</p>
          <Link
            href={`/status/${token}`}
            className="mt-1 block break-all text-primary underline underline-offset-4"
          >
            /status/{token}
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">
            Bookmark this link — it&apos;s private to you.
          </p>
        </div>
      )}
      <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-8")}>
        {t("nav.home")}
      </Link>
    </div>
  )
}
