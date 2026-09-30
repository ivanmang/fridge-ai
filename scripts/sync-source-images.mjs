#!/usr/bin/env node
/**
 * Bind every home-* photo to og/featured image from its recipe sourceUrl.
 * Also upgrades weak proximity sources via Woks WP search / MWL slug when title matches.
 * Never Google / ?s= search URLs.
 *
 * Usage:
 *   node scripts/export-home-recipes.mjs   # writes /tmp/home-recipes.json
 *   node scripts/sync-source-images.mjs
 *
 * Writes:
 *   /tmp/source-images-sync.json
 *   updates src/lib/recipe-sources.ts RECIPE_SOURCES values when improved
 *   regenerates src/lib/recipe-media.ts RECIPE_IMAGES from source pages
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"

const RECIPES = JSON.parse(readFileSync("/tmp/home-recipes.json", "utf8"))
const OUT = "/tmp/source-images-sync.json"
const CACHE = "/tmp/source-images-cache.json"
const UA =
  "Mozilla/5.0 (compatible; FridgeAI/1.3; +https://github.com/ivanmang/fridge-ai)"

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {}
const saveCache = () => writeFileSync(CACHE, JSON.stringify(cache, null, 2))

const STOP = new Set([
  "style", "simple", "home", "pan", "fried", "sauce", "soft", "cold", "boiled",
  "steamed", "stir", "fry", "and", "the", "for", "hk", "with", "from", "dish",
  "bowl", "over", "into", "mild", "extra", "quick", "easy", "recipe", "recipes",
  "chinese", "korean", "japanese", "thai", "how", "make", "best", "easy",
])

function tokens(recipe) {
  const zhName = (recipe.zh || "").trim()
  const zh = []
  if (zhName) {
    const trimmed = zhName.replace(/[飯麵面汤湯粥煲蓋风風]$/u, "")
    if (trimmed?.length >= 2) zh.push(trimmed)
    zh.push(zhName)
  }
  const en = recipe.name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
  return { zh, en }
}

function hayHasDish(recipe, hayRaw) {
  const hay = (hayRaw || "").toLowerCase()
  const { zh, en } = tokens(recipe)
  for (const name of zh) if (name.length >= 2 && hay.includes(name.toLowerCase())) return true
  const strong = en.filter((t) => t.length >= 4)
  if (strong.length >= 2) return strong.filter((t) => hay.includes(t)).length >= Math.min(2, strong.length)
  if (strong.length === 1) return hay.includes(strong[0])
  return en.length >= 1 && en.some((t) => hay.includes(t))
}

function scoreTitle(recipe, title) {
  const hay = (title || "").toLowerCase()
  const { zh, en } = tokens(recipe)
  let score = 0
  for (const name of zh) if (name.length >= 2 && hay.includes(name.toLowerCase())) score += 5
  const strong = en.filter((t) => t.length >= 4)
  for (const t of strong) if (hay.includes(t)) score += 2
  for (const t of en.filter((x) => x.length === 3)) if (hay.includes(t)) score += 1
  // penalize listicles / ingredients
  if (/\b(what to do|list of|guide to|how to use)\b/i.test(title)) score -= 5
  return score
}

function isForbiddenUrl(url) {
  try {
    const u = new URL(url)
    if (/google\./i.test(u.hostname)) return true
    if (u.searchParams.has("s") || u.searchParams.has("q") || u.searchParams.has("keyword")) return true
    if (/\/search\/?/i.test(u.pathname)) return true
    return false
  } catch {
    return true
  }
}

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
    const parts = u.pathname.split("/").filter(Boolean)
    return parts[0] || null
  } catch {
    return null
  }
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9,zh-HK;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { html: await res.text(), finalUrl: res.url }
}

function extractOg(html) {
  const patterns = [
    /property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+name=["']twitter:image["']/i,
    /"image"\s*:\s*"(https?:[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
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
  if (!url || isForbiddenUrl(url)) return null
  const key = `img:${url}`
  if (cache[key] !== undefined) return cache[key]

  // Woks: WP API (HTML is Cloudflare 403)
  const slug = woksSlug(url)
  if (slug) {
    try {
      const posts = await fetchJson(
        `https://thewoksoflife.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1`,
      )
      const p = posts?.[0]
      const media =
        p?._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        p?.yoast_head_json?.og_image?.[0]?.url ||
        null
      if (media) {
        cache[key] = media
        return media
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const { html } = await fetchHtml(url)
    const img = extractOg(html)
    cache[key] = img
    return img
  } catch {
    cache[key] = null
    return null
  }
}

async function searchWoks(recipe) {
  const q = recipe.name.replace(/\b(home|style|ish)\b/gi, " ").replace(/\s+/g, " ").trim()
  const key = `woksSearch:${q}`
  if (cache[key] !== undefined) return cache[key]
  try {
    const hits = await fetchJson(
      `https://thewoksoflife.com/wp-json/wp/v2/search?search=${encodeURIComponent(q)}&per_page=8&type=post`,
    )
    let best = null
    let bestScore = 0
    for (const h of hits || []) {
      if (isForbiddenUrl(h.url)) continue
      const s = scoreTitle(recipe, h.title || "")
      if (s > bestScore) {
        bestScore = s
        best = { url: h.url.split("?")[0], title: h.title, score: s }
      }
    }
    // require a real match
    if (!best || bestScore < 4) {
      cache[key] = null
      return null
    }
    cache[key] = best
    return best
  } catch {
    cache[key] = null
    return null
  }
}

function slugs(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const out = new Set([base])
  out.add(base.replace(/-stir-fry$/, "").replace(/-stirfry$/, ""))
  out.add(base.replace(/-with-/g, "-"))
  out.add(base.replace(/-home$/, "").replace(/-style$/, "").replace(/-ish$/, ""))
  out.add(base.replace(/^hk-/, ""))
  const parts = base.split("-").filter(Boolean)
  if (parts.length >= 3) out.add(parts.slice(0, 3).join("-"))
  if (parts.length >= 2) out.add(parts.slice(0, 2).join("-"))
  return [...out].filter((s) => s.length >= 4)
}

async function tryMwl(recipe) {
  for (const slug of slugs(recipe.name)) {
    const url = `https://www.madewithlau.com/recipes/${slug}`
    const key = `mwl:${slug}`
    if (cache[key] !== undefined) {
      if (cache[key]) return cache[key]
      continue
    }
    try {
      const { html, finalUrl } = await fetchHtml(url)
      if (isForbiddenUrl(finalUrl)) {
        cache[key] = null
        continue
      }
      const title = html.match(/<title>([^<]+)/i)?.[1] || ""
      if (/page not found|404|error/i.test(title)) {
        cache[key] = null
        continue
      }
      if (!hayHasDish(recipe, title)) {
        cache[key] = null
        continue
      }
      const hit = { url: finalUrl.split("?")[0], title, score: scoreTitle(recipe, title) }
      cache[key] = hit
      return hit
    } catch {
      cache[key] = null
    }
  }
  return null
}

async function titleOfSource(url) {
  const key = `title:${url}`
  if (cache[key] !== undefined) return cache[key]
  const slug = woksSlug(url)
  if (slug) {
    try {
      const posts = await fetchJson(
        `https://thewoksoflife.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}`,
      )
      const t = posts?.[0]?.title?.rendered?.replace(/<[^>]+>/g, "") || null
      cache[key] = t
      return t
    } catch {
      /* fall through */
    }
  }
  try {
    const { html } = await fetchHtml(url)
    const t = html.match(/<title>([^<]+)/i)?.[1]?.replace(/\s*[|\-–].*$/, "").trim() || null
    cache[key] = t
    return t
  } catch {
    cache[key] = null
    return null
  }
}

