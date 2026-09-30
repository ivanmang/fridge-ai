#!/usr/bin/env node
/**
 * Apply ingredient gaps from /tmp/ingredient-audit.json onto home-* recipes.
 * Uses precise mapping (not fuzzy shelf includes) and only updates:
 *  - exclusive sourceUrl dishes, or
 *  - shared URLs with titleScore >= 4 (or >= 3 when all sharers look related)
 * Staples → optional; unmatched core proteins/veg → need (if not already covered).
 */
import { readFileSync, writeFileSync } from "node:fs"

const AUDIT = JSON.parse(readFileSync("/tmp/ingredient-audit.json", "utf8"))
// reload shelf.ts names after edits via regex
const shelfTs = readFileSync("src/lib/shelf.ts", "utf8")
const SHELF_NAMES = [...shelfTs.matchAll(/"name":\s*"([^"]+)"/g)].map((m) => m[1])
const SHELF_ALIASES = new Map()
for (const m of shelfTs.matchAll(/\{\s*"name":\s*"([^"]+)"\s*,\s*"aliases":\s*\[([\s\S]*?)\]/g)) {
  const name = m[1]
  const aliases = [...m[2].matchAll(/"([^"]*)"/g)].map((x) => x[1])
  SHELF_ALIASES.set(name, aliases)
}

