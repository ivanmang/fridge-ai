#!/usr/bin/env node
/**
 * Build cuisine-wave home-* dishes from exclusive / title-matched recipe pages.
 * Materials (groups + amounts) come from the source page — never invented thin need lists.
 *
 * Usage:
 *   node scripts/build-cuisine-wave.mjs --catalog /tmp/wave-catalog.json --out src/lib/more-dishes-w6a.ts --export MORE_W6A
 *
 * Catalog row shape:
 * {
 *   id, name, zhName, cuisine, time, servings?,
 *   sourceUrl, sourceName,
 *   zhSteps?: string[],   // optional; EN steps distilled from source
 *   matchTokens?: string[] // title must contain ≥1 (default: strong tokens from name)
 * }
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { SHELF } from "../src/lib/shelf.ts"

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]])
    return acc
  }, []),
)

const CATALOG = args.catalog
const OUT = args.out
const EXPORT = args.export || "MORE_WAVE"
const WAVE = args.wave || "w6"
const UA = "Mozilla/5.0 (compatible; FridgeAI-cuisine-wave/1.0; +https://github.com/ivanmang/fridge-ai)"
const CACHE_PATH = "/tmp/cuisine-wave-source-cache.json"
const REPORT_PATH = `/tmp/cuisine-wave-${WAVE}-report.json`

if (!CATALOG || !OUT) {
  console.error("Need --catalog and --out")
  process.exit(1)
}

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"))
const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, "utf8")) : {}
const saveCache = () => writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))

const STAPLE_NAMES = new Set(SHELF.filter((f) => f.staple).map((f) => f.name))
const SHELF_BY_NAME = new Map(SHELF.map((f) => [f.name, f]))

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[’']/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim()
}

function buildIndex() {
  const entries = []
  for (const food of SHELF) {
    const names = [{ text: food.name, rank: 300 }, ...food.aliases.map((text) => ({ text, rank: 200 }))]
    entries.push({ food, names })
  }
  return entries
}
const INDEX = buildIndex()

function findShelf(name) {
  const n = norm(name)
  if (!n) return undefined
  let best
  for (const { food, names } of INDEX) {
    for (const { text, rank } of names) {
      const alias = norm(text)
      if (!alias) continue
      let score = 0
      if (alias === n) score = rank + alias.length
      else if (n.includes(alias) && alias.length >= 4) score = rank / 2 + alias.length
      else if (alias.includes(n) && n.length >= 4) score = rank / 3 + n.length
      if (score > (best?.score ?? 0)) best = { food, score }
    }
  }
  return best?.food
}

/** Extra phrase → shelf mappings for cuisine waves. Order matters (specific first). */
const PHRASE_MAP = [
  [/chicken (stock|broth)|stock cube|vegetable stock|chicken stock cube/i, "Chicken stock"],
  [/dashi/i, "Dashi"],
  [/chicken thighs?/i, "Chicken thighs"],
  [/chicken breasts?/i, "Chicken breast"],
  [/chicken wings?/i, "Chicken wings"],
  [/boneless,?\s*skinless\s+chicken/i, "Chicken thighs"],
  [/\bchicken\b(?!\s*(stock|broth|cube))/i, "Chicken thighs"],
  [/ground pork|minced pork|pork mince/i, "Ground pork"],
  [/ground beef|beef mince|minced beef/i, "Ground beef"],
  [/ground (meat|lamb)|lamb mince|minced lamb/i, "Lamb"],
  [/lamb (shoulder|chop|meat)?/i, "Lamb"],
  [/duck|duckling/i, "Duck"],
  [/mussel/i, "Mussels"],
  [/shrimp|prawn/i, "Shrimp"],
  [/mahi mahi|rohu|white fish|cod fillet|haddock|basa|fish fillet|fish steaks?|firm white fish|(?<!sauce\s)\bfish\b(?!\s*sauce)/i, "White fish"],
  [/salmon/i, "Salmon"],
  [/beef (steak|sirloin|rump)/i, "Beef steak"],
  [/beef brisket|brisket/i, "Beef brisket"],
  [/egg(s)?\b/i, "Eggs"],
  [/silken tofu|soft tofu/i, "Silken tofu"],
  [/\btofu\b|paneer/i, "Tofu"],
  [/cooked (japanese )?.*rice|short.?grain rice|jasmine rice|basmati rice|\brice\b(?!\s*noodle)/i, "Cooked rice"],
  [/uncooked rice|raw rice|dry rice/i, "Rice"],
  [/wide rice noodle|kway teow|ho fun|flat rice noodle/i, "Wide rice noodles"],
  [/rice vermicelli|bee hoon|mai fun/i, "Rice vermicelli"],
  [/glass noodle|cellophane|dangmyeon/i, "Glass noodles"],
  [/udon/i, "Udon"],
  [/instant noodle|ramen noodle|\bnoodles?\b/i, "Noodles"],
  [/dark soy|light soy|regular soy|soy sauce/i, "Soy sauce"],
  [/oyster sauce/i, "Oyster sauce"],
  [/fish sauce/i, "Fish sauce"],
  [/sesame oil/i, "Sesame oil"],
  [/mirin/i, "Mirin"],
  [/shaoxing|chinese (cooking )?wine/i, "Shaoxing wine"],
  [/shrimp paste|belacan|terasi/i, "Shrimp paste"],
  [/gochujang/i, "Gochujang"],
  [/gochugaru|korean (chili|chilli|red pepper)/i, "Gochugaru"],
  [/doenjang/i, "Doenjang"],
  [/miso/i, "Miso"],
  [/garam masala/i, "Garam masala"],
  [/ground cumin|cumin powder|cumin seeds|\bcumin\b/i, "Cumin"],
  [/ground turmeric|turmeric powder|\bturmeric\b/i, "Turmeric"],
  [/ground coriander|coriander powder|coriander seed/i, "Ground coriander"],
  [/fresh coriander|cilantro|coriander leaves|coriander stalks/i, "Cilantro"],
  [/paprika/i, "Paprika"],
  [/cardamom/i, "Cardamom"],
  [/fenugreek|kasuri methi|methi/i, "Fenugreek"],
  [/curry (powder|paste)|tikka masala (curry )?paste/i, "Curry powder"],
  [/chickpea|garbanzo|chana\b|chana dal/i, "Chickpeas"],
  [/red lentil|masoor|lentil/i, "Red lentils"],
  [/tomato (paste|pur[eé]e|concentrate)/i, "Tomato paste"],
  [/chopped tomatoes|tinned tomatoes|canned tomatoes|\btomatoes?\b/i, "Tomato"],
  [/double cream|heavy cream|whipping cream|\bcream\b/i, "Cream"],
  [/yoghurt|yogurt/i, "Yogurt"],
  [/coconut milk/i, "Coconut milk"],
  [/butter\b|ghee/i, "Butter"],
  [/neutral oil|vegetable oil|sunflower oil|canola oil|peanut oil|cooking oil/i, "Cooking oil"],
  [/olive oil/i, "Olive oil"],
  [/sesame seeds/i, "Sesame seeds"],
  [/spring onion|green onion|scallion/i, "Spring onion"],
  [/shallot/i, "Shallot"],
  [/\bonions?\b/i, "Onion"],
  [/garlic/i, "Garlic"],
  [/ginger/i, "Ginger"],
  [/spinach/i, "Spinach"],
  [/sweet potato/i, "Sweet potato"],
  [/potato/i, "Potato"],
  [/cauliflower/i, "Cauliflower"],
  [/cabbage/i, "Cabbage"],
  [/carrot/i, "Carrots"],
  [/cucumber/i, "Cucumber"],
  [/eggplant|aubergine/i, "Eggplant"],
  [/bell pepper|capsicum|red (bell )?pepper(?! flakes)/i, "Bell pepper"],
  [/bean sprout/i, "Bean sprouts"],
  [/water spinach|kangkung|morning glory/i, "Water spinach"],
  [/pineapple/i, "Pineapple"],
  [/\bmango\b/i, "Mango"],
  [/papaya/i, "Papaya"],
  [/lemon/i, "Lemon"],
  [/lime/i, "Lime"],
  [/kimchi/i, "Kimchi"],
  [/rice cake|tteok/i, "Rice cakes"],
  [/taro/i, "Taro"],
  [/sago|tapioca pearl/i, "Sago"],
  [/red bean|adzuki|azuki/i, "Red beans"],
  [/mung bean/i, "Mung beans"],
  [/cornstarch|corn starch|potato starch|cornflour/i, "Cornstarch"],
  [/flour|breadcrumbs?|panko/i, "Flour"],
  [/sugar|caster sugar|rock sugar|brown sugar/i, "Sugar"],
  [/salt|sea salt|kosher salt/i, "Salt"],
  [/white pepper|black pepper|cayenne pepper|\bpepper\b/i, "White pepper"],
  [/dried chili|chilli flakes|red pepper flakes|flaked chill|green chilli|green chili/i, "Dried chili"],
  [/mustard seeds|english mustard|\bmustard\b/i, "Mustard"],
  [/ketchup|tomato ketchup/i, "Ketchup"],
  [/peanut butter|peanut sauce/i, "Peanut butter"],
  [/satay/i, "Satay sauce"],
  [/chinese sausage|lap cheong/i, "Chinese sausage"],
  [/\bham\b/i, "Ham"],
  [/spare ribs|pork ribs|\bribs\b/i, "Spare ribs"],
  [/fermented (red )?bean curd|nam yu/i, "Fermented tofu"],
  [/fermented black bean|black bean sauce/i, "Fermented black beans"],
  [/five.?spice/i, "Five-spice powder"],
  [/baking soda|bicarbonate/i, "Baking soda"],
  [/nori|seaweed sheet/i, "Nori"],
  [/bread|toast|naan|chapati|roti/i, "Bread"],
  [/milk\b/i, "Milk"],
  [/frozen peas|garden peas|\bpeas\b/i, "Snow peas"],
  [/green beans|french beans/i, "Green beans"],
  [/celery/i, "Celery"],
  [/\bapple\b/i, "Apple"],
  [/tortilla|wrap/i, "Tortilla"],
  [/\bcorn\b|sweetcorn/i, "Corn"],
  [/berries|raisins|sultanas/i, "Berries"],
]

