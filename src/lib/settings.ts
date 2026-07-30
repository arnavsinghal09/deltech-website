import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { ContentSchema, DEFAULTS, type Content } from "@/content/contentSchema";
import { STRINGS, type Strings, type StringKey } from "@/content/strings";

// ---- Content (conference/marketing copy) ----

export const getContent = cache(async (): Promise<Content> => {
  const rows = await prisma.setting.findMany();
  const fromDb: Record<string, unknown> = {};
  for (const { key, value } of rows) {
    // pg adapter may deserialize jsonb as a string; also guard against corrupt ""
    if (typeof value === "string") {
      try { fromDb[key] = JSON.parse(value); } catch { /* skip; use DEFAULTS fallback */ }
    } else {
      fromDb[key] = value;
    }
  }
  const merged = { ...DEFAULTS, ...fromDb };
  return ContentSchema.parse(merged);
});

export async function getSetting(key: string): Promise<unknown> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setContent(partial: Partial<Record<string, unknown>>): Promise<void> {
  const entries = Object.entries(partial).sort(([a], [b]) => a.localeCompare(b));
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: value as never },
        create: { key, value: value as never },
      }),
    ),
    { isolationLevel: "Serializable" },
  );
}

// ---- Strings (UI microcopy with DB overrides) ----

function setPath(obj: Record<string, unknown>, parts: string[], value: string): void {
  const last = parts[parts.length - 1];
  let cur = obj;
  for (const part of parts.slice(0, -1)) {
    if (typeof cur[part] !== "object" || cur[part] === null) {
      cur[part] = {};
    }
    cur = cur[part] as Record<string, unknown>;
  }
  cur[last] = value;
}

// Returns STRINGS deep-merged with DB overrides. Use in server components / admin panel.
// Client components use t() from @/content/strings (always-available static fallback).
export const getStrings = cache(async (): Promise<Strings> => {
  const overrides = await prisma.stringOverride.findMany();
  if (overrides.length === 0) return STRINGS;
  const result = JSON.parse(JSON.stringify(STRINGS)) as Record<string, unknown>;
  for (const { key, value } of overrides) {
    setPath(result, key.split("."), value);
  }
  return result as Strings;
});

export async function setStringOverride(
  key: StringKey,
  value: string,
): Promise<void> {
  await prisma.stringOverride.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function deleteStringOverride(key: StringKey): Promise<void> {
  await prisma.stringOverride.delete({ where: { key } }).catch(() => {});
}