const ZH = JSON.parse(readFileSync("/tmp/zh-food.json", "utf8"))
// merge new ZH from file
const zhTs = readFileSync("src/lib/zh.ts", "utf8")
const zhBlock = zhTs.match(/export const ZH_FOOD[^=]*=\s*\{([\s\S]*?)\n\}/)
if (zhBlock) {
  for (const m of zhBlock[1].matchAll(/(?:"([^"]+)"|([A-Za-z][A-Za-z0-9 -]*))\s*:\s*"([^"]+)"/g)) {
    const key = (m[1] || m[2]).trim()
    ZH[key] = m[3]
  }
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim()
}

function exactShelf(name) {
  const n = norm(name)
  if (!n) return null
  // Prefer exact canonical name matches over aliases.
  for (const foodName of SHELF_NAMES) {
    if (norm(foodName) === n) return foodName
  }
  let best = null
  for (const foodName of SHELF_NAMES) {
    for (const a of SHELF_ALIASES.get(foodName) || []) {
      if (norm(a) === n) {
        const score = norm(a).length
        if (!best || score > best.score) best = { foodName, score }
      }
    }
    if (ZH[foodName] && norm(ZH[foodName]) === n) {
      const score = norm(ZH[foodName]).length + 50
      if (!best || score > best.score) best = { foodName, score }
    }
  }
  return best?.foodName || null
}

/** Map a source ingredient line to a shelf-canonical name, or null to skip. */
function mapIngredient(raw) {
  let s = String(raw || "")
  s = s.replace(/\([^)]*\)/g, " ")
  s = s.replace(/\[[^\]]*\]/g, " ")
  // Strip leading amounts carefully — never eat the "g" in "green beans".
  s = s.replace(
    /^[\d./½¼¾⅓⅔⅛⅜⅝⅞]+(\s*-\s*[\d./½¼¾⅓⅔⅛⅜⅝⅞]+)?\s*(kg|g|grams?|ounces?|oz\.?|lb|lbs|pounds?|cups?|tbsp|tsp|tablespoons?|teaspoons?|ml|l|liters?|litres?|slices?|cloves?|stalks?|pieces?|pcs?|pinch(?:es)?|dashes?|cans?|packs?|packets?|bunches?|heads?)?\s+/i,
    "",
  )
  s = s.replace(/^(large|medium|small|whole)\s+/i, "")
  s = s.replace(/,.*$/, "").replace(/\s+/g, " ").trim()
  // Keep minced/ground meats and cooked rice before adjective stripping.
  if (/^cooked\s+rice\b/i.test(s) || /day[- ]old rice|leftover rice/i.test(s)) return "Cooked rice"
  if (/^(ground|minced)\s+pork\b/i.test(s) || /pork mince/i.test(s)) return "Ground pork"
  if (/^(ground|minced)\s+beef\b/i.test(s) || /beef mince/i.test(s)) return "Ground beef"
  if (/^(ground|minced)\s+chicken\b/i.test(s)) return "Chicken breast"
  s = s.replace(
    /^(fresh|lean|ripe|dried|ground|minced|sliced|chopped|cooked|raw|frozen|extra virgin|low sodium|fluffed and cooled)\s+/i,
    "",
  )
  const n = norm(s)
  if (!n || n === "water" || n.endsWith(" water") || n === "ice") return null

  // explicit rules before shelf (avoid oil→sesame, pepper→bell, chicken broth→breast)
  const rules = [
    [/^(neutral |vegetable |canola |peanut |corn |cooking )?oils?$/, "Cooking oil"],
    [/^sesame oil|麻油|香油$/, "Sesame oil"],
    [/^chili oil|chilli oil|辣椒油$/, "Chili oil"],
    [/^olive oil|橄欖油|橄榄油$/, "Olive oil"],
    [/^(dark |light |regular )?soy( sauce)?$|生抽|老抽|豉油|酱油|醬油$/, "Soy sauce"],
    [/^oyster sauce|蚝油|蠔油$/, "Oyster sauce"],
    [/^shaoxing( wine)?|cooking wine|rice wine|料酒|黄酒$/, "Shaoxing wine"],
    [/^corn\s*starch|potato starch|tapioca starch|生粉|淀粉|澱粉|太白粉$/, "Cornstarch"],
    [/^(sea |kosher |table )?salts?$|盐|鹽$/, "Salt"],
    [/^(brown |white |caster |granulated )?sugars?$|糖|白糖|冰糖$/, "Sugar"],
    [/^white pepper|black pepper|ground (white|black) pepper|胡椒|白胡椒|黑胡椒$/, "White pepper"],
    [/^scallions?|green onions?|spring onions?|葱|蔥|青葱|青蔥$/, "Spring onion"],
    [/^garlic|蒜|蒜头|蒜頭|蒜蓉$/, "Garlic"],
    [/^ginger|姜|薑$/, "Ginger"],
    [/^vinegar|rice vinegar|black vinegar|醋|香醋|米醋|陈醋|陳醋$/, "Vinegar"],
    [/^ketchup|茄汁$/, "Ketchup"],
    [/^honey|蜜糖$/, "Honey"],
    [/^cilantro|coriander|香菜|芫荽$/, "Cilantro"],
    [/^shallots?|乾蔥|红葱头|紅蔥頭$/, "Shallot"],
    [/^baking soda|bicarbonate of soda|baking powder|苏打粉|蘇打粉|泡打粉$/, "Baking soda"],
    [/^five[-\s]?spice( powder)?|五香粉$/, "Five-spice powder"],
    [/^spicy bean sauce|chili bean sauce|doubanjiang|broad bean paste|豆瓣酱|豆瓣醬$/, "Doubanjiang"],
    [/^sichuan peppercorns?|szechuan pepper|花椒|花椒粒$/, "Sichuan peppercorns"],
    [/^dried (red )?chil+e?ys?|red chil+e?ys?|red hot peppers?|thai bird|bird'?s? eye chili|干辣椒|乾辣椒$/, "Dried chili"],
    [/^chicken (stock|broth|bouillon|bouillon powder)|stock|broth|鸡汤|雞湯|鸡粉|雞粉$/, "Chicken stock"],
    [/^water chestnuts?|马蹄|馬蹄$/, "Water chestnuts"],
    [/^sui mi ya cai|ya cai|preserved mustard|碎米芽菜|芽菜$/, "Pickled mustard"],
    [/^tilapia|cod|sea bass|bass|flounder|白鱼|白魚|鲈鱼|鱸魚$/, "White fish"],
    [/^eggs?|egg yolks?|egg whites?|鸡蛋|雞蛋|蛋$/, "Eggs"],
    [/^tomatoes?|番茄|西红柿$/, "Tomato"],
    [/^cooked rice|day old rice|leftover rice|白饭|白飯|冷饭|冷飯$/, "Cooked rice"],
    [/^uncooked .*rice|jasmine rice|raw rice|白米|米$/, "Rice"],
    [/^mung bean vermicelli|bean thread|glass noodles|粉丝|粉絲$/, "Glass noodles"],
    [/^ground pork|minced pork|pork mince|免治猪|免治豬|猪肉末$/, "Ground pork"],
    [/^ground beef|minced beef|beef mince$/, "Ground beef"],
    [/^pork (chops?|loin|shoulder|belly)|猪扒|豬扒$/, "Pork chops"],
    [/^chicken (breast|thighs?|leg|meat)|鸡胸|雞胸|鸡肉|雞肉$/, "Chicken breast"],
    [/^beef|flank steak|skirt steak|牛肉|牛柳$/, "Beef steak"],
    [/^shrimp|prawns?|虾|蝦$/, "Shrimp"],
    [/^tofu(?! skin)|豆腐$/, "Tofu"],
    [/^silken tofu|soft tofu|嫩豆腐$/, "Silken tofu"],
    [/^green beans|string beans|long beans|chinese green beans|豆角|四季豆$/, "Green beans"],
    [/^bell peppers?|capsicum|灯笼椒|燈籠椒$/, "Bell pepper"],
    [/^onions?|yellow onion|洋蔥|洋葱$/, "Onion"],
    [/^carrots?|红萝卜|紅蘿蔔$/, "Carrots"],
    [/^mushrooms?|香菇|蘑菇|冬菇$/, "Mushroom"],
    [/^broccoli|西兰花|西蘭花$/, "Broccoli"],
    [/^cabbage|椰菜|卷心菜$/, "Cabbage"],
    [/^celery|西芹$/, "Celery"],
    [/^bean sprouts?|豆芽|银芽|銀芽$/, "Bean sprouts"],
    [/^snow peas?|荷兰豆|荷蘭豆$/, "Snow peas"],
    [/^eggplant|aubergine|茄子$/, "Eggplant"],
    [/^pineapple|菠萝|菠蘿$/, "Pineapple"],
    [/^bacon|烟肉|煙肉$/, "Bacon"],
    [/^flour|all purpose flour|麵粉|面粉$/, "Flour"],
    [/^sesame seeds?|芝麻$/, "Sesame seeds"],
    [/^peanuts?|花生$/, "Peanuts"],
    [/^fermented black beans?|豆豉$/, "Fermented black beans"],
    [/^lettuce|生菜$/, "Lettuce"],
    [/^corn(?! starch|starch| oil)|peas and corn|corn and peas|粟米$/, "Corn"],
    [/^thai basil|金不换|金不換$/, "Thai basil"],
    [/^rice vermicelli|rice noodles|米粉$/, "Rice vermicelli"],
    [/^noodles|小麦面|麵|面$/, "Noodles"],
    [/^pasta|spaghetti|意粉$/, "Pasta"],
    [/^bread|sourdough|toast|面包|麵包$/, "Bread"],
    [/^avocado|牛油果$/, "Avocado"],
    [/^lemon|柠檬|檸檬$/, "Lemon"],
    [/^lime|青檸|青柠|萊姆|莱姆$/, "Lime"],
    [/^chili flakes|chilli flakes|dried chilli flakes|red pepper flakes|辣椒碎$/, "Dried chili"],
    [/^coriander|cilantro|香菜|芫荽$/, "Cilantro"],
  ]
  for (const [re, canon] of rules) {
    if (re.test(n) || re.test(s)) return canon
  }

  const hit = exactShelf(s) || exactShelf(n)
  if (hit) return hit
  return null // unknown → skip rather than invent
}

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
  "Pickled mustard",
  "Cilantro",
])

