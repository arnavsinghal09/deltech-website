// Smallest runnable check for the intake normalizers: npx tsx scripts/check-intake.ts
import assert from "node:assert"
import { normalizeEmail, normalizePhone, normalizeName, matchCommittee } from "../src/lib/intake"

assert.equal(normalizeEmail(" Ritu.Sharma@GMIAL.com "), "ritu.sharma@gmail.com")
assert.equal(normalizeEmail("a b@yahooo.co.in"), "ab@yahoo.co.in")

assert.equal(normalizePhone("+91-98765 43210"), "919876543210")
assert.equal(normalizePhone("09876543210"), "919876543210")
assert.equal(normalizePhone("9876543210"), "919876543210")
assert.equal(normalizePhone("919876543210"), "919876543210")
assert.equal(normalizePhone("same as above"), undefined)
assert.equal(normalizePhone("N/A"), undefined)
assert.equal(normalizePhone("12345"), undefined)

assert.equal(normalizeName("  RITU   SHARMA "), "Ritu Sharma")
assert.equal(normalizeName("Dr. anita verma"), "Anita Verma")
assert.equal(normalizeName("md. arshad"), "Md. Arshad")

const committees = [
  { id: "1", name: "UNGA-DISEC", slug: "unga-disec", aliases: ["DISEC", "GA1"] },
  { id: "2", name: "Lok Sabha", slug: "lok-sabha", aliases: [] },
]
assert.equal(matchCommittee("unga-disec", committees)?.id, "1")
assert.equal(matchCommittee("disec", committees)?.id, "1")
assert.equal(matchCommittee("GA1 ", committees)?.id, "1")
assert.equal(matchCommittee("LOK SABHA", committees)?.id, "2")
assert.equal(matchCommittee("UNSC", committees), undefined)

console.log("intake normalizer checks passed")
