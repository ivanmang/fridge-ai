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
  // Knorr / LKK ZH lines often keep qty at the end: "牛蒡 1條", "蜆 2斤", "鹽 1茶匙"
  s = s.replace(
    /\s*[\d./½¼¾⅓⅔⅛⅜⅝⅞]+\s*(kg|g|grams?|oz|lb|cups?|tbsp|tsp|ml|l|湯匙|茶匙|杯|克|公斤|斤|兩|钱|錢|片|粒|隻|只|条|條|个|個|瓣|棵|根|匙|磅)?\s*$/i,
    "",
  )
  s = s.replace(/\s*(适量|適量|少許|少许|各少許|各少许)\s*$/i, "")
  s = s.replace(/,.*$/, "")
  s = s.replace(/\s+/g, " ").trim()
  // drop leading adjectives that confuse matching
  s = s.replace(/^(fresh|large|medium|small|lean|ripe|dried|ground|minced|sliced|chopped|cooked|raw|frozen|neutral|extra virgin)\s+/i, "")
  // Knorr group headers / brand stock powders / slurry labels
  if (/^(調味|调味|未分組|未分组|材料|醃料|腌料|配料|芡汁|芡|勾芡)$/u.test(s)) return ""
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
    [/^生粉|淀粉|澱粉|potato starch|corn ?starch|鷹粟粉|鹰粟粉$/, "Cornstarch"],
    [/^料酒|黄酒|紹興|绍兴$/, "Shaoxing wine"],
    [/^葱|蔥|青葱|青蔥|蔥花|葱花$/, "Spring onion"],
    [/^蒜|蒜头|蒜頭|蒜蓉|蒜香$/, "Garlic"],
    [/^姜|薑|薑片|姜片|薑蓉$/, "Ginger"],
    [/^胡椒|黑胡椒|白胡椒粉?|胡椒粉$/, "White pepper"],
    [/^醋|香醋|米醋|陈醋|陳醋$/, "Vinegar"],
    [/^蚝油|蠔油$/, "Oyster sauce"],
    [/^麻油|香油$/, "Sesame oil"],
    [/^鸡蛋|雞蛋|蛋|蛋花$/, "Eggs"],
    [/^番茄|西红柿|蕃茄$/, "Tomato"],
    [/^鸡粉|雞粉|鸡汤|雞湯|純味鮮雞粉|纯味鲜鸡粉|鮮雞粉|鲜鸡粉|家樂牌.*雞粉|家乐牌.*鸡粉|bouillon|chicken stock|chicken broth$/, "Chicken stock"],
    [/^蜆|蚬|蜆肉|蚬肉$/, "Clams"],
    [/^牛蒡$/, "Burdock"],
    [/^冬瓜$/, "Winter melon"],
    [/^金菇|金針菇|金针菇$/, "Enoki"],
    [/^肥牛$/, "Beef steak"],
    [/^烏冬|乌冬$/, "Udon"],
    [/^通粉|通心粉$/, "Macaroni"],
    [/^藜麥|藜麦$/, "Quinoa"],
    [/^秋葵$/, "Okra"],
    [/^淮山|鮮淮山|鲜淮山$/, "Chinese yam"],
    [/^馬蹄|马蹄$/, "Water chestnuts"],
    [/^百合$/, "Lily bulb"],
    [/^年糕$/, "Rice cakes"],
    [/^粉絲|粉丝$/, "Glass noodles"],
    [/^紫菜$/, "Nori"],
    [/^蝦米|虾米$/, "Dried shrimp"],
    [/^津白|大白菜|黃芽白|黄芽白$/, "Napa cabbage"],
    [/^白蘿蔔|白萝卜$/, "Daikon"],
    [/^豬軟骨|猪软骨|排骨|豬骨|猪骨$/, "Spare ribs"],
    [/^豬手|猪手|豬蹄|猪蹄$/, "Pork knuckle"],
    [/^沙薑|沙姜$/, "Sand ginger"],
    [/^雞柳|鸡柳$/, "Chicken breast"],
    [/^牛尾$/, "Beef steak"],
    [/^魚柳|鱼柳|魚腩|鱼腩$/, "White fish"],
    [/^雞翼|鸡翼$/, "Chicken wings"],
    [/^雞肉|鸡肉$/, "Chicken thighs"],
    [/^牛肉$/, "Beef steak"],
    [/^豬肉|猪肉|肉碎|肉片|肉絲|肉丝|肉粒|免治豬肉|免治猪肉|免治黑毛豬肉|免治黑毛猪肉$/, "Ground pork"],
    [/^叉燒醬|叉烧酱|叉燒醬料|叉烧酱料|金牌.*叉燒|李錦記.*叉燒$/, "Hoisin sauce"],
    [/^蛋白$/, "Eggs"],
    [/^瘦牛肉|牛肉絲|牛肉片|牛肉碎$/, "Beef steak"],
    [/^茄子$/, "Eggplant"],
    [/^雞湯|鸡汤$/, "Chicken stock"],
    [/^中筋麵粉|中筋面粉|麵粉|面粉$/, "Flour"],
    [/^紅燈籠椒|红灯笼椒|黃燈籠椒|黄灯笼椒|燈籠椒|灯笼椒$/, "Bell pepper"],
    [/^蒜蓉|蒜泥$/, "Garlic"],
    [/^乾冬菇|干冬菇|冬菇|香菇|蘑菇$/, "Mushroom"],
    [/^硬豆腐|嫩豆腐|豆腐$/, "Tofu"],
    [/^蝦仁|虾仁$/, "Shrimp"],
    [/^排骨$/, "Spare ribs"],
    [/^雞翼中|鸡翼中|鸡翅膀$/, "Chicken wings"],
    [/^沙茶醬|沙茶酱|沙爹醬|沙爹酱$/, "Satay sauce"],
    [/^花雕酒|绍兴酒|紹興酒|米酒$/, "Shaoxing wine"],
    [/^薑片|姜片$/, "Ginger"],
    [/^蔥|葱$/, "Spring onion"],
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
  const ld = parseJsonLdIngredients(html)
  if (ld.ingredients?.length) {
    return {
      title: ld.title || title,
      ingredients: ld.ingredients,
      structured: structureFromRawLines(ld.ingredients),
      via: "afterwork-jsonld",
    }
  }
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
  const STOP =
    /^(做法|步驟|步骤|烹調步驟|贴士|貼士|小貼士|厨具|廚具|厨具推介|廚具推介|本食譜|欢迎|歡迎|参观|參觀|Method|Directions|Hints?|Share|Related|Instagram|View this post|烹調時間|準備時間|難度)/i
  const START = /^(份量|材料|食材|配料|Ingredients|酱料|醬料|醃料|腌料)\b/i
  const ings = []
  let capture = false
  for (const line of lines) {
    if (START.test(line) || line === "材料" || line === "食材" || line === "配料" || line === "份量") {
      capture = true
      // heading-only line: keep capturing but don't treat heading as ingredient
      if (
        /[:：]$/.test(line) ||
        /^(份量|材料|食材|配料|Ingredients|酱料|醬料|醃料|腌料)$/i.test(line) ||
        /青醬[:：]?$/.test(line)
      ) {
        continue
      }
      // "材料：雞蛋 2隻" style — strip heading prefix and keep rest
      const rest = line.replace(/^(份量|材料|食材|配料|Ingredients|酱料|醬料|醃料|腌料)\s*[:：]?\s*/i, "").trim()
      if (rest && rest.length >= 2 && rest.length <= 60) {
        ings.push(rest.replace(/\s*[-–—]\s*/, " ").trim())
      }
      continue
    }
    if (!capture) continue
    if (STOP.test(line)) break
    if (line.length < 2 || line.length > 60) continue
    if (/https?:\/\//i.test(line)) continue
    if (/選購|網店|推介|Instagram|Share|Related|訂閱|Follow/.test(line)) continue
    // Prefer qty-looking or short food lines (often "蒜 - 2粒" or "雞蛋 2隻")
    if (
      /[-–—]/.test(line) ||
      /^[\d./½¼¾⅓⅔]/.test(line) ||
      /[克毫升湯匙茶匙杯片粒隻只勺匙磅斤條条個个瓣棵根適量适量少許]/.test(line) ||
      (line.length <= 24 && /[\u4e00-\u9fff]/.test(line))
    ) {
      ings.push(line.replace(/\s*[-–—]\s*/, " ").trim())
    }
  }
  return {
    title,
    ingredients: ings,
    structured: structureFromRawLines(ings),
    via: "afterwork-html",
  }
}

