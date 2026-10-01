import { writeFileSync } from "node:fs"
import { MORE } from "../src/lib/more-dishes.ts"
import { MORE_W6A } from "../src/lib/more-dishes-w6a.ts"
import { MORE_W6B } from "../src/lib/more-dishes-w6b.ts"
import { MORE_W6CD } from "../src/lib/more-dishes-w6cd.ts"
import { MORE_W6EFGH } from "../src/lib/more-dishes-w6efgh.ts"
import { MORE_W6X } from "../src/lib/more-dishes-w6x.ts"
import { RECIPE_SOURCES } from "../src/lib/recipe-sources.ts"

const waves = [
  ["6A Indian / South Asian", MORE_W6A],
  ["6B SEA hawker", MORE_W6B],
  ["6C/D Japanese + Korean depth", MORE_W6CD],
  ["6E–H tong sui / soups / new proteins", MORE_W6EFGH],
  ["6X expansion fill (BBC classics across thin cuisines)", MORE_W6X],
]
const newDishes = [...MORE_W6A, ...MORE_W6B, ...MORE_W6CD, ...MORE_W6EFGH, ...MORE_W6X]
const byC = {}
for (const r of newDishes) byC[r.cuisine] = (byC[r.cuisine] || 0) + 1

const cuisineRows = Object.entries(byC)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join("\n")
const waveRows = waves.map(([n, a]) => `| ${n} | ${a.length} |`).join("\n")

const md = `---
cursor:
  subagentId: "bc-7996becd-07dc-5f6a-886a-75517e3c7c5a"
---

# Cuisine waves shipped (P2e)

**Repo:** [ivanmang/fridge-ai](https://github.com/ivanmang/fridge-ai) · push to \`main\` only  
**Book size after this pass:** **${MORE.length}** cookable \`home-*\`  
**New this pass:** **${newDishes.length}** dishes (exclusive / title-matched sources + full \`materials\` from source pages)

## Per-wave counts

| Wave | n |
|---|---:|
${waveRows}
| **Total new** | **${newDishes.length}** |

## New cuisine mix

| Cuisine | n |
|---|---:|
${cuisineRows}

## Quality bar applied

- Direct \`sourceUrl\` only (BBC Food / The Woks of Life); title-matched against page title
- Full inline \`materials\` (groups + amounts) mapped to shelf-canonical names
- Shelf expanded (~25 foods) + ZH_FOOD / ZH_CUISINE (Indian, Malaysian, Indonesian, Singaporean)
- Source-page photos only; BBC placeholder og images rejected

## Skips

- BBC pages with placeholder-only og:image (24) — no allowed source-page photo
- Title-mismatch sources (bibimbap URL wrong dish; chicken miso ramen; bánh xèo)
- Too-few-cores / unmapped specialty ingredients (water spinach guide, lobster, chia pudding, onion bhaji, lamb chops thin list)
- ID collision skip: \`home-teriyaki-salmon\` (kept existing Woks dish)

## Modules

\`src/lib/more-dishes-w6a.ts\` · \`w6b.ts\` · \`w6cd.ts\` · \`w6efgh.ts\` · \`w6x.ts\`  
Builder: \`scripts/build-cuisine-wave.mjs\`
`

writeFileSync("/cursor/stores/self/docs/cuisine-waves-shipped.md", md)

const rows = MORE.map((r) => {
  const src = r.sourceUrl || RECIPE_SOURCES[r.id]?.url || ""
  let host = ""
  try {
    if (src) host = new URL(src).hostname.replace(/^www\./, "")
  } catch {
    /* ignore */
  }
  return `| \`${r.id}\` | ${r.name} | ${r.zh?.name || ""} | ${r.cuisine} | ${r.time} | ${host} |`
}).join("\n")

const list = `# Fridge AI — Cookable recipe list

**Book size:** **${MORE.length}** \`home-*\` dishes on \`main\` (post cuisine-wave P2e)  
**Related:** [cuisine-waves-shipped.md](./cuisine-waves-shipped.md) · [recipe-expansion-suggestions.md](./recipe-expansion-suggestions.md)

| id | EN | ZH | cuisine | min | source host |
|---|---|---|---|---:|---|
${rows}
`
writeFileSync("/cursor/stores/self/docs/cookable-recipe-list.md", list)
console.log("docs written", newDishes.length, MORE.length)
