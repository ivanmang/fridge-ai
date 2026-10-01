#!/usr/bin/env node
/**
 * Audit home-* need/optional vs source-page ingredient lists.
 * Writes /tmp/ingredient-audit.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"

const RECIPES = JSON.parse(readFileSync("/tmp/home-recipes.json", "utf8"))
const SHELF = JSON.parse(readFileSync("/tmp/shelf.json", "utf8"))
const ZH_FOOD = JSON.parse(readFileSync("/tmp/zh-food.json", "utf8"))
const OUT = "/tmp/ingredient-audit.json"
const CACHE = "/tmp/ingredient-source-cache.json"
const UA = "Mozilla/5.0 (compatible; FridgeAI-ingredient-audit/1.0; +https://github.com/ivanmang/fridge-ai)"

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {}
const saveCache = () => writeFileSync(CACHE, JSON.stringify(cache, null, 2))

const STAPLE_KEYS = [
  "soy sauce",
  "dark soy",
  "light soy",
  "oyster sauce",
  "sesame oil",
  "chili oil",
  "olive oil",
  "cooking oil",
  "vegetable oil",
  "neutral oil",
  "oil",
  "salt",
  "sugar",
  "brown sugar",
  "honey",
  "vinegar",
  "rice vinegar",
  "black vinegar",
  "shaoxing",
  "cooking wine",
  "wine",
  "cornstarch",
  "corn starch",
  "starch",
  "white pepper",
  "black pepper",
  "pepper",
  "ketchup",
  "hoisin",
  "miso",
  "garlic",
  "ginger",
  "spring onion",
  "scallion",
  "green onion",
  "onion",
  "water",
]

const SKIP_ING = [
  /^water$/i,
  /^ice$/i,
  /^hot water$/i,
  /^boiling water$/i,
  /^stock water$/i,
  /^to taste$/i,
  /^optional$/i,
]

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim()
}

function buildShelfIndex() {
  const entries = []
  for (const food of SHELF) {
    const extra = ZH_FOOD[food.name] ? [ZH_FOOD[food.name]] : []
    const names = [
      { text: food.name, rank: 300 },
      ...food.aliases.map((text) => ({ text, rank: 200 })),
      ...extra.map((text) => ({ text, rank: 200 })),
    ]
    entries.push({ food, names })
  }
  return entries
}

const SHELF_INDEX = buildShelfIndex()

function findShelf(name) {
  const n = norm(name)
  if (!n) return undefined
  let best
  for (const { food, names } of SHELF_INDEX) {
    for (const { text, rank } of names) {
      const alias = norm(text)
      if (!alias) continue
      const score =
        alias === n
          ? rank + alias.length
          : n.includes(alias) || alias.includes(n)
            ? rank / 2 + alias.length
            : 0
      if (score > (best?.score ?? 0)) best = { food, score }
    }
  }
  return best?.food
}

function sameFood(a, b) {
  const left = findShelf(a)
  const right = findShelf(b)
  if (left && right) return left.name === right.name
  return norm(a) === norm(b)
}

function cleanIngredientName(raw) {
  let s = String(raw || "")
  s = s.replace(/\([^)]*\)/g, " ")
  s = s.replace(/\[[^\]]*\]/g, " ")
  // strip leading qty/units (EN + common ZH)
  s = s.replace(
    /^[\d./½¼¾⅓⅔⅛⅜⅝⅞\s\-–—到至约約]*\s*(kg|g|grams?|ounces?|oz|lb|lbs|pounds?|cups?|tbsp|tsp|tablespoons?|teaspoons?|ml|l|liters?|litres?|slices?|cloves?|stalks?|pieces?|pcs?|pinch(?:es)?|dashes?|cans?|packs?|packets?|bunches?|heads?|large|medium|small|whole|湯匙|茶匙|杯|克|公斤|兩|钱|錢|片|粒|隻|只|条|條|个|個|瓣|棵|根|适量|適量)?\s*/i,
    "",
  )
  s = s.replace(/,.*$/, "")
  s = s.replace(/\s+/g, " ").trim()
  // drop leading adjectives that confuse matching
  s = s.replace(/^(fresh|large|medium|small|lean|ripe|dried|ground|minced|sliced|chopped|cooked|raw|frozen|neutral|extra virgin)\s+/i, "")
  return s.trim()
}

