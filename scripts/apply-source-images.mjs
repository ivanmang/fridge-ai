#!/usr/bin/env node
/**
 * Apply source-page photos + curated exact source upgrades.
 * - Photos always come from the dish's recipe sourceUrl (Woks via WP API).
 * - Only curated / strong title matches upgrade sourceUrl (never Google/?s=).
 */
import { readFileSync, writeFileSync } from "node:fs"

const RECIPES = JSON.parse(readFileSync("/tmp/home-recipes.json", "utf8"))
const SYNC = JSON.parse(readFileSync("/tmp/source-images-sync.json", "utf8"))
const CACHE = JSON.parse(readFileSync("/tmp/source-images-cache.json", "utf8"))
const UA = "Mozilla/5.0 (compatible; FridgeAI/1.3; +https://github.com/ivanmang/fridge-ai)"

/** Exact classic pages (verified direct recipe URLs). */
const CURATED = {
  "home-bibimbap": { url: "https://thewoksoflife.com/easy-beef-bibimbap-recipe/", name: "The Woks of Life" },
  "home-yakisoba": { url: "https://thewoksoflife.com/vegetable-yakisoba/", name: "The Woks of Life" },
  "home-bulgogi-beef": { url: "https://thewoksoflife.com/bulgogi-bowls/", name: "The Woks of Life" },
  "home-pad-thai": { url: "https://thewoksoflife.com/pad-thai/", name: "The Woks of Life" },
  "home-tom-yum": { url: "https://thewoksoflife.com/tom-yum-soup/", name: "The Woks of Life" },
  "home-san-bei-chicken": { url: "https://thewoksoflife.com/three-cup-chicken-san-bei-ji/", name: "The Woks of Life" },
  "home-lu-rou-fan": { url: "https://thewoksoflife.com/lu-rou-fan-taiwanese-braised-pork-rice-bowl/", name: "The Woks of Life" },
  "home-shakshuka": { url: "https://thewoksoflife.com/shakshuka/", name: "The Woks of Life" },
  "home-garlic-pak-choi": { url: "https://thewoksoflife.com/garlic-baby-bok-choy/", name: "The Woks of Life" },
  "home-garlic-choi-sum": { url: "https://thewoksoflife.com/yu-choy-recipe/", name: "The Woks of Life" },
  "home-oyster-choi-sum": { url: "https://thewoksoflife.com/a-choy-garlic-oyster-sauce/", name: "The Woks of Life" },
  "home-ginger-choi-sum": { url: "https://thewoksoflife.com/yu-choy-recipe/", name: "The Woks of Life" },
  "home-oyster-gai-lan": { url: "https://thewoksoflife.com/chinese-broccoli-with-oyster-sauce/", name: "The Woks of Life" },
  "home-scallion-noodles": { url: "https://thewoksoflife.com/soy-scallion-noodles-cong-ban-mian/", name: "The Woks of Life" },
  "home-beef-snow-peas": { url: "https://thewoksoflife.com/beef-snow-peas/", name: "The Woks of Life" },
  "home-cabbage-stirfry": { url: "https://thewoksoflife.com/stir-fried-cabbage-glass-noodles/", name: "The Woks of Life" },
  "home-french-toast": { url: "https://thewoksoflife.com/stuffed-french-toast/", name: "The Woks of Life" },
  "home-luncheon-fried-rice": { url: "https://thewoksoflife.com/spam-fried-rice/", name: "The Woks of Life" },
  "home-mapo-tofu": { url: "https://thewoksoflife.com/ma-po-tofu-real-deal/", name: "The Woks of Life" },
  "home-vegan-mapo-tofu": { url: "https://thewoksoflife.com/vegan-mapo-tofu/", name: "The Woks of Life" },
  "home-garlic-eggplant": { url: "https://thewoksoflife.com/chinese-eggplant-garlic-sauce/", name: "The Woks of Life" },
  "home-lo-mein": { url: "https://thewoksoflife.com/vegetable-lo-mein/", name: "The Woks of Life" },
  "home-mushroom-bok-choy": { url: "https://thewoksoflife.com/braised-chinese-mushrooms-bok-choy/", name: "The Woks of Life" },
  "home-chili-oil-wonton": { url: "https://thewoksoflife.com/sichuan-spicy-wontons/", name: "The Woks of Life" },
  "home-japanese-curry-rice": { url: "https://thewoksoflife.com/chicken-katsu-curry-rice/", name: "The Woks of Life" },
  "home-eggplant-mince": { url: "https://thewoksoflife.com/braised-eggplant-pork/", name: "The Woks of Life" },
  "home-grilled-cheese": { url: "https://thewoksoflife.com/green-eggs-ham-grilled-cheese/", name: "The Woks of Life" },
  "home-grilled-cheese-tomato": { url: "https://thewoksoflife.com/ratatouille-grilled-cheese/", name: "The Woks of Life" },
  "home-leftover-veg-pancake": { url: "https://thewoksoflife.com/vegetable-pancakes/", name: "The Woks of Life" },
  "home-zucchini-noodles-stir": { url: "https://thewoksoflife.com/zucchini-glass-noodles/", name: "The Woks of Life" },
  "home-thai-coconut-noodles": { url: "https://thewoksoflife.com/chicken-khao-soi/", name: "The Woks of Life" },
  "home-cumin-lamb": { url: "https://thewoksoflife.com/cumin-lamb-burgers/", name: "The Woks of Life" },
}