/** Related pairs: having A counts as covering B from source (and vice versa when listed). */
const COVER = [
  ["Cooked rice", "Rice"],
  ["Tofu", "Silken tofu"],
  ["Chicken breast", "Chicken thighs"],
  ["Chicken breast", "Chicken wings"],
  ["Ground pork", "Pork chops"],
  ["Glass noodles", "Rice vermicelli"],
]

function covers(haveList, want) {
  if (haveList.some((h) => norm(h) === norm(want))) return true
  // exact shelf alias equality
  const wantShelf = exactShelf(want) || want
  if (haveList.some((h) => (exactShelf(h) || h) === wantShelf)) return true
  for (const [a, b] of COVER) {
    if (wantShelf === a && haveList.some((h) => (exactShelf(h) || h) === b)) return true
    if (wantShelf === b && haveList.some((h) => (exactShelf(h) || h) === a)) return true
  }
  return false
}

function shouldAudit(dish, _byUrl) {
  if (!(dish.sourceIngredients || []).length) return false
  if (dish.exclusive) return true
  if (dish.titleScore >= 3 && dish.sharedWith <= 3) return true
  if (dish.titleScore >= 4) return true
  return false
}

/** Cores from a shared stand-in page pollute sibling dishes — staples only unless exclusive / strong title. */
function allowCoreNeed(dish) {
  return dish.exclusive || dish.titleScore >= 6
}
function allowCoreOptional(dish) {
  return dish.exclusive || dish.titleScore >= 4
}