function isStaple(name) {
  const n = norm(name)
  if (!n) return false
  // Exact / phrase match only — never let "rice" hit "rice vinegar" via includes.
  return STAPLE_KEYS.some((k) => {
    const key = norm(k)
    if (!key) return false
    if (n === key) return true
    // Multi-word keys may appear as a phrase inside a longer cleaned name.
    if (key.includes(" ") && (n.includes(key) || key.includes(n))) return true
    return false
  })
}

function isSkipped(name) {
  const n = norm(name)
  if (!n) return true
  if (n === "water" || n.endsWith(" water")) return true
  return SKIP_ING.some((re) => re.test(n))
}

function mapToCanonical(rawName) {
  const cleaned = cleanIngredientName(rawName)
  if (!cleaned) return null
  if (isSkipped(cleaned)) return null

  // Fridge AI tracks leftover cooked rice for matching — fold uncooked rice lines into Cooked rice.
  const cleanedNorm = norm(cleaned)
  if (
    /^(uncooked |raw |jasmine |long grain |short grain |white |brown )?rice$/.test(cleanedNorm) ||
    /^(uncooked |raw )?(jasmine |long grain |short grain |white |brown )?rice$/.test(cleanedNorm) ||
    /jasmine rice|uncooked rice|steamed rice|day[- ]old rice|leftover rice|cooked rice/.test(cleanedNorm) ||
    cleanedNorm === "米" ||
    cleanedNorm === "香米" ||
    cleanedNorm === "白飯" ||
    cleanedNorm === "飯"
  ) {
    const shelfRice = findShelf("Cooked rice")
    return {
      canonical: "Cooked rice",
      raw: rawName,
      cleaned,
      shelf: Boolean(shelfRice),
      staple: false,
    }
  }

  const shelf = findShelf(cleaned)
  if (shelf) {
    return {
      canonical: shelf.name,
      raw: rawName,
      cleaned,
      shelf: true,
      staple: Boolean(shelf.staple) || isStaple(shelf.name) || isStaple(cleaned),
    }
  }

  // heuristic canonical for common unlisted staples
  const n = cleanedNorm
  const heuristics = [
    [/^(neutral |vegetable |canola |peanut |corn |cooking )?oils?$/, "Cooking oil"],
    [/^dark soy( sauce)?$/, "Soy sauce"],
    [/^light soy( sauce)?$/, "Soy sauce"],
    [/^regular soy( sauce)?$/, "Soy sauce"],
    [/^生抽|老抽|豉油|酱油|醬油$/, "Soy sauce"],
    [/^盐|鹽|sea salt|kosher salt$/, "Salt"],
    [/^糖|白糖|冰糖|brown sugar|caster sugar$/, "Sugar"],
    [/^生粉|淀粉|澱粉|potato starch|corn ?starch$/, "Cornstarch"],
    [/^料酒|黄酒|紹興|绍兴$/, "Shaoxing wine"],
    [/^葱|蔥|青葱|青蔥$/, "Spring onion"],
    [/^蒜|蒜头|蒜頭|蒜蓉$/, "Garlic"],
    [/^姜|薑$/, "Ginger"],
    [/^胡椒|黑胡椒|白胡椒粉?$/, "White pepper"],
    [/^醋|香醋|米醋|陈醋|陳醋$/, "Vinegar"],
    [/^蚝油|蠔油$/, "Oyster sauce"],
    [/^麻油|香油$/, "Sesame oil"],
    [/^鸡蛋|雞蛋|蛋$/, "Eggs"],
    [/^番茄|西红柿|番茄$/, "Tomato"],
    [/^鸡粉|雞粉|鸡汤|雞湯|bouillon|chicken stock|chicken broth$/, "Chicken stock"],
  ]
  for (const [re, canonical] of heuristics) {
    if (re.test(n) || re.test(cleaned)) {
      const shelfHit = findShelf(canonical)
      return {
        canonical,
        raw: rawName,
        cleaned,
        shelf: Boolean(shelfHit),
        staple: Boolean(shelfHit?.staple) || isStaple(canonical) || true,
        heuristic: true,
      }
    }
  }
  return { canonical: cleaned, raw: rawName, cleaned, shelf: false, staple: isStaple(cleaned) }
}