// Strong auto upgrades from sync (score >= 6) excluding known regressions
const STRONG_OK = new Set([
  "home-beef-snow-peas",
  "home-eggplant-mince",
])
// Do NOT auto-upgrade steamed eggs away from Made With Lau exact page
const BLOCK_UPGRADE = new Set([
  "home-steamed-eggs",
  "home-pumpkin-rice", // chinese pumpkin cake is dessert, not rice
  "home-bacon-pasta",
  "home-yogurt-berry-bowl",
  "home-bean-tomato-stew",
  "home-chicken-salad",
  "home-scrambled-egg-toast",
  "home-instant-noodles-egg",
  "home-potato-chicken",
  "home-steamed-tofu-pork",
  "home-chicken-mushroom-tofu",
  "home-braised-tofu-chicken",
  "home-tuna-pasta",
  "home-no-red-meat-pasta",
  "home-peanut-cabbage-salad",
  "home-sweet-potato-stirfry",
  "home-tomato-pork-chops",
  "home-vietnamese-caramel-pork",
  "home-taiwanese-cabbage-pork",
  "home-shrimp-wonton",
  "home-pork-cabbage",
  "home-sour-cabbage-pork",
  "home-bean-sprout-stirfry",
  "home-garlic-snow-peas",
  "home-egg-tofu-stew",
  "home-tomato-egg-veg-soup",
  "home-dried-mushroom-greens",
  "home-shrimp-glass-noodles",
  "home-leftover-veggie-soup-clear",
])

function publisherOf(url) {
  try {
    const h = new URL(url).hostname
    if (h.includes("madewithlau")) return "Made With Lau"
    if (h.includes("thewoksoflife")) return "The Woks of Life"
    if (h.includes("bbc.")) return "BBC Food"
    if (h.includes("lkk.com")) return "Lee Kum Kee"
    if (h.includes("xiachufang")) return "下厨房"
  } catch {
    /* ignore invalid URL */
  }
  return "Recipe"
}

function woksSlug(url) {
  try {
    const u = new URL(url)
    if (!u.hostname.includes("thewoksoflife")) return null
    return u.pathname.split("/").filter(Boolean)[0] || null
  } catch {
    return null
  }
}

function extractOg(html) {
  const patterns = [
    /property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+name=["']twitter:image["']/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) {
      let img = m[1].replace(/&amp;/g, "&")
      if (img.startsWith("//")) img = "https:" + img
      return img
    }
  }
  return null
}

async function imageFromSource(url) {
  if (!url) return null
  const key = `img:${url}`
  if (CACHE[key]) return CACHE[key]
  if (CACHE[key] === null) {
    /* retry nulls below */
  }

  const slug = woksSlug(url)
  if (slug) {
    try {
      const posts = await (
        await fetch(
          `https://thewoksoflife.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1`,
          { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(15000) },
        )
      ).json()
      const p = posts?.[0]
      const media =
        p?._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        p?.yoast_head_json?.og_image?.[0]?.url ||
        null
      if (media) {
        CACHE[key] = media
        return media
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      CACHE[key] = null
      return null
    }
    const img = extractOg(await res.text())
    CACHE[key] = img
    return img
  } catch {
    CACHE[key] = null
    return null
  }
}

function pickSource(recipe, syncRow) {
  if (CURATED[recipe.id]) return { ...CURATED[recipe.id], via: "curated" }
  if (
    syncRow?.sourceUrl &&
    syncRow.prevSource &&
    syncRow.sourceUrl !== syncRow.prevSource &&
    (syncRow.sourceScore || 0) >= 6 &&
    STRONG_OK.has(recipe.id) &&
    !BLOCK_UPGRADE.has(recipe.id)
  ) {
    return { url: syncRow.sourceUrl, name: syncRow.sourceName || publisherOf(syncRow.sourceUrl), via: "strong-sync" }
  }
  // Keep existing verified source
  return {
    url: recipe.sourceUrl,
    name: recipe.sourceName || publisherOf(recipe.sourceUrl),
    via: "existing",
  }
}

const byId = Object.fromEntries(SYNC.map((r) => [r.id, r]))
const final = []

for (const recipe of RECIPES) {
  const src = pickSource(recipe, byId[recipe.id])
  final.push({
    id: recipe.id,
    name: recipe.name,
    sourceUrl: src.url,
    sourceName: src.name,
    sourceVia: src.via,
    prevSource: recipe.sourceUrl,
    prevImage: recipe.prevImage,
  })
}

// Fetch images for unique source URLs
const uniqueUrls = [...new Set(final.map((r) => r.sourceUrl).filter(Boolean))]
console.error(`Fetching images for ${uniqueUrls.length} unique source pages…`)
let ui = 0
async function worker() {
  while (ui < uniqueUrls.length) {
    const idx = ui++
    const url = uniqueUrls[idx]
    await imageFromSource(url)
    if ((idx + 1) % 20 === 0) console.error(`… ${idx + 1}/${uniqueUrls.length}`)
  }
}
await Promise.all(Array.from({ length: 8 }, () => worker()))
writeFileSync("/tmp/source-images-cache.json", JSON.stringify(CACHE, null, 2))

let withImg = 0
let upgraded = 0
for (const row of final) {
  row.image = CACHE[`img:${row.sourceUrl}`] || null
  if (row.image) withImg++
  if (row.sourceUrl !== row.prevSource) upgraded++
}

writeFileSync("/tmp/source-images-final.json", JSON.stringify(final, null, 2))
console.log(JSON.stringify({ total: final.length, withImg, upgraded, uniqueSources: uniqueUrls.length }, null, 2))

const miss = final.filter((r) => !r.image)
if (miss.length) {
  console.error("Still missing images:", miss.map((m) => m.id + " " + m.sourceUrl).join("\n"))
}
