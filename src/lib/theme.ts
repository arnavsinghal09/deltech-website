// Per-area theming.
//
// The bug this fixes: a single next-themes provider wrote `.dark` onto <html>, and
// the only toggle lived in the marketing header, so /admin inherited whatever the
// homepage was set to and had no way to change it.
//
// Each area now persists its own choice in its own cookie and renders the resulting
// class on the SERVER, in its own shell. Because the dark variant in globals.css is
// scope-aware (`.theme-light` opts back out of an outer `.dark`), no client script
// is needed to undo an inherited class, so there is no flash and no hydration
// mismatch: the server already emitted the right markup.
//
// Pure string/constant logic, no next/headers: importable from the edge and from
// client components.

export type ThemeChoice = "light" | "dark"
export type ThemeArea = "site" | "admin" | "recruitment"

// Distinct cookie per area. `theme-site` is also what next-themes uses as its
// storageKey for the marketing site, so the two stay in step.
export const THEME_COOKIES: Record<ThemeArea, string> = {
  site: "theme-site",
  admin: "theme-admin",
  recruitment: "theme-recruitment",
}

// The admin dashboard and the recruitment area default to light; the marketing site
// keeps its existing light default too. Stated explicitly so a missing cookie is
// never ambiguous.
export const DEFAULT_THEME: ThemeChoice = "light"

export function parseTheme(value: string | null | undefined): ThemeChoice {
  return value === "dark" ? "dark" : value === "light" ? "light" : DEFAULT_THEME
}

// The class an area shell renders. `theme-light` is not merely "no class": it has
// to actively override an inherited `.dark` from the marketing toggle.
export function themeClass(theme: ThemeChoice): string {
  return theme === "dark" ? "dark" : "theme-light"
}

export function areaForPath(pathname: string): ThemeArea {
  if (pathname.startsWith("/admin")) return "admin"
  if (pathname.startsWith("/recruitment")) return "recruitment"
  return "site"
}

// One year, so a council member's preference survives a whole recruitment season.
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
