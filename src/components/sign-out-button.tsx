"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { t } from "@/content/strings"

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <Button
      variant="ghost"
      size={compact ? "icon" : "sm"}
      className={compact ? "size-8 shrink-0 text-muted-foreground" : "gap-1.5"}
      title={t("nav.signOut")}
      onClick={() => signOut({ callbackUrl: "/signin" })}
    >
      <LogOut className="size-4" />
      {!compact && <span className="hidden sm:inline">{t("nav.signOut")}</span>}
    </Button>
  )
}
