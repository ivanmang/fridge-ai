#!/usr/bin/env node
/**
 * Rewrite home-* need/optional (+ MATERIALS_SYNC) from source-true audit materials.
 *
 * Policy (post cuisine-wave):
 *  - NEVER touch dishes that already author inline `materials` (wave + hand pilots).
 *  - exclusive URL: rewrite need/optional from source materials.
 *  - shared URL: only if titleScore >= SHARED_TITLE_MIN (default 6).
 *  - Prefer fixing older thin need lists; skip when materialsConfidence is low.
 *  - MATERIALS_SYNC: update exclusive/amounted overlays; preserve hand anchors;
 *    never write sync entries for inline-materials dishes.
 *
 * Reads /tmp/ingredient-audit.json
 * Env: EXCLUSIVE_ONLY=1 | TITLE_MIN / SHARED_TITLE_MIN | FORCE_SYNC=0 | DRY=1
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

const AUDIT_PATH = "/tmp/ingredient-audit.json"
const SYNC_OUT = "src/lib/materials-sync.ts"
const ROOT = "src/lib"
const EXCLUSIVE_ONLY = Boolean(process.env.EXCLUSIVE_ONLY)
const SHARED_TITLE_MIN = Number(process.env.SHARED_TITLE_MIN || process.env.TITLE_MIN || 6)
const FORCE_SYNC = process.env.FORCE_SYNC !== "0"
const DRY = Boolean(process.env.DRY)

if (!existsSync(AUDIT_PATH)) {
  console.error("Missing", AUDIT_PATH)
  process.exit(1)
}

const audit = JSON.parse(readFileSync(AUDIT_PATH, "utf8"))
const FILES = readdirSync(ROOT)
  .filter((f) => /^more-dishes.*\.ts$/.test(f) || f === "extra-dishes.ts")
  .map((f) => join(ROOT, f))

/** Discover dishes that already ship inline materials — never clobber. */
function findInlineMaterialsIds() {
  const ids = new Set()
  for (const file of FILES) {
    const src = readFileSync(file, "utf8")
    const re = /id:\s*"([^"]+)"[\s\S]*?materials:\s*\[/g
    let m
    while ((m = re.exec(src))) {
      // Only count if materials appears before the next id: block roughly
      const after = src.slice(m.index, m.index + 800)
      if (/materials:\s*\[/.test(after.split(/id:\s*"/)[0] + after.match(/materials:\s*\[/)?.[0])) {
        ids.add(m[1])
      }
      // simpler: if materials: appears within 600 chars after this id and before next id
      const window = src.slice(m.index, m.index + 1200)
      const nextId = window.search(/\nid:\s*"/)
      const matsAt = window.search(/materials:\s*\[/)
      if (matsAt >= 0 && (nextId < 0 || matsAt < nextId)) ids.add(m[1])
    }
  }
  return ids
}

const INLINE = findInlineMaterialsIds()
console.log("inline materials protected:", INLINE.size)

function uniq(arr) {
  const out = []
  const seen = new Set()
  for (const x of arr) {
    if (!x || seen.has(x.toLowerCase())) continue
    seen.add(x.toLowerCase())
    out.push(x)
  }
  return out
}

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

function legacyFromMaterials(materials) {
  return {
    need: uniq(materials.filter((m) => m.role === "core").map((m) => m.name)),
    optional: uniq(materials.filter((m) => m.role !== "core").map((m) => m.name)),
  }
}

function shouldRewrite(dish) {
  if (INLINE.has(dish.id)) return false
  if (!(dish.sourceIngredients || []).length) return false
  if (!(dish.materials || []).length) return false
  if (EXCLUSIVE_ONLY && !dish.exclusive) return false
  if (dish.exclusive) return true
  return (dish.titleScore || 0) >= SHARED_TITLE_MIN
}

const PRESERVE_HAND = new Set([
  "home-tomato-egg",
  "home-tomato-egg-rice",
  "home-mapo-tofu",
  "home-garlic-pak-choi",
  "home-steamed-fish",
  "home-sweet-sour-pork",
  "home-steamed-eggs",
  "home-steamed-egg-pork",
  "home-ginger-fried-rice",
  "home-salt-pepper-tofu",
  "home-garlic-eggplant",
  "home-beef-broccoli",
  "home-swiss-chicken-wings",
  "home-baked-pork-chop-rice",
  "home-hk-curry-chicken",
  "home-satay-beef-noodles",
  "home-oyster-gai-lan",
  "home-soy-chicken",
  "home-chicken-broccoli",
  "home-tomato-tofu",
])

const existingSrc = existsSync(SYNC_OUT) ? readFileSync(SYNC_OUT, "utf8") : ""
const syncEntries = new Map()

function extractEntry(src, id) {
  const re = new RegExp(`"${id.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}":\\s*\\[([\\s\\S]*?)\\n  \\],`, "m")
  const m = src.match(re)
  if (!m) return null
  return `  ${JSON.stringify(id)}: [\n${m[1]}\n  ],`
}

for (const id of PRESERVE_HAND) {
  const block = extractEntry(existingSrc, id)
  if (block) syncEntries.set(id, { block, from: "preserve" })
}

const rewrites = []
const skipWeak = []

for (const dish of audit.dishes || []) {
  if (INLINE.has(dish.id) || PRESERVE_HAND.has(dish.id)) {
    skipWeak.push({ id: dish.id, reason: INLINE.has(dish.id) ? "inline-materials" : "preserve-hand" })
    continue
  }
  if (!shouldRewrite(dish)) {
    skipWeak.push({
      id: dish.id,
      reason: !dish.sourceIngredients?.length
        ? "empty-source"
        : !dish.materials?.length
          ? "no-materials"
          : dish.sharedWith > 1
            ? "shared-weak"
            : "title-weak",
      sharedWith: dish.sharedWith,
      titleScore: dish.titleScore,
      confidence: dish.materialsConfidence || "low",
    })
    continue
  }

  const materials = dish.materials.filter((m) => m.name)
  if (!materials.length) continue
  const legacy = legacyFromMaterials(materials)
  if (!legacy.need.length) {
    skipWeak.push({ id: dish.id, reason: "empty-cores-after-map", titleScore: dish.titleScore })
    continue
  }

  // Prefer expanding thin need lists; if already rich (>=4 cores) and source cores
  // shrink below 2 without exclusive, skip.
  const beforeNeed = dish.need || []
  if (!dish.exclusive && beforeNeed.length >= 3 && legacy.need.length < 2) {
    skipWeak.push({ id: dish.id, reason: "would-thin-cores", titleScore: dish.titleScore })
    continue
  }

  rewrites.push({
    id: dish.id,
    exclusive: dish.exclusive,
    titleScore: dish.titleScore,
    confidence: dish.materialsConfidence || (dish.exclusive ? "high" : "medium"),
    sourceUrl: dish.sourceUrl,
    sourceTitle: dish.sourceTitle,
    before: { need: dish.need, optional: dish.optional },
    after: legacy,
    materialsCount: materials.length,
    amounted: materials.filter((m) => m.amount != null).length,
    changedNeed: JSON.stringify(legacy.need) !== JSON.stringify(dish.need || []),
    changedOpt: JSON.stringify(legacy.optional) !== JSON.stringify(dish.optional || []),
    wasThin: beforeNeed.length <= 2,
  })

  const hasAmt = materials.some((m) => m.amount != null)
  if (FORCE_SYNC && (dish.exclusive || hasAmt) && !PRESERVE_HAND.has(dish.id) && !INLINE.has(dish.id)) {
    const rows = materials.map((row) => `    ${serializeRow(row)},`).join("\n")
    syncEntries.set(dish.id, {
      block: `  ${JSON.stringify(dish.id)}: [\n${rows}\n  ],`,
      from: "audit",
    })
  }
}

function patchFile(filePath, byId) {
  let src = readFileSync(filePath, "utf8")
  let count = 0
  for (const [id, fix] of byId) {
    if (INLINE.has(id)) continue
    const idRe = new RegExp(`id:\\s*"${id}"`)
    const idx = src.search(idRe)
    if (idx < 0) continue
    const windowEnd = Math.min(src.length, idx + 2200)
    const slice = src.slice(idx, windowEnd)
    // Skip if this dish block authors materials
    const matsAt = slice.search(/materials:\s*\[/)
    const needAt = slice.search(/need:\s*\[/)
    if (matsAt >= 0 && (needAt < 0 || matsAt < needAt)) continue
    const needMatch = slice.match(/need:\s*\[([\s\S]*?)\],/)
    const optMatch = slice.match(/optional:\s*\[([\s\S]*?)\],/)
    if (!needMatch || !optMatch) continue
    const fmt = (arr) =>
      arr.length === 0 ? "[]" : `[${arr.map((n) => JSON.stringify(n)).join(", ")}]`
    const replaced = slice
      .replace(needMatch[0], `need: ${fmt(fix.after.need)},`)
      .replace(optMatch[0], `optional: ${fmt(fix.after.optional)},`)
    if (replaced === slice) continue
    src = src.slice(0, idx) + replaced + src.slice(windowEnd)
    count += 1
  }
  if (count && !DRY) writeFileSync(filePath, src)
  return count
}

const byId = new Map(rewrites.map((f) => [f.id, f]))
let patched = 0
for (const file of FILES) patched += patchFile(file, byId)

const syncBody = `import type { RecipeMaterial } from "@/lib/materials"

/**
 * Source-synced / high-traffic materials overlays (groups + amounts).
 * Applied by \`enrichRecipe\` when the recipe has no authored \`materials\`.
 * Prefer exclusive-URL / title-strong dishes; skip shared stand-in dumps.
 * Dishes with inline materials (cuisine waves / pilots) are never listed here.
 *
 * Regenerated by \`scripts/apply-materials-rewrite.mjs\` from audit.
 */
export const MATERIALS_SYNC: Record<string, RecipeMaterial[]> = {
${[...syncEntries.values()].map((e) => e.block).join("\n")}
}

/** Confidence for sync overlays — high = exclusive or very strong title match. */
export const MATERIALS_CONFIDENCE: Record<string, "high" | "medium" | "low"> = {
${rewrites
  .filter((r) => syncEntries.has(r.id))
  .map((r) => `  ${JSON.stringify(r.id)}: ${JSON.stringify(r.confidence)},`)
  .join("\n")}
}
`

if (!DRY) writeFileSync(SYNC_OUT, syncBody)

const report = {
  exclusiveOnly: EXCLUSIVE_ONLY,
  sharedTitleMin: SHARED_TITLE_MIN,
  inlineProtected: INLINE.size,
  rewritten: rewrites.length,
  thinFixed: rewrites.filter((r) => r.wasThin).length,
  changedNeed: rewrites.filter((r) => r.changedNeed).length,
  changedOptional: rewrites.filter((r) => r.changedOpt).length,
  patchedObjects: patched,
  syncKeys: syncEntries.size,
  skipped: skipWeak.length,
  skipReasons: skipWeak.reduce((acc, s) => {
    acc[s.reason] = (acc[s.reason] || 0) + 1
    return acc
  }, {}),
  sampleRewrites: rewrites.filter((r) => r.wasThin).slice(0, 12),
  sampleSkippedInline: [...INLINE].slice(0, 12),
}
writeFileSync("/tmp/materials-rewrite-report.json", JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