async function fetchText(url, timeout = 20000) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/json,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { text: await res.text(), finalUrl: res.url, contentType: res.headers.get("content-type") || "" }
}

function parseJsonLdIngredients(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  const out = []
  let title = null
  for (const m of blocks) {
    let data
    try {
      data = JSON.parse(m[1])
    } catch {
      continue
    }
    const items = Array.isArray(data) ? data : [data]
    const queue = [...items]
    while (queue.length) {
      const d = queue.shift()
      if (!d || typeof d !== "object") continue
      if (d["@graph"]) queue.push(...d["@graph"])
      const types = Array.isArray(d["@type"]) ? d["@type"] : [d["@type"]]
      if (types.some((t) => t && String(t).toLowerCase().includes("recipe"))) {
        title = d.name || title
        const ings = d.recipeIngredient || []
        for (const ing of ings) out.push(String(ing))
      }
    }
  }
  return { title, ingredients: out }
}

function parseLkkIngredients(html) {
  const idx = html.indexOf(">材料<")
  if (idx < 0) {
    const idx2 = html.indexOf("材料")
    if (idx2 < 0) return { title: null, ingredients: [] }
  }
  const start = html.search(/<h3>\s*材料\s*<\/h3>/i)
  const chunk = start >= 0 ? html.slice(start, start + 4000) : html
  const text = chunk
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  const ings = []
  let capture = false
  for (const line of lines) {
    if (line === "材料") {
      capture = true
      continue
    }
    if (/^(醃料|调味料|調味料|使用了以下|做法|步骤|步驟)/.test(line)) {
      // keep 醃料/調味料 contents as ingredients too
      if (/^(醃料|调味料|調味料)/.test(line)) continue
      break
    }
    if (!capture) continue
    if (line.length < 2) continue
    ings.push(line)
  }
  const titleMatch = html.match(/<title>([^<]+)/i)
  return { title: titleMatch ? titleMatch[1].trim() : null, ingredients: ings }
}

function parseWprmFromHtml(html) {
  const blocks = [...html.matchAll(/<li[^>]*class="[^"]*wprm-recipe-ingredient[^"]*"[^>]*>([\s\S]*?)<\/li>/gi)]
  const structured = []
  if (blocks.length) {
    for (const m of blocks) {
      const chunk = m[1]
      const amount = (chunk.match(/wprm-recipe-ingredient-amount[^>]*>([\s\S]*?)<\/span>/i) || [])[1]
      const unit = (chunk.match(/wprm-recipe-ingredient-unit[^>]*>([\s\S]*?)<\/span>/i) || [])[1]
      const name = (chunk.match(/wprm-recipe-ingredient-name[^>]*>([\s\S]*?)<\/span>/i) || [])[1]
      const notes = (chunk.match(/wprm-recipe-ingredient-notes[^>]*>([\s\S]*?)<\/span>/i) || [])[1]
      const strip = (s) => (s || "").replace(/<[^>]+>/g, "").trim()
      const nameText = strip(name)
      if (!nameText) continue
      const parsedAmt = parseLooseAmount(strip(amount))
      structured.push({
        raw: [strip(amount), strip(unit), nameText, strip(notes)].filter(Boolean).join(" "),
        name: nameText,
        amount: parsedAmt?.amount,
        unit: strip(unit) || parsedAmt?.unit,
        note: strip(notes) || undefined,
        group: "main",
      })
    }
  }
  const names = structured.length
    ? structured.map((row) => row.raw)
    : [...html.matchAll(/wprm-recipe-ingredient-name[^>]*>([\s\S]*?)<\/span>/gi)].map((m) =>
        m[1].replace(/<[^>]+>/g, "").trim(),
      )
  const titleMatch =
    html.match(/wprm-recipe-name[^>]*>([\s\S]*?)<\/[^>]+>/i) || html.match(/<title>([^<]+)/i)
  return {
    title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : null,
    ingredients: names.filter(Boolean),
    structured,
  }
}

