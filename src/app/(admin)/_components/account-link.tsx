import Link from "next/link"
import { KeyRound } from "lucide-react"
import { t } from "@/content/strings"

// Sits next to SignOutButton wherever that appears. Without an entry point
// /account is unreachable, and an invited staffer has no other way to ever
// get a password.
export function AccountLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/account"
      title={t("account.navLabel")}
      className={
        compact
          ? "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          : "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      }
    >
      <KeyRound className="size-4" />
      {!compact && <span className="hidden sm:inline">{t("account.navLabel")}</span>}
    </Link>
  )
}
