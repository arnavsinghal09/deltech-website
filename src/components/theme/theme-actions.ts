"use server"

import { cookies } from "next/headers"
import {
  THEME_COOKIES,
  THEME_COOKIE_MAX_AGE,
  parseTheme,
  type ThemeArea,
  type ThemeChoice,
} from "@/lib/theme"

// Persist an area's theme server-side. Writing the cookie (rather than
// localStorage) is what lets the shell render the correct class during SSR, which
// is what removes the flash.
export async function setAreaTheme(area: ThemeArea, theme: ThemeChoice): Promise<void> {
  const name = THEME_COOKIES[area]
  if (!name) return

  const store = await cookies()
  store.set(name, parseTheme(theme), {
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: "lax",
    // Readable by next-themes on the marketing site; carries no security meaning.
    httpOnly: false,
  })
}