function mapName(rawName) {
  let cleaned = String(rawName || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    // keep commas — many BBC lines are "boneless, skinless chicken thighs, trimmed…"
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return null
  // drop trailing prep clauses after the food name when helpful
  const n = norm(cleaned)
  if (!n || n === "water" || n.endsWith(" water") || /^ice$/.test(n)) return null
  for (const [re, canonical] of PHRASE_MAP) {
    if (re.test(cleaned) || re.test(n)) {
      if (!SHELF_BY_NAME.has(canonical)) continue
      return canonical
    }
  }
  // try before first long prep clause
  const head = cleaned.split(/,\s*(?:trimmed|cut|peeled|sliced|chopped|diced|grated|to taste)/i)[0]
  if (head && head !== cleaned) {
    for (const [re, canonical] of PHRASE_MAP) {
      if (re.test(head)) {
        if (!SHELF_BY_NAME.has(canonical)) continue
        return canonical
      }
    }
    const hitHead = findShelf(head)
    if (hitHead) return hitHead.name
  }
  const hit = findShelf(cleaned)
  return hit?.name || null
}

function normalizeFractions(s) {
  return String(s || "")
    .replace(/(\d)\s*½/g, "$1.5")
    .replace(/(\d)\s*¼/g, "$1.25")
    .replace(/(\d)\s*¾/g, "$1.75")
    .replace(/(\d)\s*⅓/g, "$1.33")
    .replace(/(\d)\s*⅔/g, "$1.67")
    .replace(/(\d)\s*⅛/g, "$1.125")
    .replace(/½/g, "0.5")
    .replace(/¼/g, "0.25")
    .replace(/¾/g, "0.75")
    .replace(/⅓/g, "0.33")
    .replace(/⅔/g, "0.67")
    .replace(/⅛/g, "0.125")
}

const UNIT_ALT =
  "kg|grams?|g\\b|ounces?|oz\\.?|lbs?|pounds?|cups?|tbsp|tsp|tablespoons?|teaspoons?|ml\\b|litres?|liters?|l\\b|cloves?|slices?|pieces?|pcs?|pinch(?:es)?|cans?"

function parseAmount(raw) {
  const s = normalizeFractions(raw).trim()
  if (!s) return null
  const m = s.match(
    new RegExp(
      `^(\\d+(?:\\.\\d+)?)(?:\\s*[–—-]\\s*\\d+(?:\\.\\d+)?)?(?:\\s+(\\d+/\\d+))?\\s*(${UNIT_ALT})?`,
      "i",
    ),
  )
  if (!m) return null
  let amount = Number(m[1])
  if (m[2]) {
    const [a, b] = m[2].split("/").map(Number)
    if (b) amount += a / b
  }
  let unit = (m[3] || "").toLowerCase().replace(/\.$/, "")
  const unitNorm = {
    teaspoon: "tsp",
    teaspoons: "tsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    ounce: "oz",
    ounces: "oz",
    gram: "g",
    grams: "g",
    pound: "lb",
    pounds: "lb",
    lb: "lb",
    lbs: "lb",
    clove: "clove",
    cloves: "clove",
    cup: "cup",
    cups: "cup",
    pinch: "pinch",
    pinches: "pinch",
    slice: "piece",
    slices: "piece",
    piece: "piece",
    pieces: "piece",
    litre: "ml",
    liter: "ml",
    litres: "ml",
    liters: "ml",
    can: "can",
    cans: "can",
  }
  // bare "l" / "g" only count as units when followed by end or non-letter in original match
  if (unit === "l" || unit === "g") {
    const after = s.slice(m[0].length)
    if (/^[a-z]/i.test(after)) {
      // matched start of a word like "large" / "garlic" — not a unit
      unit = ""
      // recompute: amount only
    }
  }
  unit = unitNorm[unit] || unit || undefined
  if (!Number.isFinite(amount)) return null
  return { amount, unit, matchedLen: m[0].length }
}

function parseLooseIngredientLine(line) {
  const raw = String(line || "").trim()
  if (!raw) return null
  const normalized = normalizeFractions(raw)
  const amt = parseAmount(normalized)
  let rest = normalized
  if (amt) {
    // Prefer stripping a real unit; otherwise strip leading number range only
    const unitStrip = new RegExp(
      `^[\\d./\\s–—-]+(?:\\s*(?:${UNIT_ALT}))?`,
      "i",
    )
    const stripped = normalized.replace(unitStrip, "").trim()
    // If stripping left almost nothing or unit was false-positive, strip number only
    if (!amt.unit) {
      rest = normalized.replace(/^[\d./\s–—-]+/, "").trim()
    } else {
      rest = stripped
    }
  }
  // drop size adjectives that confuse units
  rest = rest.replace(/^(large|medium|small|heaped|level|fresh|dried)\s+/i, "").trim()
  const name = mapName(rest) || mapName(raw)
  if (!name) return { unmapped: rest || raw, raw }
  let note = rest
    .replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "")
    .replace(/^[\s,.-]+/, "")
    .trim()
  if (note.length > 80) note = note.slice(0, 77) + "…"
  // Sanity: absurd tbsp/tsp amounts usually mean parse failure
  let amount = amt?.amount
  let unit = amt?.unit
  if (unit === "tbsp" && amount != null && amount > 12) {
    amount = undefined
    unit = undefined
    note = note || "see source"
  }
  if (unit === "tsp" && amount != null && amount > 20) {
    amount = undefined
    unit = undefined
  }
  return {
    name,
    amount,
    unit,
    note: note || undefined,
    raw,
  }
}

