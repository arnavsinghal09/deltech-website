// Runnable check for role-aware landing: npx tsx scripts/check-nav.ts
import assert from "node:assert"
import { roleHome, safeLanding } from "../src/lib/nav"

// ── roleHome ─────────────────────────────────────────────────────────────────
assert.equal(roleHome("ADMIN"), "/admin")
assert.equal(roleHome("MAINTAINER"), "/admin")
assert.equal(roleHome("AUTHOR"), "/write")
assert.equal(roleHome("REGISTERER"), "/dashboard")
assert.equal(roleHome(undefined), "/")
assert.equal(roleHome("NONSENSE"), "/")

// ── safeLanding: open-redirect rejection → role home ─────────────────────────
assert.equal(safeLanding("//evil.com", "ADMIN"), "/admin")
assert.equal(safeLanding("https://evil.com", "ADMIN"), "/admin")
assert.equal(safeLanding("http://evil.com", "REGISTERER"), "/dashboard")
assert.equal(safeLanding("/\\evil.com", "ADMIN"), "/admin")
assert.equal(safeLanding("evil.com", "ADMIN"), "/admin") // no leading slash
assert.equal(safeLanding(null, "AUTHOR"), "/write")
assert.equal(safeLanding("", "REGISTERER"), "/dashboard")

// ── safeLanding: honor same-origin path when the role may access it ──────────
assert.equal(safeLanding("/admin", "ADMIN"), "/admin")
assert.equal(safeLanding("/admin/users", "MAINTAINER"), "/admin/users")
assert.equal(safeLanding("/blog", "REGISTERER"), "/blog") // public path, anyone
assert.equal(safeLanding("/write/new", "AUTHOR"), "/write/new")
assert.equal(safeLanding("/dashboard", "REGISTERER"), "/dashboard")

// ── safeLanding: downgrade when the role can't access the target (no loop) ───
assert.equal(safeLanding("/admin", "REGISTERER"), "/dashboard")
assert.equal(safeLanding("/write", "REGISTERER"), "/dashboard")
assert.equal(safeLanding("/dashboard", "ADMIN"), "/admin") // staff never land on /dashboard
assert.equal(safeLanding("/write", "MAINTAINER"), "/write") // staff may author

// ── safeLanding: absolute same-origin URLs (what NextAuth's bounce emits) ────
const ORIGIN = "https://app.example.com"
assert.equal(safeLanding("https://app.example.com/admin", "ADMIN", ORIGIN), "/admin")
assert.equal(safeLanding("https://app.example.com/admin/users?tab=1", "ADMIN", ORIGIN), "/admin/users?tab=1")
assert.equal(safeLanding("https://app.example.com/blog#top", "REGISTERER", ORIGIN), "/blog#top")
// same-origin but role can't reach it → downgrade, not bounce
assert.equal(safeLanding("https://app.example.com/admin", "REGISTERER", ORIGIN), "/dashboard")
// Foreign origin → role home, never off-site. These use a public path + a role
// whose home differs from it, so a leaked-through value can't masquerade as a
// correct downgrade.
assert.equal(safeLanding("https://evil.com/blog", "REGISTERER", ORIGIN), "/dashboard")
assert.equal(safeLanding("https://app.example.com.evil.com/blog", "REGISTERER", ORIGIN), "/dashboard") // suffix trick
assert.equal(safeLanding("https://evil.com/?x=https://app.example.com/blog", "REGISTERER", ORIGIN), "/dashboard")
assert.equal(safeLanding("http://app.example.com/blog", "REGISTERER", ORIGIN), "/dashboard") // scheme mismatch
// absolute URL with no origin supplied → cannot verify, so refuse
assert.equal(safeLanding("https://app.example.com/admin", "ADMIN"), "/admin")
assert.equal(safeLanding("https://app.example.com/blog", "REGISTERER"), "/dashboard")
// non-http schemes are never honored
assert.equal(safeLanding("javascript:alert(1)", "ADMIN", ORIGIN), "/admin")
assert.equal(safeLanding("//evil.com", "ADMIN", ORIGIN), "/admin")

console.log("nav checks passed")