function computeAdds(dish) {
  const mapped = []
  for (const raw of dish.sourceIngredients || []) {
    const canon = mapIngredient(raw)
    if (canon) mapped.push(canon)
  }
  const unique = [...new Set(mapped)]
  const have = [...dish.need, ...dish.optional]
  const addNeed = []
  const addOpt = []
  for (const canon of unique) {
    if (covers(have, canon)) continue
    if (covers([...have, ...addNeed, ...addOpt], canon)) continue
    if (STAPLES.has(canon)) {
      addOpt.push(canon)
    } else if (allowCoreNeed(dish)) {
      addNeed.push(canon)
    } else if (allowCoreOptional(dish)) {
      addOpt.push(canon)
    }
  }
  return { addNeed, addOpt, mapped: unique }
}

function formatArr(arr) {
  return `[${arr.map((x) => JSON.stringify(x)).join(", ")}]`
}

function patchFile(file, updatesById) {
  let text = readFileSync(file, "utf8")
  let changed = 0
  for (const [id, { need, optional }] of Object.entries(updatesById)) {
    const re = new RegExp(
      `(\\{\\s*id:\\s*"${id}"[\\s\\S]*?need:\\s*)\\[[^\\]]*\\]([\\s\\S]*?optional:\\s*)\\[[^\\]]*\\]`,
      "m",
    )
    const next = text.replace(re, `$1${formatArr(need)}$2${formatArr(optional)}`)
    if (next !== text) {
      text = next
      changed += 1
    } else {
      console.warn("failed to patch", id, "in", file)
    }
  }
  if (changed) writeFileSync(file, text)
  return changed
}

function main() {
  const dishes = AUDIT.dishes
  const byUrl = new Map()
  for (const d of dishes) {
    if (!byUrl.has(d.sourceUrl)) byUrl.set(d.sourceUrl, [])
    byUrl.get(d.sourceUrl).push(d)
  }

  const updates = []
  const byFile = new Map()
  let audited = 0
  let fixed = 0

  for (const d of dishes) {
    if (!shouldAudit(d, byUrl)) continue
    audited += 1
    const { addNeed, addOpt, mapped } = computeAdds(d)
    if (!addNeed.length && !addOpt.length) continue
    const need = [...d.need]
    const optional = [...d.optional]
    for (const x of addNeed) if (!covers([...need, ...optional], x)) need.push(x)
    for (const x of addOpt) if (!covers([...need, ...optional], x)) optional.push(x)
    fixed += 1
    updates.push({
      id: d.id,
      file: d.file,
      addNeed,
      addOpt,
      mapped,
      titleScore: d.titleScore,
      exclusive: d.exclusive,
      sourceTitle: d.sourceTitle,
    })
    if (!byFile.has(d.file)) byFile.set(d.file, {})
    byFile.get(d.file)[d.id] = { need, optional }
  }

  let patchCount = 0
  for (const [file, map] of byFile) {
    patchCount += patchFile(file, map)
  }

  const out = {
    audited,
    fixed,
    patchedObjects: patchCount,
    updates: updates.slice(0, 500),
    updateCount: updates.length,
  }
  writeFileSync("/tmp/ingredient-fixes.json", JSON.stringify(out, null, 2))
  console.log(JSON.stringify({ audited, fixed, patchedObjects: patchCount, updateCount: updates.length }, null, 2))
  // top added
  const addC = new Map()
  for (const u of updates) {
    for (const x of [...u.addNeed, ...u.addOpt]) addC.set(x, (addC.get(x) || 0) + 1)
  }
  console.log(
    "top adds",
    [...addC.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([n, c]) => `${c} ${n}`),
  )
}

main()
