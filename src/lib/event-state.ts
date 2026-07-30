import type { Content } from "@/content/contentSchema"

export function deriveEventState(content: Content) {
  const isSociety = content.eventMode === "SOCIETY"
  const isIntra = content.eventMode === "INTRA_MUN"
  const isConference = content.eventMode === "CONFERENCE"

  return {
    isSociety,
    isIntra,
    isConference,
    showEventHero:
      !isSociety &&
      content.publicSections.activeEvent &&
      content.activeEventName.trim().length > 0,
    acceptsRegistrations: !isSociety && content.registrationOpen,
    paymentsRequired: isConference && content.paymentsEnabled,
  }
}