/** Generic Wayback fallback when live fetch returns empty / errors. */
async function fetchViaWayback(url) {
  let wb = null
  try {
    const availUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`
    const { text: availText } = await fetchText(availUrl, 25000)
    const snap = JSON.parse(availText)?.archived_snapshots?.closest
    if (snap?.available && snap?.url) wb = String(snap.url).replace(/^http:\/\//i, "https://")
  } catch {
    /* CDX */
  }
  if (!wb) {
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&filter=statuscode:200&limit=5`
    const { text: cdxText } = await fetchText(cdxUrl, 25000)
    const rows = JSON.parse(cdxText)
    const hits = (rows || []).slice(1).filter((r) => r[1] && r[2])
    hits.sort((a, b) => String(b[1]).localeCompare(String(a[1])))
    if (hits[0]) wb = `https://web.archive.org/web/${hits[0][1]}/${hits[0][2]}`
  }
  if (!wb) throw new Error("no Wayback snapshot")
  const { text } = await fetchText(wb, 45000)
  return text
}

/** Knorr HK blocks live fetches (403). Prefer Wayback snapshot + JSON-LD. */
async function fetchKnorrViaWayback(url) {
  let wb = null
  try {
    const availUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`
    const { text: availText } = await fetchText(availUrl, 25000)
    const snap = JSON.parse(availText)?.archived_snapshots?.closest
    if (snap?.available && snap?.url) wb = String(snap.url).replace(/^http:\/\//i, "https://")
  } catch {
    /* fall through to CDX */
  }
  if (!wb) {
    // available API sometimes misses snapshots that CDX still lists
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&filter=statuscode:200&limit=5`
    const { text: cdxText } = await fetchText(cdxUrl, 25000)
    const rows = JSON.parse(cdxText)
    // [header, ...rows]; pick newest timestamp
    const hits = (rows || []).slice(1).filter((r) => r[1] && r[2])
    hits.sort((a, b) => String(b[1]).localeCompare(String(a[1])))
    if (hits[0]) {
      const ts = hits[0][1]
      const original = hits[0][2]
      wb = `https://web.archive.org/web/${ts}/${original}`
    }
  }
  if (!wb) throw new Error("Knorr: no Wayback snapshot")
  const { text } = await fetchText(wb, 45000)
  if (/Access Denied/i.test(text) && text.length < 2000) throw new Error("Knorr Wayback access denied")
  const ld = parseJsonLdIngredients(text)
  if (ld.ingredients?.length) {
    const ingredients = ld.ingredients.filter(
      (x) => !/^(調味|调味|未分組|未分组)$/u.test(String(x).trim()),
    )
    return {
      title: ld.title,
      ingredients,
      structured: structureFromRawLines(ingredients, ["調味", "调味", "未分組", "未分组", "材料"]),
      via: "knorr-wayback-jsonld",
    }
  }
  const plain = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
  const lines = plain
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
  const ings = []
  let capture = false
  for (const line of lines) {
    if (line === "材料" || line.startsWith("材料")) {
      capture = true
      continue
    }
    if (!capture) continue
    if (/^(做法|步驟|步骤|營養|营养|探索)/.test(line)) break
    if (/^(調味|调味|未分組|未分组)$/.test(line)) continue
    if (line.length < 2 || line.length > 40) continue
    ings.push(line)
  }
  const titleMatch = text.match(/<title>([^<]+)/i)
  return {
    title: titleMatch ? titleMatch[1].replace(/\s*[|｜].*$/, "").trim() : null,
    ingredients: ings,
    structured: structureFromRawLines(ings, ["調味", "调味"]),
    via: "knorr-wayback-html",
  }
}

