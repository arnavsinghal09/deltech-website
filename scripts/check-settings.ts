#!/usr/bin/env tsx
import assert from "node:assert"
import { deserializeSettingValue } from "../src/lib/setting-value"

assert.equal(deserializeSettingValue("CONFERENCE"), "CONFERENCE")
assert.equal(deserializeSettingValue('"CONFERENCE"'), "CONFERENCE")
assert.equal(deserializeSettingValue("true"), true)
assert.deepEqual(deserializeSettingValue('{"activeEvent":true}'), { activeEvent: true })
assert.deepEqual(deserializeSettingValue(["Best Delegate"]), ["Best Delegate"])
assert.equal(deserializeSettingValue(""), undefined)

console.log("✅ check-settings passed")
