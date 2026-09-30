#!/usr/bin/env node
/**
 * Export cookable home-* recipes (+ RECIPE_SOURCES merge) for ingredient audits.
 * Writes /tmp/home-recipes.json, /tmp/shelf.json, /tmp/zh-food.json
 */
import { writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"

const require = createRequire(import.meta.url)

// Load via the project's TS test loader path pattern by dynamic import after register.
await import("./fridge-test-loader.mjs")

const { MORE } = await import("../src/lib/more-dishes.ts")
const { EXTRA } = await import("../src/lib/extra-dishes.ts")
const { RECIPE_SOURCES } = await import("../src/lib/recipe-sources.ts")
const { SHELF } = await import("../src/lib/shelf.ts")
const { ZH_FOOD } = await import("../src/lib/zh.ts")

const FILE_HINT = {
  "more-dishes.ts": "src/lib/more-dishes.ts",
}

function guessFile(id) {
  // Best-effort; apply scripts also scan src/lib/more-dishes*.ts by id.
  return "src/lib/more-dishes.ts"
}

const home = [...MORE, ...EXTRA]
  .filter((r) => String(r.id || "").startsWith("home-"))
  .map((r) => {
    const src = RECIPE_SOURCES[r.id]
    return {
      id: r.id,
      name: r.name,
      zh: r.zh?.name || "",
      cuisine: r.cuisine,
      need: r.need || [],
      optional: r.optional || [],
      steps: r.steps || [],
      sourceUrl: r.sourceUrl || src?.url || null,
      sourceName: r.sourceName || src?.name || null,
      file: guessFile(r.id),
    }
  })

writeFileSync("/tmp/home-recipes.json", JSON.stringify(home, null, 2))
writeFileSync("/tmp/shelf.json", JSON.stringify(SHELF, null, 2))
writeFileSync("/tmp/zh-food.json", JSON.stringify(ZH_FOOD, null, 2))
console.log(`exported home=${home.length} shelf=${SHELF.length} withUrl=${home.filter((r) => r.sourceUrl).length}`)