function parseByHost(host, text) {
  if (host.includes("madewithlau.com") || host.includes("bbc.co.uk")) {
    const result = parseJsonLdIngredients(text)
    result.structured = structureFromRawLines(result.ingredients)
    result.via = "json-ld"
    return result
  }
  if (host.includes("lkk.com")) {
    const result = parseLkkIngredients(text)
    result.structured = structureFromRawLines(result.ingredients, ["醃料", "调味料", "調味料", "材料"])
    result.via = "lkk-html"
    return result
  }
  if (host.includes("daydaycook.com")) return parseDdcIngredients(text)
  if (host.includes("afterwork-kitchen.com")) return parseAfterworkIngredients(text)
  let result = parseJsonLdIngredients(text)
  if (!result.ingredients?.length) result = parseWprmFromHtml(text)
  if (!result.structured?.length) result.structured = structureFromRawLines(result.ingredients)
  result.via = "generic"
  return result
}

async function fetchSourceIngredients(url) {
  if (cache[url]?.ingredients && cache[url]?.structured && !process.env.REFRESH) return cache[url]
  const host = new URL(url).hostname
  let result
  try {
    if (host.includes("thewoksoflife.com")) {
      result = await fetchWolViaWp(url)
    } else if (host.includes("knorr.com")) {
      result = await fetchKnorrViaWayback(url)
    } else {
      const { text } = await fetchText(url)
      result = parseByHost(host, text)
      // Empty live parse → try Wayback snapshot (Afterwork / LKK / flaky hosts)
      if (!(result.ingredients || []).length) {
        try {
          const wbHtml = await fetchViaWayback(url)
          const wb = parseByHost(host, wbHtml)
          if ((wb.ingredients || []).length) {
            wb.via = `${wb.via || "parse"}-wayback`
            result = wb
          }
        } catch (wbErr) {
          result.error = result.error || String(wbErr.message || wbErr)
        }
      }
    }
  } catch (err) {
    // Live fetch failed — last chance Wayback for non-Knorr
    try {
      if (!host.includes("knorr.com") && !host.includes("thewoksoflife.com")) {
        const wbHtml = await fetchViaWayback(url)
        result = parseByHost(host, wbHtml)
        result.via = `${result.via || "parse"}-wayback`
      } else {
        throw err
      }
    } catch (wbErr) {
      result = {
        title: null,
        ingredients: [],
        structured: [],
        error: String(err.message || err) + (wbErr ? `; wb: ${wbErr.message || wbErr}` : ""),
        via: "error",
      }
    }
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
  // Full ZH dish name on the page is a strong exclusive-quality signal.
  if (zh && zh.length >= 2 && hay.includes(norm(zh))) score += 6
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
