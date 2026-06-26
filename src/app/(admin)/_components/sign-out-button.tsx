"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { t } from "@/content/strings"

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={() => signOut({ callbackUrl: "/signin" })}
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">{t("nav.signOut")}</span>
    </Button>
  )
}
