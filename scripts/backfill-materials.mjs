#!/usr/bin/env node
/**
 * Merge exclusive/tight source materials (with amounts when known) into
 * src/lib/materials-sync.ts. Skips dishes that already author `materials`
 * inline, and never overwrites hand-seeded sync entries unless FORCE=1.
 *
 * Reads /tmp/ingredient-audit.json from audit-ingredient-sources.mjs v2.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"

const AUDIT_PATH = "/tmp/ingredient-audit.json"
const OUT = "src/lib/materials-sync.ts"
const FORCE = Boolean(process.env.FORCE)

if (!existsSync(AUDIT_PATH)) {
  console.error("Missing", AUDIT_PATH, "— run export + audit first")
  process.exit(1)
}

const audit = JSON.parse(readFileSync(AUDIT_PATH, "utf8"))
const existingSrc = existsSync(OUT) ? readFileSync(OUT, "utf8") : ""

/** Parse existing MATERIALS_SYNC object keys so we keep hand-seeded entries. */
function existingKeys(src) {
  const keys = new Set()
  for (const m of src.matchAll(/"([^"]+)":\s*\[/g)) keys.add(m[1])
  return keys
}

const keep = existingKeys(existingSrc)
const authored = new Set()
// Dishes that already ship inline materials in more-dishes* (don't overlay).
for (const id of ["home-chicken-steak-rice", "home-xo-chicken-fried-rice"]) authored.add(id)

function serializeRow(row) {
  const UNIT = {
    teaspoon: "tsp",
    teaspoons: "tsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    ounce: "oz",
    ounces: "oz",
    gram: "g",
    grams: "g",
    clove: "clove",
    cloves: "cloves",
    cup: "cup",
    cups: "cups",
    piece: "piece",
    pieces: "piece",
  }
  const decode = (s) =>
    String(s || "")
      .replace(/&#8211;/g, "–")
      .replace(/&#8212;/g, "—")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&#\d+;/g, "")
      .replace(/\s+/g, " ")
      .trim()
  let amount = row.amount
  let unit = row.unit ? UNIT[String(row.unit).toLowerCase()] || String(row.unit).toLowerCase() : undefined
  let note = row.note ? decode(row.note) : undefined
  if (amount != null && unit === "tbsp" && amount > 12) {
    amount = undefined
    unit = undefined
    note = note || "to taste"
  }
  const parts = [`name: ${JSON.stringify(row.name)}`, `role: ${JSON.stringify(row.role)}`]
  if (row.group) parts.push(`group: ${JSON.stringify(row.group)}`)
  if (amount != null && Number.isFinite(amount)) parts.push(`amount: ${amount}`)
  if (unit) parts.push(`unit: ${JSON.stringify(unit)}`)
  if (note) parts.push(`note: ${JSON.stringify(note)}`)
  if (row.zhNote) parts.push(`zhNote: ${JSON.stringify(decode(row.zhNote))}`)
  return `{ ${parts.join(", ")} }`
}

const additions = []
let added = 0
let skippedKeep = 0
let skippedWeak = 0
let amounted = 0

for (const dish of audit.dishes || []) {
  if (!dish.materials?.length) {
    skippedWeak += 1
    continue
  }
  if (authored.has(dish.id)) continue
  if (!dish.exclusive && (dish.titleScore || 0) < 4) {
    skippedWeak += 1
    continue
  }
  // Require at least one parsed amount — amountless exclusive dishes already get
  // deriveMaterials() via enrichRecipe; no need to bloat the sync overlay.
  const hasAmt = dish.materials.some((m) => m.amount != null)
  if (!hasAmt) {
    skippedWeak += 1
    continue
  }
  if (keep.has(dish.id) && !FORCE) {
    skippedKeep += 1
    continue
  }
  const rows = dish.materials.filter((m) => m.name)
  if (!rows.length) continue
  if (hasAmt) amounted += 1
  additions.push(
    `  ${JSON.stringify(dish.id)}: [\n${rows.map((row) => `    ${serializeRow(row)},`).join("\n")}\n  ],`,
  )
  added += 1
}

// Rebuild file: keep hand-seeded block by re-reading TS object via eval-ish is hard;
// instead append new keys after the opening of MATERIALS_SYNC if FORCE is off.
if (!existingSrc.includes("MATERIALS_SYNC")) {
  const body = `import type { RecipeMaterial } from "@/lib/materials"

/**
 * Source-synced / high-traffic materials overlays (groups + amounts).
 * Applied by \`enrichRecipe\` when the recipe has no authored \`materials\`.
 * Prefer exclusive-URL / title-strong dishes; skip shared stand-in dumps.
 *
 * Regenerated / extended by \`scripts/backfill-materials.mjs\` from audit v2.
 */
export const MATERIALS_SYNC: Record<string, RecipeMaterial[]> = {
${additions.join("\n")}
}
`
  writeFileSync(OUT, body)
} else {
  // Insert new entries before the closing `}` of MATERIALS_SYNC.
  const closeIdx = existingSrc.lastIndexOf("\n}")
  if (closeIdx < 0) {
    console.error("Could not find MATERIALS_SYNC closing brace")
    process.exit(1)
  }
  const next =
    existingSrc.slice(0, closeIdx) +
    (additions.length ? "\n" + additions.join("\n") + "\n" : "") +
    existingSrc.slice(closeIdx)
  writeFileSync(OUT, next)
}

console.log(
  JSON.stringify(
    {
      added,
      amounted,
      skippedKeep,
      skippedWeak,
      out: OUT,
    },
    null,
    2,
  ),
)
