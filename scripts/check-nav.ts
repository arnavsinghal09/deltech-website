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

console.log("nav checks passed")
