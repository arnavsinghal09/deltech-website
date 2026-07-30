export function deserializeSettingValue(value: unknown): unknown {
  if (typeof value !== "string") return value

  const trimmed = value.trim()
  if (!trimmed) return undefined

  try {
    return JSON.parse(trimmed)
  } catch {
    // Prisma returns JSON string scalars without their JSON quotes. They are
    // already decoded values, not corrupt JSON.
    return value
  }
}
