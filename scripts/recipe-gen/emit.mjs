#!/usr/bin/env node
/** Emit Recipe[] TypeScript from JSON recipe arrays. */
import { readFileSync, writeFileSync } from "node:fs"

const [,, jsonPath, outPath, exportName] = process.argv
if (!jsonPath || !outPath || !exportName) {
  console.error("usage: emit.mjs <in.json> <out.ts> <EXPORT_NAME>")
  process.exit(1)
}
const recipes = JSON.parse(readFileSync(jsonPath, "utf8"))
function esc(s) {
  return JSON.stringify(s)
}
function arr(a) {
  return `[${a.map(esc).join(", ")}]`
}
const body = recipes.map((r) => {
  const steps = r.steps.map((s) => `      ${esc(s)},`).join("\n")
  const zhSteps = r.zh.steps.map((s) => `        ${esc(s)},`).join("\n")
  return `  {
    id: ${esc(r.id)},
    name: ${esc(r.name)},
    cuisine: ${esc(r.cuisine)},
    time: ${r.time},
    servings: ${r.servings},
    need: ${arr(r.need)},
    optional: ${arr(r.optional || [])},
    steps: [
${steps}
    ],
    zh: {
      name: ${esc(r.zh.name)},
      steps: [
${zhSteps}
      ],
    },
  },`
}).join("\n")

const out = `import type { Recipe } from "@/lib/recipes"

/** Auto-built cookable classics — original outlines, searchable names. */
export const ${exportName}: Recipe[] = [
${body}
]
`
writeFileSync(outPath, out)
console.log(`Wrote ${recipes.length} → ${outPath}`)
