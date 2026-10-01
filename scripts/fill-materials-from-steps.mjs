#!/usr/bin/env node
/**
 * Last-resort materials for cookable home-* dishes skipped by
 * apply-materials-rewrite (empty-source / no-materials / shared-weak).
 *
 * Policy:
 *  - NEVER copy ingredients from a shared/weak source page.
 *  - NEVER touch inline-materials or preserve-hand dishes.
 *  - NEVER overwrite MATERIALS_SYNC keys already written by the rewrite pass.
 *  - Derive honest materials from the dish's own need/optional + steps,
 *    mapped only onto HK shelf canonical names.
 *  - Prefer need cores; keep optional staples; add step hits only with
 *    careful longest-alias matching (no "Onion" from "spring onion").
 *
 * Reads: /tmp/materials-rewrite-report.json, /tmp/home-recipes.json,
 *        /tmp/shelf.json, /tmp/zh-food.json, src/lib/materials-sync.ts
 * Writes: MATERIALS_SYNC merge + need/optional patches,
 *         /tmp/fill-materials-from-steps.json
 *
 * Env: DRY=1 | LIMIT=0 | ONLY_IDS=
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

const RECIPES = JSON.parse(readFileSync("/tmp/home-recipes.json", "utf8"))
const SHELF = JSON.parse(readFileSync("/tmp/shelf.json", "utf8"))
const ZH_FOOD = JSON.parse(readFileSync("/tmp/zh-food.json", "utf8"))
const REWRITE = JSON.parse(readFileSync("/tmp/materials-rewrite-report.json", "utf8"))
const AUDIT = existsSync("/tmp/ingredient-audit.json")
  ? JSON.parse(readFileSync("/tmp/ingredient-audit.json", "utf8"))
  : null
const SYNC_OUT = "src/lib/materials-sync.ts"
const ROOT = "src/lib"
const DRY = Boolean(process.env.DRY)
const LIMIT = Number(process.env.LIMIT || 0)
const ONLY_IDS = new Set(
  String(process.env.ONLY_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
)

const FILES = readdirSync(ROOT)
  .filter((f) => /^more-dishes.*\.ts$/.test(f) || f === "extra-dishes.ts")
  .map((f) => join(ROOT, f))

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

const DEBT_REASONS = new Set(["empty-source", "no-materials", "shared-weak", "empty-cores-after-map"])

const STAPLES = new Set(
  [
    "Soy sauce",
    "Sesame oil",
    "Cooking oil",
    "Olive oil",
    "Salt",
    "Sugar",
    "Brown sugar",
    "Honey",
    "Vinegar",
    "Rice vinegar",
    "Black vinegar",
    "Shaoxing wine",
    "Cornstarch",
    "White pepper",
    "Black pepper",
    "Ketchup",
    "Hoisin sauce",
    "Oyster sauce",
    "Garlic",
    "Ginger",
    "Spring onion",
    "Onion",
    "Chicken stock",
    "Chili oil",
    "Satay sauce",
  ].map((s) => s.toLowerCase()),
)

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim()
}

function buildAliasIndex() {
  const rows = []
  for (const food of SHELF) {
    const aliases = [food.name, ...(food.aliases || []), ...(ZH_FOOD[food.name] ? [ZH_FOOD[food.name]] : [])]
      .map((a) => String(a || "").trim())
      .filter(Boolean)
    aliases.sort((a, b) => b.length - a.length)
    rows.push({
      name: food.name,
      aliases,
      staple: Boolean(food.staple) || STAPLES.has(food.name.toLowerCase()),
      category: food.category,
    })
  }
  // Longest canonical names first when scanning steps
  rows.sort((a, b) => Math.max(...b.aliases.map((x) => x.length)) - Math.max(...a.aliases.map((x) => x.length)))
  return rows
}

const ALIAS = buildAliasIndex()

function findShelfName(raw) {
  const n = norm(raw)
  if (!n) return null
  let best = null
  for (const row of ALIAS) {
    for (const a of row.aliases) {
      const an = norm(a)
      if (!an) continue
      const score = an === n ? 1000 + an.length : n.includes(an) || an.includes(n) ? 500 + an.length : 0
      if (score > (best?.score || 0)) best = { name: row.name, staple: row.staple, category: row.category, score }
    }
  }
  return best && best.score >= 500 ? best : null
}

/** Scan steps with longest-alias-first + occupied spans (no Onion⊂spring onion). */
function scanSteps(steps) {
  const text = (steps || []).join("\n")
  const lower = text.toLowerCase()
  const occupied = [] // [start,end)
  const overlaps = (a, b) => a < b.end && b.start < a.end
  const mark = (start, end) => occupied.push({ start, end })
  const free = (start, end) => !occupied.some((o) => overlaps({ start, end }, o))
  const found = new Map()

  for (const row of ALIAS) {
    for (const a of row.aliases) {
      if (a.length < 2) continue
      // Skip bare "rice" — always prefer Cooked rice via need/optional
      if (/^rice$/i.test(a) && row.name !== "Cooked rice") continue
      if (/^egg$/i.test(a)) continue // avoid century egg / egg tofu false cores via bare egg
      const isCjk = /[\u4e00-\u9fff]/.test(a)
      if (isCjk) {
        let from = 0
        while (from < text.length) {
          const idx = text.indexOf(a, from)
          if (idx < 0) break
          const end = idx + a.length
          if (free(idx, end)) {
            mark(idx, end)
            found.set(row.name, { name: row.name, staple: row.staple, category: row.category })
            break
          }
          from = idx + 1
        }
      } else {
        const re = new RegExp(`\\b${a.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "gi")
        let m
        while ((m = re.exec(lower))) {
          const start = m.index
          const end = start + m[0].length
          if (free(start, end)) {
            mark(start, end)
            found.set(row.name, { name: row.name, staple: row.staple, category: row.category })
            break
          }
        }
      }
      if (found.has(row.name)) break
    }
  }
  return found
}

function findInlineMaterialsIds() {
  const ids = new Set()
  for (const file of FILES) {
    const src = readFileSync(file, "utf8")
    const re = /id:\s*"([^"]+)"/g
    let m
    while ((m = re.exec(src))) {
      const window = src.slice(m.index, m.index + 1200)
      const nextId = window.search(/\nid:\s*"/)
      const matsAt = window.search(/materials:\s*\[/)
      if (matsAt >= 0 && (nextId < 0 || matsAt < nextId)) ids.add(m[1])
    }
  }
  return ids
}

const INLINE = findInlineMaterialsIds()
const recipeById = new Map(RECIPES.map((r) => [r.id, r]))
const auditById = new Map((AUDIT?.dishes || []).map((d) => [d.id, d]))

function existingSyncKeys() {
  const src = existsSync(SYNC_OUT) ? readFileSync(SYNC_OUT, "utf8") : ""
  return new Set([...src.matchAll(/"([^"]+)":\s*\[/g)].map((m) => m[1]))
}

/** Debt ids from rewrite skip report only. */
function debtIds() {
  const syncKeys = existingSyncKeys()
  const skipped = []
  // Reconstruct from audit using same reasons as rewrite report counts
  for (const d of AUDIT?.dishes || []) {
    if (INLINE.has(d.id) || PRESERVE_HAND.has(d.id)) continue
    if (syncKeys.has(d.id)) continue // already has rewrite overlay
    const empty = !(d.sourceIngredients || []).length
    const noMats = !(d.materials || []).length
    const sharedWeak = (d.sharedWith || 0) > 1 && (d.titleScore || 0) < 6 && !noMats && !empty
    const emptyCores = false
    let reason = null
    if (empty) reason = "empty-source"
    else if (noMats) reason = "no-materials"
    else if (sharedWeak) reason = "shared-weak"
    if (reason && DEBT_REASONS.has(reason)) skipped.push({ id: d.id, reason })
  }
  // Also include empty-cores-after-map from live rewrite report if we stored samples — approximate via audit:
  for (const d of AUDIT?.dishes || []) {
    if (INLINE.has(d.id) || PRESERVE_HAND.has(d.id) || syncKeys.has(d.id)) continue
    if ((d.materials || []).length && (d.exclusive || (d.titleScore || 0) >= 6)) {
      const cores = (d.materials || []).filter((m) => m.role === "core")
      if (!cores.length) skipped.push({ id: d.id, reason: "empty-cores-after-map" })
    }
  }
  return skipped
}

function roleFor(hit, fromNeed) {
  // Garnish / aromatic staples stay soft even when shelf category is veg.
  if (
    hit.staple ||
    STAPLES.has(hit.name.toLowerCase()) ||
    /^(spring onion|onion|garlic|ginger|shallot|cilantro|coriander)$/i.test(hit.name)
  ) {
    return fromNeed ? "core" : "staple"
  }
  if (hit.category === "protein" || hit.category === "veg" || hit.category === "carb" || hit.category === "dairy") {
    return fromNeed ? "core" : "optional"
  }
  return fromNeed ? "core" : "optional"
}

function deriveFor(id, reason) {
  const recipe = recipeById.get(id)
  if (!recipe) return null
  const stepHits = scanSteps(recipe.steps)
  const materials = []
  const seen = new Set()

  const push = (name, role) => {
    const key = name.toLowerCase()
    if (seen.has(key)) return
    // Fold bare rice into cooked rice
    if (name === "Rice") name = "Cooked rice"
    const k2 = name.toLowerCase()
    if (seen.has(k2)) return
    seen.add(k2)
    materials.push({ name, role, group: "main" })
  }

  // 1) need cores
  for (const raw of recipe.need || []) {
    const hit = findShelfName(raw)
    if (!hit) continue
    push(hit.name, "core")
  }

  // 2) step hits — defining plate items only if already in need, else soft;
  //    never promote aromatics/staples to core from steps alone.
  const needNames = new Set(
    (recipe.need || []).map((n) => findShelfName(n)?.name).filter(Boolean),
  )
  for (const hit of stepHits.values()) {
    if (needNames.has(hit.name)) {
      push(hit.name, "core")
      continue
    }
    const defining =
      hit.category === "protein" || hit.category === "veg" || hit.category === "carb" || hit.category === "dairy"
    if (defining && hit.category === "protein") {
      // Don't invent a new protein from a weak step mention
      continue
    }
    // Soft only — need list owns cores for last-resort derive
    push(hit.name, roleFor(hit, false))
  }

  // 3) optional staples / items that appear in steps
  for (const raw of recipe.optional || []) {
    const hit = findShelfName(raw)
    if (!hit) continue
    const inSteps = stepHits.has(hit.name)
    if (inSteps || hit.staple || STAPLES.has(hit.name.toLowerCase())) {
      push(hit.name, hit.staple || STAPLES.has(hit.name.toLowerCase()) ? "staple" : "optional")
    }
  }

  if (!materials.some((m) => m.role === "core")) {
    for (const raw of recipe.need || []) {
      const hit = findShelfName(raw)
      if (!hit) continue
      const key = hit.name.toLowerCase()
      const row = materials.find((m) => m.name.toLowerCase() === key)
      if (row) row.role = "core"
      else {
        seen.add(key)
        materials.unshift({ name: hit.name, role: "core", group: "main" })
      }
    }
  }

  if (!materials.some((m) => m.role === "core")) return null

  return {
    id,
    name: recipe.name,
    zh: recipe.zh,
    reason,
    sourceUrl: recipe.sourceUrl,
    via: "steps+shelf",
    materials,
    need: materials.filter((m) => m.role === "core").map((m) => m.name),
    optional: materials.filter((m) => m.role !== "core").map((m) => m.name),
    before: { need: recipe.need, optional: recipe.optional },
    titleScore: auditById.get(id)?.titleScore ?? null,
    sharedWith: auditById.get(id)?.sharedWith ?? null,
  }
}

let targets = debtIds()
if (ONLY_IDS.size) targets = targets.filter((t) => ONLY_IDS.has(t.id))
if (LIMIT > 0) targets = targets.slice(0, LIMIT)

console.error(
  `fill-from-steps candidates=${targets.length} inline=${INLINE.size} syncKeys=${existingSyncKeys().size} dry=${DRY}`,
)

const derived = []
const failed = []
const byReason = {}
for (const t of targets) {
  byReason[t.reason] = (byReason[t.reason] || 0) + 1
  const row = deriveFor(t.id, t.reason)
  if (row) derived.push(row)
  else failed.push({ id: t.id, reason: t.reason, fail: "no-shelf-cores" })
}

function serializeRow(row) {
  const parts = [`name: ${JSON.stringify(row.name)}`, `role: ${JSON.stringify(row.role)}`]
  if (row.group) parts.push(`group: ${JSON.stringify(row.group)}`)
  if (row.note) parts.push(`note: ${JSON.stringify(row.note)}`)
  return `{ ${parts.join(", ")} }`
}

function patchNeedOptional(byId) {
  let patched = 0
  for (const file of FILES) {
    let src = readFileSync(file, "utf8")
    let count = 0
    for (const [id, fix] of byId) {
      if (INLINE.has(id) || PRESERVE_HAND.has(id)) continue
      const idRe = new RegExp(`id:\\s*"${id}"`)
      const idx = src.search(idRe)
      if (idx < 0) continue
      const windowEnd = Math.min(src.length, idx + 2200)
      const slice = src.slice(idx, windowEnd)
      const matsAt = slice.search(/materials:\s*\[/)
      const needAt = slice.search(/need:\s*\[/)
      if (matsAt >= 0 && (needAt < 0 || matsAt < needAt)) continue
      const needMatch = slice.match(/need:\s*\[([\s\S]*?)\],/)
      const optMatch = slice.match(/optional:\s*\[([\s\S]*?)\],/)
      if (!needMatch || !optMatch) continue
      const fmt = (arr) => (arr.length === 0 ? "[]" : `[${arr.map((n) => JSON.stringify(n)).join(", ")}]`)
      const replaced = slice
        .replace(needMatch[0], `need: ${fmt(fix.need)},`)
        .replace(optMatch[0], `optional: ${fmt(fix.optional)},`)
      if (replaced === slice) continue
      src = src.slice(0, idx) + replaced + src.slice(windowEnd)
      count += 1
    }
    if (count && !DRY) writeFileSync(file, src)
    patched += count
  }
  return patched
}

function mergeSync(derivedRows) {
  let src = existsSync(SYNC_OUT) ? readFileSync(SYNC_OUT, "utf8") : ""
  let added = 0
  let skippedExisting = 0
  for (const row of derivedRows) {
    const re = new RegExp(`  ${JSON.stringify(row.id)}: \\[`, "m")
    if (re.test(src)) {
      skippedExisting += 1
      continue // never overwrite rewrite overlays
    }
    const block = `  ${JSON.stringify(row.id)}: [\n${row.materials.map((m) => `    ${serializeRow(m)},`).join("\n")}\n  ],`
    const closeIdx = src.lastIndexOf("\n}")
    src = src.slice(0, closeIdx) + "\n" + block + src.slice(closeIdx)
    added += 1
  }
  if (!DRY) writeFileSync(SYNC_OUT, src)
  return { added, skippedExisting }
}

const byId = new Map(derived.map((d) => [d.id, d]))
const patched = patchNeedOptional(byId)
const syncStats = mergeSync(derived)

const report = {
  rewriteSkipReasons: REWRITE.skipReasons,
  candidateReasons: byReason,
  candidates: targets.length,
  derived: derived.length,
  failed: failed.length,
  patchedObjects: patched,
  sync: syncStats,
  sampleByReason: {
    "no-materials": derived.filter((d) => d.reason === "no-materials").slice(0, 8),
    "empty-source": derived.filter((d) => d.reason === "empty-source").slice(0, 8),
    "shared-weak": derived.filter((d) => d.reason === "shared-weak").slice(0, 8),
  },
  failedSample: failed.slice(0, 20),
}
writeFileSync("/tmp/fill-materials-from-steps.json", JSON.stringify({ report, derived, failed }, null, 2))
console.log(JSON.stringify(report, null, 2))
