"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { t } from "@/content/strings"
import type { ThemeArea, ThemeChoice } from "@/lib/theme"
import { setAreaTheme } from "./theme-actions"

// The toggle for an app area (admin or recruitment). Writes the area's own cookie,
// then refreshes so the server re-renders the shell with the new class.
//
// `initial` comes from the server, so the first paint is already correct: there is
// no reading of localStorage on mount, hence no flash and no hydration mismatch.
// The optimistic local state only keeps the icon responsive while the refresh runs.
export function AreaThemeToggle({ area, initial }: { area: ThemeArea; initial: ThemeChoice }) {
  const router = useRouter()
  const [theme, setTheme] = useState<ThemeChoice>(initial)
  const [pending, startTransition] = useTransition()

  const next: ThemeChoice = theme === "dark" ? "light" : "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t(next === "dark" ? "common.themeDark" : "common.themeLight")}
      disabled={pending}
      onClick={() => {
        setTheme(next)
        startTransition(async () => {
          await setAreaTheme(area, next)
          router.refresh()
        })
      }}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
