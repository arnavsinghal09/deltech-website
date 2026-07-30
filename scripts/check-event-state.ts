#!/usr/bin/env tsx
import assert from "node:assert"
import { ContentSchema } from "../src/content/contentSchema"
import { deriveEventState } from "../src/lib/event-state"

const society = ContentSchema.parse({
  eventMode: "SOCIETY",
  paymentsEnabled: true,
  publicSections: { activeEvent: true },
  activeEventName: "Old event",
})
assert.equal(deriveEventState(society).paymentsRequired, false)
assert.equal(deriveEventState(society).showEventHero, false)
assert.equal(deriveEventState(society).acceptsRegistrations, false)

const intra = ContentSchema.parse({
  eventMode: "INTRA_MUN",
  paymentsEnabled: true,
  publicSections: { activeEvent: true },
  activeEventName: "DTU Intra",
})
assert.equal(deriveEventState(intra).paymentsRequired, false)
assert.equal(deriveEventState(intra).showEventHero, true)

const conference = ContentSchema.parse({
  eventMode: "CONFERENCE",
  paymentsEnabled: true,
  publicSections: { activeEvent: true },
  activeEventName: "DelTech MUN",
})
assert.equal(deriveEventState(conference).paymentsRequired, true)
assert.equal(deriveEventState(conference).showEventHero, true)

console.log("✅ check-event-state passed")