/** Parse "1 1/2 tbsp", "8 oz", "¼ tsp", "3–4 tbsp" style leading qty. */
function parseLooseAmount(raw) {
  const s = String(raw || "").trim()
  if (!s) return null
  const fracMap = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 }
  let text = s
  for (const [ch, val] of Object.entries(fracMap)) text = text.replaceAll(ch, String(val))
  const m = text.match(
    /^(\d+(?:\.\d+)?)(?:\s*[–—-]\s*\d+(?:\.\d+)?)?(?:\s+(\d+\/\d+))?\s*(kg|g|grams?|ounces?|oz\.?|lb|lbs|pounds?|cups?|tbsp|tsp|tablespoons?|teaspoons?|ml|l|liters?|litres?|slices?|cloves?|stalks?|pieces?|pcs?|pinch(?:es)?|dashes?|cans?|packs?|packets?|bunches?|heads?|bowl|bowls)?\b/i,
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
    cup: "cup",
    cups: "cups",
    clove: "clove",
    cloves: "cloves",
    piece: "piece",
    pieces: "piece",
    pcs: "piece",
    bowl: "bowl",
    bowls: "bowls",
  }
  if (unitNorm[unit]) unit = unitNorm[unit]
  return { amount: Math.round(amount * 100) / 100, unit: unit || undefined }
}

function inferGroup(label) {
  const n = norm(label)
  if (!n) return "main"
  if (/marinade|醃|腌/.test(n)) return "marinade"
  if (/sauce|gravy|season|調味|调味|醬汁|酱汁/.test(n)) return "sauce"
  if (/garnish|topping|finish|裝飾|装饰|蔥花/.test(n)) return "garnish"
  return "main"
}

function structureFromRawLines(ingredients, groupHints = []) {
  const out = []
  let group = "main"
  for (const raw of ingredients || []) {
    const line = String(raw || "").trim()
    if (!line) continue
    const hint = groupHints.find((g) => norm(g) === norm(line))
    if (hint || /^(marinade|sauce|garnish|rest|main|醃料|腌料|調味料|调味料|配料|材料)$/i.test(line)) {
      group = inferGroup(line)
      continue
    }
    const parsed = parseLooseAmount(line)
    let namePart = line
    if (parsed) {
      namePart = line
        .replace(
          /^[\d./½¼¾⅓⅔⅛⅜⅝⅞\s\-–—到至约約]*\s*(kg|g|grams?|ounces?|oz\.?|lb|lbs|pounds?|cups?|tbsp|tsp|tablespoons?|teaspoons?|ml|l|liters?|litres?|slices?|cloves?|stalks?|pieces?|pcs?|pinch(?:es)?|dashes?|cans?|packs?|packets?|bunches?|heads?|bowl|bowls)?\s*/i,
          "",
        )
        .trim()
    }
    out.push({
      raw: line,
      name: namePart || line,
      amount: parsed?.amount,
      unit: parsed?.unit,
      group,
    })
  }
  return out
}