async function pickSource(recipe) {
  const current = recipe.sourceUrl && !isForbiddenUrl(recipe.sourceUrl) ? recipe.sourceUrl : null
  let currentScore = 0
  if (current) {
    const title = await titleOfSource(current)
    currentScore = title ? scoreTitle(recipe, title) : 0
  }

  // Prefer exact Woks / MWL matches when current is weak
  let best = current
    ? { url: current, name: recipe.sourceName || publisherOf(current), score: currentScore, via: "existing" }
    : null

  if (!best || best.score < 4) {
    const woks = await searchWoks(recipe)
    if (woks && (!best || woks.score > best.score)) {
      best = { url: woks.url, name: "The Woks of Life", score: woks.score, via: "woks-search", title: woks.title }
    }
  }
  if (!best || best.score < 4) {
    const mwl = await tryMwl(recipe)
    if (mwl && (!best || mwl.score > best.score)) {
      best = { url: mwl.url, name: "Made With Lau", score: mwl.score, via: "mwl-slug", title: mwl.title }
    }
  }

  // Keep existing even if weak — still a direct page (never invent search)
  if (!best && current) {
    best = { url: current, name: recipe.sourceName || publisherOf(current), score: currentScore, via: "existing-weak" }
  }
  return best
}

const results = []
let i = 0
async function worker() {
  while (i < RECIPES.length) {
    const idx = i++
    const recipe = RECIPES[idx]
    try {
      const src = await pickSource(recipe)
      let image = null
      if (src?.url) image = await imageFromSource(src.url)
      results[idx] = {
        id: recipe.id,
        name: recipe.name,
        sourceUrl: src?.url || null,
        sourceName: src?.name || null,
        sourceScore: src?.score ?? 0,
        sourceVia: src?.via || null,
        image,
        imageVia: image ? "source-page" : null,
        prevSource: recipe.sourceUrl || null,
      }
    } catch (err) {
      results[idx] = {
        id: recipe.id,
        name: recipe.name,
        error: String(err?.message || err),
        sourceUrl: recipe.sourceUrl || null,
        image: null,
      }
    }
    if ((idx + 1) % 25 === 0) {
      saveCache()
      const ok = results.filter((r) => r?.image).length
      console.error(`… ${idx + 1}/${RECIPES.length} images ${ok}`)
    }
  }
}

await Promise.all(Array.from({ length: 6 }, () => worker()))
saveCache()
writeFileSync(OUT, JSON.stringify(results, null, 2))
const withImg = results.filter((r) => r.image).length
const upgraded = results.filter((r) => r.sourceUrl && r.prevSource && r.sourceUrl !== r.prevSource).length
const weak = results.filter((r) => (r.sourceScore ?? 0) < 4).length
console.log(JSON.stringify({ total: results.length, withImg, upgraded, weakKeep: weak, out: OUT }, null, 2))
