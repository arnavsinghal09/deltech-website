// Role-aware post-auth landing. Pure string logic, no Prisma, no React —
// safe to import from the edge (auth.config.ts / proxy) and from route handlers.

export type Role = "ADMIN" | "MAINTAINER" | "AUTHOR" | "REGISTERER"

// The home surface for each role. Single source of truth — reused by the /go
// dispatch route, the sign-in actions, and the route-group layouts/guards.
export function roleHome(role: string | null | undefined): string {
  switch (role) {
    case "ADMIN":
    case "MAINTAINER":
      return "/admin"
    case "AUTHOR":
      return "/write"
    case "REGISTERER":
      return "/dashboard"
    default:
      return "/"
  }
}

// Can this role reach this path? Mirrors the gates in auth.config.ts `authorized`
// so we never hand someone a landing they'd immediately bounce off (loop guard).
function roleCanAccess(pathname: string, role: string | null | undefined): boolean {
  if (pathname.startsWith("/admin")) return role === "ADMIN" || role === "MAINTAINER"
  if (pathname.startsWith("/write")) return role === "AUTHOR" || role === "ADMIN" || role === "MAINTAINER"
  if (pathname.startsWith("/dashboard")) return role === "REGISTERER"
  return true // public path
}

// Resolve a post-auth destination from an untrusted callbackUrl.
// Only same-origin relative paths are honored; anything else (absolute URL,
// protocol-relative //host, backslash tricks) falls back to the role home.
// If the path is real but this role can't access it, downgrade to role home
// rather than send them somewhere they'll be bounced from.
export function safeLanding(raw: string | null | undefined, role: string | null | undefined): string {
  const home = roleHome(role)
  if (!raw) return home
  // Only a path-absolute reference is same-origin-safe: a single leading slash,
  // not protocol-relative (//host), no backslash tricks. A scheme (https:) can't
  // appear because it can't start with a slash, so these checks are sufficient —
  // new URL("/x", origin) always resolves to the same origin.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return home
  }
  const pathname = raw.split(/[?#]/)[0]
  return roleCanAccess(pathname, role) ? raw : home
}