async function fetchWolViaWp(url) {
  const u = new URL(url)
  const slug = u.pathname.replace(/\/+$/, "").split("/").pop()
  if (!slug) throw new Error("no slug")
  // Prefer post content (includes rendered WPRM)
  const api = `https://thewoksoflife.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug,title,content`
  const { text } = await fetchText(api)
  const posts = JSON.parse(text)
  if (Array.isArray(posts) && posts.length) {
    const p = posts[0]
    const parsed = parseWprmFromHtml(p.content?.rendered || "")
    return {
      title: p.title?.rendered?.replace(/<[^>]+>/g, "").trim() || parsed.title,
      ingredients: parsed.ingredients,
      structured: parsed.structured || [],
      via: "wp-post",
    }
  }
  // fallback wprm_recipe search by slug token
  const searchApi = `https://thewoksoflife.com/wp-json/wp/v2/wprm_recipe?search=${encodeURIComponent(slug.replace(/-/g, " "))}&per_page=5`
  const { text: t2 } = await fetchText(searchApi)
  const recipes = JSON.parse(t2)
  if (Array.isArray(recipes) && recipes.length) {
    const hit =
      recipes.find((r) => (r.recipe?.slug || r.slug || "").includes(slug.slice(0, 12))) || recipes[0]
    const flat = hit.recipe?.ingredients_flat || []
    let group = "main"
    const structured = []
    const ings = []
    for (const x of flat) {
      if (x.type === "group" || (x.name && !x.amount && !x.unit && /marinade|sauce|garnish|rest/i.test(x.name || ""))) {
        group = inferGroup(x.name || x.group || "main")
        continue
      }
      if (!(x.type === "ingredient" || x.name)) continue
      const name = String(x.name || "").trim()
      if (!name) continue
      const amountRaw = x.amount != null ? String(x.amount) : ""
      const unit = x.unit ? String(x.unit) : ""
      const parsedAmt = parseLooseAmount([amountRaw, unit].filter(Boolean).join(" "))
      const raw = [amountRaw, unit, name, x.notes].filter(Boolean).join(" ")
      ings.push(raw)
      structured.push({
        raw,
        name,
        amount: parsedAmt?.amount ?? (amountRaw && !Number.isNaN(Number(amountRaw)) ? Number(amountRaw) : undefined),
        unit: unit || parsedAmt?.unit,
        note: x.notes ? String(x.notes) : undefined,
        group,
      })
    }
    return {
      title: hit.recipe?.name || hit.title?.rendered,
      ingredients: ings,
      structured,
      via: "wprm_recipe",
    }
  }
  throw new Error("WOL not found via WP API")
}

function parseDdcIngredients(html) {
  // DayDayCook (Next.js RSC): escaped ingredient objects in flight data
  const structured = []
  const ingredients = []
  const re = /\{\\"name\\":\\"([^\\"]*)\\",\\"amount\\":\\"([^\\"]*)\\",\\"group\\":\\"([^\\"]*)\\"\}/g
  let m
  const seen = new Set()
  while ((m = re.exec(html))) {
    const name = m[1].trim()
    const amountRaw = (m[2] || "").trim()
    const groupLabel = m[3] || ""
    if (!name) continue
    const key = norm(name)
    if (seen.has(key)) continue
    seen.add(key)
    const parsedAmt = parseLooseAmount(amountRaw)
    let amount = parsedAmt?.amount
    let unit = parsedAmt?.unit
    if (amount == null && amountRaw) {
      const num = amountRaw.match(/^([\d./½¼¾⅓⅔]+)/)
      if (num) {
        const loose = parseLooseAmount(amountRaw)
        amount = loose?.amount
        unit = loose?.unit || amountRaw.replace(/^[\d./½¼¾⅓⅔\s]+/, "").trim() || undefined
      }
    }
    const group = inferGroup(groupLabel)
    const raw = [amountRaw, name].filter(Boolean).join(" ")
    ingredients.push(raw)
    structured.push({
      raw,
      name,
      amount,
      unit,
      group,
    })
  }
  const titleMatch = html.match(/<title>([^<]+)/i)
  return {
    title: titleMatch ? titleMatch[1].trim() : null,
    ingredients,
    structured,
    via: "ddc-rsc",
  }
}