function roleFor(name) {
  if (name === "Mustard" || STAPLE_NAMES.has(name) || SHELF_BY_NAME.get(name)?.staple) return "staple"
  const f = SHELF_BY_NAME.get(name)
  if (f && ["sauce", "spice", "pantry"].includes(f.category) && f.staple !== false) {
    if (["sauce", "spice"].includes(f.category) && !["Kimchi", "Chickpeas", "Red lentils", "Beans", "XO sauce", "Satay sauce", "Doenjang", "Gochujang", "Shrimp paste"].includes(name)) {
      // many sauces/spices are soft unless they're dish-defining pastes already listed
      if (["Soy sauce", "Salt", "Sugar", "Cooking oil", "Sesame oil", "Cornstarch", "White pepper", "Vinegar", "Shaoxing wine", "Olive oil", "Flour", "Baking soda", "Chicken stock", "Dashi", "Mirin", "Fish sauce", "Tomato paste", "Garam masala", "Cumin", "Turmeric", "Ground coriander", "Paprika", "Curry powder", "Five-spice powder"].includes(name)) {
        return "staple"
      }
    }
  }
  return "core"
}

function groupFor(name, idx, total) {
  const n = name.toLowerCase()
  if (/marinade|yogurt|corn ?starch/.test(n) && idx < 6) return "marinade"
  if (["Soy sauce", "Fish sauce", "Oyster sauce", "Mirin", "Garam masala", "Cumin", "Turmeric", "Tomato paste", "Gochujang", "Miso"].includes(name)) return "sauce"
  if (["Spring onion", "Cilantro", "Sesame seeds", "Nori"].includes(name)) return "garnish"
  return "main"
}

