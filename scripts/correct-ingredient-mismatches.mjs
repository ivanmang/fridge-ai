#!/usr/bin/env node
/**
 * Correction pass: for exclusive / title-strong dishes, remove need/optional
 * items that are not on the source page (hallucinated cores like cooked rice
 * on avocado toast), and add missing source-mapped registry names.
 *
 * Shared weak-title URLs: only remove blatant carb/protein mismatches when the
 * dish title clearly conflicts (e.g. avocado* + Cooked rice).
 *
 * Reads /tmp/ingredient-audit.json; patches src/lib/more-dishes*.ts
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const AUDIT = JSON.parse(readFileSync("/tmp/ingredient-audit.json", "utf8"))
const ROOT = "src/lib"
const FILES = readdirSync(ROOT)
  .filter((f) => /^more-dishes.*\.ts$/.test(f) || f === "extra-dishes.ts")
  .map((f) => join(ROOT, f))

const STAPLES = new Set([
  "Cooking oil",
  "Sesame oil",
  "Chili oil",
  "Olive oil",
  "Soy sauce",
  "Oyster sauce",
  "Hoisin sauce",
  "Shaoxing wine",
  "Cornstarch",
  "Salt",
  "Sugar",
  "Vinegar",
  "White pepper",
  "Ketchup",
  "Honey",
  "Garlic",
  "Ginger",
  "Spring onion",
  "Onion",
  "Shallot",
  "Baking soda",
  "Five-spice powder",
  "Doubanjiang",
  "Sichuan peppercorns",
  "Dried chili",
  "Chicken stock",
  "Sesame seeds",
  "Peanuts",
  "Flour",
  "Fermented black beans",
  "Cilantro",
])

function uniq(arr) {
  const out = []
  const seen = new Set()
  for (const x of arr) {
    if (!x || seen.has(x)) continue
    seen.add(x)
    out.push(x)
  }
  return out
}

function titleConflictsRice(dish) {
  const id = String(dish.id || "")
  const name = String(dish.name || "").toLowerCase()
  const ricey = /rice|congee|porridge|bibimbap|don|fried rice|risotto|bowl/.test(id + " " + name)
  // avocado toast / avocado egg breakfast (source toast) should never keep cooked rice
  if (/avocado/.test(id) || /avocado/.test(name)) {
    if (!/salmon|poke|sushi|rice/.test(name) && !/salmon|rice/.test(id)) return true
  }
  return !ricey
}

function planFixes(dish) {
  const source = new Set(dish.sourceCanonical || [])
  if (!source.size) return null

  let need = [...(dish.need || [])]
  let optional = [...(dish.optional || [])]
  const removedNeed = []
  const removedOptional = []
  const addedNeed = []
  const addedOptional = []

  const tight = dish.exclusive || dish.titleScore >= 4

  if (tight) {
    need = need.filter((n) => {
      if (source.has(n)) return true
      // keep staples that were in need → move to optional if on source? else drop
      removedNeed.push(n)
      return false
    })
    // Drop optional items not on source only when exclusive (strong sync)
    if (dish.exclusive || dish.titleScore >= 6) {
      optional = optional.filter((n) => {
        if (source.has(n)) return true
        removedOptional.push(n)
        return false
      })
    }
    for (const c of source) {
      if (need.includes(c) || optional.includes(c)) continue
      if (STAPLES.has(c)) {
        optional.push(c)
        addedOptional.push(c)
      } else {
        need.push(c)
        addedNeed.push(c)
      }
    }
  } else {
    // Weak shared URL — only strip blatant avocado+rice style hallucinations
    if (titleConflictsRice(dish) && need.includes("Cooked rice") && !source.has("Cooked rice")) {
      need = need.filter((n) => n !== "Cooked rice")
      removedNeed.push("Cooked rice")
    }
    // Still add staples from source that are clearly pantry
    for (const c of source) {
      if (!STAPLES.has(c)) continue
      if (need.includes(c) || optional.includes(c)) continue
      optional.push(c)
      addedOptional.push(c)
    }
  }

  need = uniq(need)
  optional = uniq(optional.filter((n) => !need.includes(n)))

  if (
    !removedNeed.length &&
    !removedOptional.length &&
    !addedNeed.length &&
    !addedOptional.length &&
    JSON.stringify(need) === JSON.stringify(dish.need) &&
    JSON.stringify(optional) === JSON.stringify(dish.optional)
  ) {
    return null
  }

  return {
    id: dish.id,
    before: { need: dish.need, optional: dish.optional },
    after: { need, optional },
    removedNeed,
    removedOptional,
    addedNeed,
    addedOptional,
    tight,
    titleScore: dish.titleScore,
    exclusive: dish.exclusive,
  }
}

function patchFile(filePath, fixesById) {
  let src = readFileSync(filePath, "utf8")
  let count = 0
  for (const [id, fix] of fixesById) {
    const idRe = new RegExp(`id:\\s*"${id}"`)
    if (!idRe.test(src)) continue
    // Replace the nearest need/optional arrays after this id
    const idx = src.search(idRe)
    if (idx < 0) continue
    const windowEnd = Math.min(src.length, idx + 1200)
    const slice = src.slice(idx, windowEnd)
    const needMatch = slice.match(/need:\s*\[([\s\S]*?)\],/)
    const optMatch = slice.match(/optional:\s*\[([\s\S]*?)\],/)
    if (!needMatch || !optMatch) continue

    const fmt = (arr) =>
      arr.length === 0 ? "[]" : `[${arr.map((n) => JSON.stringify(n)).join(", ")}]`

    let replaced = slice
      .replace(needMatch[0], `need: ${fmt(fix.after.need)},`)
      .replace(optMatch[0], `optional: ${fmt(fix.after.optional)},`)
    src = src.slice(0, idx) + replaced + src.slice(windowEnd)
    count += 1
  }
  if (count) writeFileSync(filePath, src)
  return count
}

const fixes = []
for (const dish of AUDIT.dishes || []) {
  const fix = planFixes(dish)
  if (fix) fixes.push(fix)
}

const byId = new Map(fixes.map((f) => [f.id, f]))
let patched = 0
for (const file of FILES) patched += patchFile(file, byId)

writeFileSync("/tmp/ingredient-corrections.json", JSON.stringify({ count: fixes.length, patched, fixes }, null, 2))
console.log(JSON.stringify({ planned: fixes.length, patchedFilesTouches: patched, sample: fixes.slice(0, 8) }, null, 2))