function parseAfterworkIngredients(html) {
  // Squarespace posts rarely ship JSON-LD recipeIngredient; scrape short lines
  // under 份量 / 材料 / 配料 headings when present.
  const titleMatch = html.match(/<title>([^<]+)/i)
  const title = titleMatch ? titleMatch[1].trim() : null
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
  const STOP =
    /^(做法|步驟|步骤|烹調步驟|贴士|貼士|小貼士|厨具|廚具|厨具推介|廚具推介|本食譜|欢迎|歡迎|参观|參觀|Method|Directions|Hints?|Share|Related|Instagram|View this post)/i
  const START = /^(份量|材料|食材|配料|Ingredients|牛油果青醬|酱料|醬料)\b/i
  const ings = []
  let capture = false
  for (const line of lines) {
    if (START.test(line) || line === "材料" || line === "食材" || line === "配料") {
      capture = true
      // heading-only line: keep capturing but don't treat heading as ingredient
      if (/[:：]$/.test(line) || /^(份量|材料|食材|配料|Ingredients)$/i.test(line) || /青醬[:：]?$/.test(line)) {
        continue
      }
    }
    if (!capture) continue
    if (STOP.test(line)) break
    if (line.length < 2 || line.length > 50) continue
    if (/https?:\/\//i.test(line)) continue
    if (/選購|網店|推介|Instagram|Share|Related/.test(line)) continue
    // Prefer qty-looking or short food lines (often "蒜 - 2粒")
    if (/[-–—]/.test(line) || /^[\d./½¼¾⅓⅔]/.test(line) || /[克gml湯匙茶匙杯片粒隻勺]/.test(line)) {
      ings.push(line.replace(/\s*[-–—]\s*/, " ").trim())
    }
  }
  if (!ings.length) {
    const ld = parseJsonLdIngredients(html)
    if (ld.ingredients?.length) {
      return {
        title: ld.title || title,
        ingredients: ld.ingredients,
        structured: structureFromRawLines(ld.ingredients),
        via: "afterwork-jsonld",
      }
    }
  }
  return {
    title,
    ingredients: ings,
    structured: structureFromRawLines(ings),
    via: "afterwork-html",
  }
}

async function fetchSourceIngredients(url) {
  if (cache[url]?.ingredients && cache[url]?.structured && !process.env.REFRESH) return cache[url]
  const host = new URL(url).hostname
  let result
  try {
    if (host.includes("thewoksoflife.com")) {
      result = await fetchWolViaWp(url)
    } else {
      const { text } = await fetchText(url)
      if (host.includes("madewithlau.com") || host.includes("bbc.co.uk")) {
        result = parseJsonLdIngredients(text)
        result.structured = structureFromRawLines(result.ingredients)
        result.via = "json-ld"
      } else if (host.includes("lkk.com")) {
        result = parseLkkIngredients(text)
        result.structured = structureFromRawLines(result.ingredients, ["醃料", "调味料", "調味料", "材料"])
        result.via = "lkk-html"
      } else if (host.includes("daydaycook.com")) {
        result = parseDdcIngredients(text)
      } else if (host.includes("afterwork-kitchen.com")) {
        result = parseAfterworkIngredients(text)
      } else {
        result = parseJsonLdIngredients(text)
        if (!result.ingredients?.length) result = parseWprmFromHtml(text)
        if (!result.structured?.length) result.structured = structureFromRawLines(result.ingredients)
        result.via = "generic"
      }
    }
  } catch (err) {
    result = { title: null, ingredients: [], structured: [], error: String(err.message || err), via: "error" }
  }
  if (!result.structured?.length && result.ingredients?.length) {
    result.structured = structureFromRawLines(result.ingredients)
  }
  cache[url] = {
    title: result.title || null,
    ingredients: result.ingredients || [],
    structured: result.structured || [],
    via: result.via || null,
    error: result.error || null,
    fetchedAt: new Date().toISOString(),
  }
  saveCache()
  return cache[url]
}

function titleMatchScore(recipe, title) {
  if (!title) return 0
  const hay = norm(title)
  let score = 0
  const zh = recipe.zh || ""
  if (zh && hay.includes(norm(zh))) score += 5
  const en = norm(recipe.name)
    .split(" ")
    .filter((w) => w.length >= 3)
  const strong = en.filter((w) => w.length >= 4)
  for (const t of strong) if (hay.includes(t)) score += 2
  for (const t of en.filter((w) => w.length === 3)) if (hay.includes(t)) score += 1
  return score
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const withUrl = RECIPES.filter((r) => r.sourceUrl)
  const byUrl = new Map()
  for (const r of withUrl) {
    if (!byUrl.has(r.sourceUrl)) byUrl.set(r.sourceUrl, [])
    byUrl.get(r.sourceUrl).push(r)
  }
  const exclusiveOnly = Boolean(process.env.EXCLUSIVE_ONLY)
  const hostFilter = (process.env.HOST_FILTER || "").split(",").map((s) => s.trim()).filter(Boolean)
  const urls = [...byUrl.keys()].filter((url) => {
    if (exclusiveOnly && byUrl.get(url).length !== 1) return false
    if (hostFilter.length) {
      const host = new URL(url).hostname
      if (!hostFilter.some((h) => host.includes(h))) return false
    }
    return true
  })
  console.log(`recipes=${withUrl.length} uniqueUrls=${byUrl.size} fetchUrls=${urls.length} exclusiveOnly=${exclusiveOnly}`)

  let i = 0
  for (const url of urls) {
    i += 1
    if (cache[url]?.ingredients && cache[url]?.structured && !process.env.REFRESH) {
      process.stdout.write(`[${i}/${urls.length}] cache ${url}\n`)
      continue
    }
    process.stdout.write(`[${i}/${urls.length}] fetch ${url}\n`)
    await fetchSourceIngredients(url)
    await sleep(120)
  }

  const dishReports = []
  const gapCounter = new Map()

  for (const r of withUrl) {
    const src = cache[r.sourceUrl] || { ingredients: [], structured: [], title: null }
    const mapped = []
    for (const raw of src.ingredients || []) {
      const m = mapToCanonical(raw)
      if (m) mapped.push(m)
    }
    // dedupe by canonical
    const byCanon = new Map()
    for (const m of mapped) {
      if (!byCanon.has(norm(m.canonical))) byCanon.set(norm(m.canonical), m)
    }
    const sourceCanon = [...byCanon.values()]
    const have = [...r.need, ...r.optional]
    const missing = []
    for (const m of sourceCanon) {
      const hit = have.some((h) => sameFood(h, m.canonical) || norm(h) === norm(m.canonical) || norm(h) === norm(m.cleaned))
      if (!hit) missing.push(m)
    }
    const sourceNames = new Set(sourceCanon.map((m) => norm(m.canonical)))
    const hasSourceIngs = (src.ingredients || []).length > 0
    const extraNeed = []
    const extraOptional = []
    if (hasSourceIngs) {
      for (const h of r.need) {
        const shelf = findShelf(h)
        const key = norm(shelf?.name || h)
        if (!sourceNames.has(key)) extraNeed.push(shelf?.name || h)
      }
      for (const h of r.optional) {
        const shelf = findShelf(h)
        const key = norm(shelf?.name || h)
        if (!sourceNames.has(key)) extraOptional.push(shelf?.name || h)
      }
    }
    const score = titleMatchScore(r, src.title)
    const exclusive = byUrl.get(r.sourceUrl).length === 1
    for (const m of missing) {
      const key = m.canonical
      const prev = gapCounter.get(key) || { count: 0, staple: m.staple, examples: [] }
      prev.count += 1
      if (prev.examples.length < 5) prev.examples.push(r.id)
      gapCounter.set(key, prev)
    }

    // Build RecipeMaterial[] from structured SOURCE lines only (exclusive / title-tight).
    // Never re-append authored need/optional — that re-poisons materials with hallucinations
    // (e.g. Cooked rice on avocado toast, XO dump leftovers).
    const materials = []
    const seenMat = new Set()
    const structured = src.structured?.length ? src.structured : structureFromRawLines(src.ingredients || [])
    const titleMin = Number(process.env.TITLE_MIN || 4)
    const useMaterials = exclusive || score >= titleMin
    if (useMaterials) {
      for (const row of structured) {
        const mappedRow = mapToCanonical(row.name || row.raw)
        if (!mappedRow?.shelf && !mappedRow?.heuristic) continue
        if (!mappedRow.canonical) continue
        const key = norm(mappedRow.canonical)
        if (seenMat.has(key)) continue
        seenMat.add(key)
        const shelfFood = findShelf(mappedRow.canonical)
        const stapleFlag = Boolean(mappedRow.staple || shelfFood?.staple || isStaple(mappedRow.canonical))
        const cat = shelfFood?.category
        // Proteins / veg / carbs / dairy define the plate even when shelf.staple (e.g. Garlic).
        // Pantry sauces/spices stay staples.
        const definingCat = cat === "protein" || cat === "veg" || cat === "carb" || cat === "dairy"
        const role = definingCat ? "core" : stapleFlag ? "staple" : "core"
        materials.push({
          name: mappedRow.canonical,
          role,
          group: row.group || "main",
          amount: row.amount,
          unit: row.unit,
          note: row.note,
        })
      }
    }

    dishReports.push({
      id: r.id,
      name: r.name,
      zh: r.zh,
      file: r.file,
      sourceUrl: r.sourceUrl,
      sourceName: r.sourceName,
      sourceTitle: src.title,
      via: src.via,
      fetchError: src.error || null,
      titleScore: score,
      exclusive,
      tight: useMaterials,
      sharedWith: byUrl.get(r.sourceUrl).length,
      need: r.need,
      optional: r.optional,
      sourceIngredients: src.ingredients,
      sourceStructured: structured,
      sourceCanonical: sourceCanon.map((m) => m.canonical),
      materials: useMaterials && materials.length ? materials : null,
      materialsAmounted: useMaterials ? materials.filter((m) => m.amount != null).length : 0,
      materialsConfidence: useMaterials && materials.length ? (exclusive || score >= 6 ? "high" : "medium") : "low",
      missing: missing.map((m) => ({
        canonical: m.canonical,
        cleaned: m.cleaned,
        raw: m.raw,
        staple: m.staple,
        onShelf: m.shelf,
      })),
      missingCore: missing.filter((m) => !m.staple).map((m) => m.canonical),
      missingStaples: missing.filter((m) => m.staple).map((m) => m.canonical),
      extraNeed,
      extraOptional,
    })
  }

  const fetchedOk = dishReports.filter((d) => (d.sourceIngredients || []).length > 0)
  const fetchFail = dishReports.filter((d) => !(d.sourceIngredients || []).length)
  const tightMissing = dishReports.filter((d) => d.tight && d.missing.length)
  const topGaps = [...gapCounter.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 40)
    .map(([name, info]) => ({ name, ...info }))

  const summary = {
    totalHome: RECIPES.length,
    withSourceUrl: withUrl.length,
    uniqueUrls: byUrl.size,
    fetchedWithIngredients: fetchedOk.length,
    fetchEmpty: fetchFail.length,
    tightDishes: dishReports.filter((d) => d.tight).length,
    tightWithGaps: tightMissing.length,
    dishesWithAnyGap: dishReports.filter((d) => d.missing.length).length,
    tightWithExtraNeed: dishReports.filter((d) => d.tight && d.extraNeed?.length).length,
    materialsSuggested: dishReports.filter((d) => d.materials?.length).length,
    materialsWithAmounts: dishReports.filter((d) => (d.materialsAmounted || 0) > 0).length,
    materialsHigh: dishReports.filter((d) => d.materialsConfidence === "high").length,
    materialsMedium: dishReports.filter((d) => d.materialsConfidence === "medium").length,
    materialsLow: dishReports.filter((d) => d.materialsConfidence === "low").length,
    topGaps,
    byHost: {},
  }
  for (const d of dishReports) {
    const host = new URL(d.sourceUrl).hostname
    summary.byHost[host] = summary.byHost[host] || { dishes: 0, withIngs: 0, gaps: 0 }
    summary.byHost[host].dishes += 1
    if (d.sourceIngredients?.length) summary.byHost[host].withIngs += 1
    if (d.missing.length) summary.byHost[host].gaps += 1
  }

  const report = { summary, dishes: dishReports }
  writeFileSync(OUT, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(summary, null, 2))
  console.log("wrote", OUT)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