async function fetchText(url) {
  if (cache[`html:${url}`]) return cache[`html:${url}`]
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/json,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const text = await res.text()
  cache[`html:${url}`] = text
  saveCache()
  return text
}

async function fetchWoks(slugOrUrl) {
  const slug = slugOrUrl.includes("thewoksoflife.com")
    ? slugOrUrl.replace(/\/$/, "").split("/").pop()
    : slugOrUrl
  const key = `woks:${slug}`
  if (cache[key]) return cache[key]
  const api = `https://thewoksoflife.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=link,title,content,jetpack_featured_media_url,yoast_head_json`
  const res = await fetch(api, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`Woks API ${res.status}`)
  const data = await res.json()
  if (!data?.[0]) throw new Error(`Woks slug miss ${slug}`)
  const p = data[0]
  const html = p.content.rendered
  const structured = []
  for (const m of html.matchAll(/<li[^>]*class="[^"]*wprm-recipe-ingredient[^"]*"[^>]*>([\s\S]*?)<\/li>/gi)) {
    const chunk = m[1]
    const grab = (re) => {
      const hit = chunk.match(re)
      return hit ? hit[1].replace(/<[^>]+>/g, "").trim() : ""
    }
    const amount = grab(/wprm-recipe-ingredient-amount[^>]*>([\s\S]*?)<\/span>/i)
    const unit = grab(/wprm-recipe-ingredient-unit[^>]*>([\s\S]*?)<\/span>/i)
    const name = grab(/wprm-recipe-ingredient-name[^>]*>([\s\S]*?)<\/span>/i)
    const note = grab(/wprm-recipe-ingredient-notes[^>]*>([\s\S]*?)<\/span>/i)
    if (!name) continue
    structured.push({ amount, unit, name, note })
  }
  let img = p.jetpack_featured_media_url
  const yo = p.yoast_head_json || {}
  if (!img && yo.og_image?.[0]?.url) img = yo.og_image[0].url
  const out = {
    title: p.title.rendered.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&amp;/g, "&"),
    url: p.link,
    img,
    structured,
    steps: [],
  }
  // steps from wprm
  for (const m of html.matchAll(/wprm-recipe-instruction-text[^>]*>([\s\S]*?)<\/div>/gi)) {
    const t = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    if (t.length > 15) out.steps.push(t)
  }
  cache[key] = out
  saveCache()
  return out
}

