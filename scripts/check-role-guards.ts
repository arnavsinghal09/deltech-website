// Locks the ADMIN vs staff authorization matrix for admin server actions so it
// can't silently drift as new actions are added: npx tsx scripts/check-role-guards.ts
//
// Statically parses every "use server" file under src/app/(admin) and maps each
// exported action to the FIRST require*() guard in its body. Asserts:
//   1. no exported admin action is completely unguarded, and
//   2. every money / destructive / role-management action is ADMIN-only.
//
// Findings from the PR8 sweep: the matrix is already consistent — this test
// pins it. Add a new sensitive action → add it to ADMIN_REQUIRED below.
import assert from "node:assert"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const ADMIN_DIR = "src/app/(admin)"

// Actions that must be ADMIN-only (money, destructive, role/user management).
const ADMIN_REQUIRED = new Set([
  // money
  "savePaymentConfig", "createFee", "updateFee", "deleteFee", "markPaidOffline", "compDelegate",
  // destructive
  "deleteCommittee", "deletePortfolio", "deleteImportPreset", "deleteMember",
  "cancelDelegate", "revokeAllotment", "deleteApplicant",
  // role / user management
  "setUserRole", "inviteStaff",
])

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (p.endsWith(".ts")) out.push(p)
  }
  return out
}

// fn name -> "STAFF" | "ADMIN" | "AUTHOR"
function guardsInFile(src: string): Map<string, string> {
  const map = new Map<string, string>()
  const lines = src.split("\n")
  let current: string | null = null
  for (const line of lines) {
    const decl = line.match(/export async function (\w+)/)
    if (decl) {
      current = decl[1]
      continue
    }
    if (!current) continue
    if (/requireAdmin\(/.test(line)) { map.set(current, "ADMIN"); current = null }
    else if (/requireStaff\(/.test(line)) { map.set(current, "STAFF"); current = null }
    else if (/requireAuthor\(/.test(line)) { map.set(current, "AUTHOR"); current = null }
  }
  return map
}

const actionFiles = walk(ADMIN_DIR).filter((f) => readFileSync(f, "utf8").includes('"use server"'))
assert.ok(actionFiles.length > 5, `expected several admin action files, found ${actionFiles.length}`)

const all = new Map<string, string>()
for (const f of actionFiles) {
  const src = readFileSync(f, "utf8")
  const exported = [...src.matchAll(/export async function (\w+)/g)].map((m) => m[1])
  const guards = guardsInFile(src)
  for (const fn of exported) {
    // 1. no unguarded admin action
    assert.ok(guards.has(fn), `${f}: exported action "${fn}" has no require* guard`)
    all.set(fn, guards.get(fn)!)
  }
}

// 2. every sensitive action is ADMIN
for (const fn of ADMIN_REQUIRED) {
  assert.ok(all.has(fn), `expected sensitive action "${fn}" to exist (renamed? update ADMIN_REQUIRED)`)
  assert.equal(all.get(fn), "ADMIN", `"${fn}" must be ADMIN-only, found ${all.get(fn)}`)
}

console.log(`role-guard checks passed (${all.size} admin actions, ${ADMIN_REQUIRED.size} pinned ADMIN)`)
