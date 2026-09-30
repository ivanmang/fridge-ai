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
  return STAPLE_KEYS.some((k) => n === k || n.includes(k) || k.includes(n))
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
  const shelf = findShelf(cleaned)
  if (shelf) return { canonical: shelf.name, raw: rawName, cleaned, shelf: true, staple: isStaple(shelf.name) || isStaple(cleaned) }

  // heuristic canonical for common unlisted staples
  const n = norm(cleaned)
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
  ]
  for (const [re, canonical] of heuristics) {
    if (re.test(n) || re.test(cleaned)) {
      return { canonical, raw: rawName, cleaned, shelf: Boolean(findShelf(canonical)), staple: true, heuristic: true }
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
  const names = [...html.matchAll(/wprm-recipe-ingredient-name[^>]*>([\s\S]*?)<\/span>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").trim(),
  )
  const titleMatch =
    html.match(/wprm-recipe-name[^>]*>([\s\S]*?)<\/[^>]+>/i) || html.match(/<title>([^<]+)/i)
  return {
    title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : null,
    ingredients: names.filter(Boolean),
  }
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
    const ings = flat.filter((x) => x.type === "ingredient" || x.name).map((x) => x.name).filter(Boolean)
    return { title: hit.recipe?.name || hit.title?.rendered, ingredients: ings, via: "wprm_recipe" }
  }
  throw new Error("WOL not found via WP API")
}

async function fetchSourceIngredients(url) {
  if (cache[url]?.ingredients) return cache[url]
  const host = new URL(url).hostname
  let result
  try {
    if (host.includes("thewoksoflife.com")) {
      result = await fetchWolViaWp(url)
    } else {
      const { text } = await fetchText(url)
      if (host.includes("madewithlau.com") || host.includes("bbc.co.uk")) {
        result = parseJsonLdIngredients(text)
        result.via = "json-ld"
      } else if (host.includes("lkk.com")) {
        result = parseLkkIngredients(text)
        result.via = "lkk-html"
      } else {
        result = parseJsonLdIngredients(text)
        if (!result.ingredients?.length) result = parseWprmFromHtml(text)
        result.via = "generic"
      }
    }
  } catch (err) {
    result = { title: null, ingredients: [], error: String(err.message || err), via: "error" }
  }
  cache[url] = {
    title: result.title || null,
    ingredients: result.ingredients || [],
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
  console.log(`recipes=${withUrl.length} uniqueUrls=${byUrl.size}`)

  let i = 0
  for (const url of byUrl.keys()) {
    i += 1
    if (cache[url]?.ingredients && !process.env.REFRESH) {
      process.stdout.write(`[${i}/${byUrl.size}] cache ${url}\n`)
      continue
    }
    process.stdout.write(`[${i}/${byUrl.size}] fetch ${url}\n`)
    await fetchSourceIngredients(url)
    await sleep(120)
  }

  const dishReports = []
  const gapCounter = new Map()

  for (const r of withUrl) {
    const src = cache[r.sourceUrl] || { ingredients: [], title: null }
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
    const score = titleMatchScore(r, src.title)
    const exclusive = byUrl.get(r.sourceUrl).length === 1
    const tight = exclusive || score >= 4
    for (const m of missing) {
      const key = m.canonical
      const prev = gapCounter.get(key) || { count: 0, staple: m.staple, examples: [] }
      prev.count += 1
      if (prev.examples.length < 5) prev.examples.push(r.id)
      gapCounter.set(key, prev)
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
      tight,
      sharedWith: byUrl.get(r.sourceUrl).length,
      need: r.need,
      optional: r.optional,
      sourceIngredients: src.ingredients,
      sourceCanonical: sourceCanon.map((m) => m.canonical),
      missing: missing.map((m) => ({
        canonical: m.canonical,
        cleaned: m.cleaned,
        raw: m.raw,
        staple: m.staple,
        onShelf: m.shelf,
      })),
      missingCore: missing.filter((m) => !m.staple).map((m) => m.canonical),
      missingStaples: missing.filter((m) => m.staple).map((m) => m.canonical),
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