function parseBbc(html, url) {
  const title =
    (html.match(/property="og:title" content="([^"]+)"/i) || [])[1]?.replace(/\s+recipe\s*$/i, "").trim() ||
    null
  const img = (html.match(/property="og:image" content="([^"]+)"/i) || [])[1] || null
  let ings = []
  const m = html.match(/"recipeIngredient"\s*:\s*(\[[^\]]{10,12000}\])/)
  if (m) ings = JSON.parse(m[1])
  let steps = []
  const sm = html.match(/"recipeInstructions"\s*:\s*(\[[^\]]{10,20000}\])/)
  if (sm) {
    try {
      const arr = JSON.parse(sm[1])
      steps = arr.map((x) => (typeof x === "string" ? x : x.text || "")).filter((t) => t && t.length > 10)
    } catch {
      /* ignore */
    }
  }
  return { title, url, img, ings, steps, structured: [] }
}

function titleMatches(pageTitle, dish) {
  const hay = norm(pageTitle || "")
  const tokens =
    dish.matchTokens ||
    dish.name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !["home", "style", "with", "from", "easy", "quick", "recipe"].includes(w))
  if (!tokens.length) return false
  const hits = tokens.filter((t) => hay.includes(norm(t)))
  // require majority of strong tokens, or all if ≤2
  const need = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.6)
  return hits.length >= need
}

function distillSteps(sourceSteps, fallback) {
  const cleaned = (sourceSteps || [])
    .map((s) => String(s).replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 20)
  if (cleaned.length >= 3) {
    // keep 3–5 densest steps
    if (cleaned.length <= 5) return cleaned
    const picks = [cleaned[0], cleaned[Math.floor(cleaned.length / 3)], cleaned[Math.floor((2 * cleaned.length) / 3)], cleaned[cleaned.length - 2], cleaned[cleaned.length - 1]]
    return [...new Set(picks)].slice(0, 5)
  }
  return fallback
}

