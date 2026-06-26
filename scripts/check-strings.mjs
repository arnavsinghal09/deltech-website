#!/usr/bin/env node
// Fails if any .tsx file outside the allowed list contains hardcoded user-visible strings.
//
// Allowed escape: purely decorative / symbol-only content (icons, separators, empty strings).
// Everything else must go through t() from @/content/strings or getContent() from @/lib/settings.

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

// Files / directories that ARE allowed to contain raw strings
const ALLOWED_FILES = new Set([
  "src/content/strings.ts",
  "src/content/contentSchema.ts",
]);
// Directory prefixes that are skipped entirely (shadcn primitives — owned but generated)
const SKIP_DIRS = ["src/components/ui"];

// Attributes where hardcoded English is flagged
const FLAGGED_ATTRS = ["placeholder", "aria-label", "title", "alt"];

// Regex patterns that are violations
const ATTR_RE = new RegExp(
  `\\b(${FLAGGED_ATTRS.join("|")})="([A-Za-z][^"]{2,})"`,
  "g",
);

// JSX text node: >some english text< — must start with letter, multi-word or punctuated
// Excludes TypeScript generics like `>= FieldPath` or `>& VariantProps`
const TEXT_NODE_RE = />([A-Za-z][A-Za-z ]+ [A-Za-z][A-Za-z ,.'!?:–-]{2,})</g;

// Lines that are exempt even if they match the pattern
const EXEMPT_LINE_RE = /\{t\(|strings\.|getContent\(\)|\/\/|STRINGS\[|`|[&|=<>].*[A-Z][a-z]/;

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules" && e.name !== ".next" && e.name !== "generated") {
        files.push(...walk(full));
      }
    } else if (e.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

let violations = 0;

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (ALLOWED_FILES.has(rel)) continue;
  if (SKIP_DIRS.some((d) => rel.startsWith(d))) continue;

  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (EXEMPT_LINE_RE.test(line)) return;

    let m;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(line)) !== null) {
      console.error(`${rel}:${i + 1}  hardcoded ${m[1]}="${m[2]}"`);
      violations++;
    }

    TEXT_NODE_RE.lastIndex = 0;
    while ((m = TEXT_NODE_RE.exec(line)) !== null) {
      const text = m[1].trim();
      // Skip if it looks like a variable, number, or single word that could be a proper noun/tag
      if (/^\d/.test(text)) continue;
      if (text.split(" ").length < 2 && !/[.!?]/.test(text)) continue;
      console.error(`${rel}:${i + 1}  hardcoded text node: "${text}"`);
      violations++;
    }
  });
}

if (violations > 0) {
  console.error(
    `\n❌ ${violations} hardcoded string(s) found. Use t() from @/content/strings or getContent() from @/lib/settings.\n` +
    `   Purely decorative/symbol-only content (icons, separators) is the one allowed escape.\n`,
  );
  process.exit(1);
}

console.log("✅ check:strings passed — no hardcoded literals found.");