function materialsFromSource(page) {
  const rows = []
  const unmapped = []
  if (page.structured?.length) {
    for (const row of page.structured) {
      const amt = parseAmount(row.amount)
      let unit = (row.unit || "").toLowerCase().replace(/\.$/, "")
      const unitNorm = {
        teaspoon: "tsp",
        teaspoons: "tsp",
        tablespoon: "tbsp",
        tablespoons: "tbsp",
        ounce: "oz",
        ounces: "oz",
        "oz.": "oz",
        gram: "g",
        grams: "g",
        pound: "lb",
        pounds: "lb",
        clove: "clove",
        cloves: "clove",
        cup: "cup",
        cups: "cup",
      }
      unit = unitNorm[unit] || unit || amt?.unit
      if (unit && !/^(tsp|tbsp|oz|g|kg|ml|cup|lb|clove|piece|pinch|can)$/i.test(unit)) {
        unit = amt?.unit
      }
      let amount = amt?.amount
      if (unit === "tbsp" && amount != null && amount > 12) {
        amount = undefined
        unit = undefined
      }
      const name = mapName(row.name) || mapName(`${row.amount || ""} ${row.unit || ""} ${row.name}`)
      if (!name) {
        unmapped.push(row.name)
        continue
      }
      const note = (row.note || "").replace(/[()]/g, "").trim() || undefined
      rows.push({
        name,
        role: roleFor(name),
        group: groupFor(name, rows.length, 20),
        amount,
        unit: unit || undefined,
        note,
      })
    }
  } else {
    for (const line of page.ings || []) {
      const parsed = parseLooseIngredientLine(line)
      if (!parsed) continue
      if (parsed.unmapped) {
        unmapped.push(parsed.unmapped)
        continue
      }
      rows.push({
        name: parsed.name,
        role: roleFor(parsed.name),
        group: groupFor(parsed.name, rows.length, 20),
        amount: parsed.amount,
        unit: parsed.unit,
        note: parsed.note,
      })
    }
  }
  // dedupe by name+group keeping first amount
  const seen = new Set()
  const out = []
  for (const row of rows) {
    const key = `${row.name}|${row.group}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return { materials: out, unmapped }
}

function serializeMaterial(m) {
  const parts = [`name: ${JSON.stringify(m.name)}`, `role: ${JSON.stringify(m.role)}`]
  if (m.group) parts.push(`group: ${JSON.stringify(m.group)}`)
  if (m.amount != null && Number.isFinite(m.amount)) parts.push(`amount: ${m.amount}`)
  if (m.unit) parts.push(`unit: ${JSON.stringify(m.unit)}`)
  if (m.note) parts.push(`note: ${JSON.stringify(m.note)}`)
  if (m.zhNote) parts.push(`zhNote: ${JSON.stringify(m.zhNote)}`)
  return `      { ${parts.join(", ")} }`
}

function serializeDish(dish) {
  const need = [...new Set(dish.materials.filter((m) => m.role === "core").map((m) => m.name))]
  const optional = [...new Set(dish.materials.filter((m) => m.role !== "core").map((m) => m.name))]
  const steps = dish.steps.map((s) => `      ${JSON.stringify(s)}`).join(",\n")
  const zhSteps = dish.zhSteps.map((s) => `        ${JSON.stringify(s)}`).join(",\n")
  const mats = dish.materials.map(serializeMaterial).join(",\n")
  return `  {
    id: ${JSON.stringify(dish.id)},
    name: ${JSON.stringify(dish.name)},
    cuisine: ${JSON.stringify(dish.cuisine)},
    time: ${dish.time},
    servings: ${dish.servings},
    sourceUrl: ${JSON.stringify(dish.sourceUrl)},
    sourceName: ${JSON.stringify(dish.sourceName)},
    materials: [
${mats},
    ],
    need: ${JSON.stringify(need)},
    optional: ${JSON.stringify(optional)},
    steps: [
${steps},
    ],
    zh: {
      name: ${JSON.stringify(dish.zhName)},
      steps: [
${zhSteps},
      ],
    },
  }`
}

const report = { ok: [], skipped: [], images: {}, sources: {} }

for (const row of catalog) {
  try {
    let page
    if (/thewoksoflife\.com/i.test(row.sourceUrl)) {
      page = await fetchWoks(row.sourceUrl)
      page.url = row.sourceUrl
    } else {
      const html = await fetchText(row.sourceUrl)
      if (/bbc\.co\.uk/i.test(row.sourceUrl)) page = parseBbc(html, row.sourceUrl)
      else {
        // generic JSON-LD fallback
        page = parseBbc(html, row.sourceUrl)
      }
    }

    if (!titleMatches(page.title || row.name, row)) {
      report.skipped.push({ id: row.id, reason: "title-mismatch", pageTitle: page.title })
      continue
    }

    const { materials, unmapped } = materialsFromSource(page)
    const cores = materials.filter((m) => m.role === "core")
    const withAmt = materials.filter((m) => m.amount != null)
    // Protein sanity: dish title vs mapped cores
    const titleL = (row.name + " " + (page.title || "")).toLowerCase()
    const coreSet = new Set(cores.map((c) => c.name))
    if (/\bfish\b|rohu|cod|haddock/.test(titleL) && coreSet.has("Beef steak") && !coreSet.has("White fish") && !coreSet.has("Salmon")) {
      report.skipped.push({ id: row.id, reason: "protein-mismatch-fish", cores: cores.map((c) => c.name) })
      continue
    }
    if (/\bprawn|shrimp/.test(titleL) && !coreSet.has("Shrimp") && !coreSet.has("White fish")) {
      report.skipped.push({ id: row.id, reason: "protein-mismatch-shrimp", cores: cores.map((c) => c.name) })
      continue
    }
    if (/\blamb\b/.test(titleL) && !coreSet.has("Lamb") && (coreSet.has("Beef steak") || coreSet.has("Chicken thighs"))) {
      report.skipped.push({ id: row.id, reason: "protein-mismatch-lamb", cores: cores.map((c) => c.name) })
      continue
    }
    if (cores.length < 2) {
      report.skipped.push({ id: row.id, reason: "too-few-cores", cores: cores.map((c) => c.name), unmapped })
      continue
    }
    if (materials.length < 4) {
      report.skipped.push({ id: row.id, reason: "too-few-materials", n: materials.length, unmapped })
      continue
    }
    if (withAmt.length < 2) {
      report.skipped.push({ id: row.id, reason: "too-few-amounts", unmapped })
      continue
    }

    const enSteps = distillSteps(page.steps, row.enSteps || [
      `Prep ingredients as listed for ${row.name}.`,
      `Cook following the linked ${row.sourceName} method until proteins reach a safe temperature (poultry/mince 74°C / 165°F).`,
      `Taste, adjust seasoning, and serve.`,
    ])
    const zhSteps =
      row.zhSteps && row.zhSteps.length === enSteps.length
        ? row.zhSteps
        : row.zhSteps && row.zhSteps.length >= 3
          ? row.zhSteps
          : enSteps.map((_, i) => row.zhSteps?.[i] || `按食譜步驟 ${i + 1} 完成（詳見原文）。`)

    // pad/trim zh to en length
    while (zhSteps.length < enSteps.length) zhSteps.push(`按食譜步驟 ${zhSteps.length + 1} 完成（詳見原文）。`)
    const zhFinal = zhSteps.slice(0, enSteps.length)

    const dish = {
      id: row.id,
      name: row.name,
      zhName: row.zhName,
      cuisine: row.cuisine,
      time: row.time,
      servings: row.servings || 2,
      sourceUrl: row.sourceUrl,
      sourceName: row.sourceName,
      materials,
      steps: enSteps,
      zhSteps: zhFinal,
    }
    report.ok.push({ id: row.id, materials: materials.length, amounts: withAmt.length, unmapped, title: page.title })
    if (page.img) report.images[row.id] = page.img
    report.sources[row.id] = { url: row.sourceUrl, name: row.sourceName }
    row.__built = dish
  } catch (err) {
    report.skipped.push({ id: row.id, reason: String(err) })
  }
}

const built = catalog.filter((r) => r.__built).map((r) => r.__built)
const body = `import type { Recipe } from "@/lib/recipes"

/**
 * Cuisine expansion ${WAVE} — title-matched exclusive sources only.
 * Materials (groups/amounts) synced from each dish sourceUrl.
 */
export const ${EXPORT}: Recipe[] = [
${built.map(serializeDish).join(",\n")}
]
`

writeFileSync(OUT, body)
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Wrote ${built.length} dishes → ${OUT}`)
console.log(`Skipped ${report.skipped.length} — report ${REPORT_PATH}`)
for (const s of report.skipped) console.log("  skip", s.id, s.reason, s.pageTitle || s.unmapped?.slice?.(0, 3) || "")
