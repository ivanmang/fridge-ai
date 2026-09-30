#!/usr/bin/env node
/**
 * Resolve dish-specific image URLs for every home-* recipe.
 * Priority:
 *   1) sourceUrl page og:image / schema image
 *   2) Openverse (CC) search — title must mention the dish
 *   3) Wikipedia summary thumbnail (confident match)
 *   4) Wikimedia Commons file search (filename must mention the dish)
 *
 * Never Unsplash category buckets.
 *
 * Usage: node scripts/resolve-recipe-images.mjs
 * Writes: /tmp/recipe-images-resolved.json
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs"

const RECIPES = JSON.parse(readFileSync("/tmp/home-recipes.json", "utf8"))
const OUT = "/tmp/recipe-images-resolved.json"
const CACHE = "/tmp/recipe-images-cache-v2.json"
const UA = "FridgeAI-recipe-media/1.2 (https://github.com/ivanmang/fridge-ai; dish photo backfill)"

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {}
const saveCache = () => writeFileSync(CACHE, JSON.stringify(cache, null, 2))

const STOP = new Set([
  "style", "simple", "skillet", "bowl", "with", "from", "dish", "home", "pan",
  "fried", "sauce", "soft", "cold", "boiled", "steamed", "stir", "fry",
  "and", "the", "for", "hk", "cooker", "one", "mild", "extra", "quick",
  "easy", "over", "into", "your", "this", "that", "like", "type",
])

function tokens(recipe) {
  const zhName = (recipe.zh || "").trim()
  const zh = []
  if (zhName) {
    // Strip trailing meal words for broader match, keep full name too
    const trimmed = zhName.replace(/[飯麵面汤湯粥煲蓋]$/u, "")
    if (trimmed && trimmed !== zhName && trimmed.length >= 2) zh.push(trimmed)
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
  for (const name of zh) {
    if (name.length >= 2 && hay.includes(name.toLowerCase())) return true
  }
  // Require distinctive English tokens in the title/caption
  const strong = en.filter((t) => t.length >= 4)
  if (strong.length >= 2) {
    const hits = strong.filter((t) => hay.includes(t))
    return hits.length >= 2
  }
  if (strong.length === 1) {
    return hay.includes(strong[0])
  }
  // Short tokens (egg, soy…) need a cuisine/dish cue + at least one token
  if (en.length >= 1 && en.some((t) => hay.includes(t))) {
    return /\b(dish|cuisine|food|recipe|salad|soup|stew|toast|noodle|rice|tofu|chicken|beef|pork|fish|egg|stir|fried|braised|steam)\b/i.test(
      hay,
    )
  }
  return false
}

function cleanUrl(u) {
  if (!u) return null
  try {
    let s = u.trim().replace(/&amp;/g, "&")
    const url = new URL(s)
    url.hash = ""
    ;["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach((k) => url.searchParams.delete(k))
    // Prefer https
    if (url.protocol === "http:") url.protocol = "https:"
    const out = url.toString()
    if (/\.svg(\?|$)/i.test(out)) return null
    return out
  } catch {
    return null
  }
}

async function fetchText(url, { timeout = 14000, accept = "*/*" } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: accept },
      redirect: "follow",
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

function extractOgImage(html) {
  const patterns = [
    /property=["']og:image:secure_url["']\s+content=["']([^"']+)["']/i,
    /property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /name=["']twitter:image(?::src)?["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+name=["']twitter:image(?::src)?["']/i,
    /itemprop=["']image["']\s+content=["']([^"']+)["']/i,
    /"image"\s*:\s*\[\s*"?(https?:\/\/[^"'\s]+)"?/,
    /"image"\s*:\s*"(https?:\/\/[^"]+)"/,
    /"thumbnailUrl"\s*:\s*"(https?:\/\/[^"]+)"/,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) {
      const u = cleanUrl(m[1])
      if (u) return u
    }
  }
  return null
}

async function fromSource(recipe) {
  if (!recipe.sourceUrl) return null
  const key = `src:${recipe.sourceUrl}`
  if (cache[key] !== undefined) return cache[key]
  try {
    const html = await fetchText(recipe.sourceUrl, { accept: "text/html,*/*" })
    const img = extractOgImage(html)
    cache[key] = img
      ? { image: img, via: "source-og", aboutUrl: recipe.sourceUrl, aboutName: recipe.sourceName || "" }
      : null
  } catch (e) {
    cache[key] = null
    console.warn("source fail", recipe.id, e.message)
  }
  return cache[key]
}

async function fromOpenverse(recipe) {
  const { zh, en } = tokens(recipe)
  const queries = []
  if (zh.length) queries.push(zh[zh.length - 1]) // full zh name
  queries.push(recipe.name)
  if (en.length >= 2) queries.push(en.slice(0, 3).join(" "))

  for (const query of queries) {
    const key = `ov:${query}`
    let results = cache[key]
    if (results === undefined) {
      try {
        const url =
          `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
          `&page_size=12&license_type=commercial,modification`
        const data = JSON.parse(await fetchText(url, { accept: "application/json" }))
        results = data.results || []
        cache[key] = results
      } catch (e) {
        cache[key] = []
        results = []
        console.warn("openverse fail", query, e.message)
      }
    }
    // Prefer Wikimedia, then Flickr; title must mention the dish
    const ranked = [...results].sort((a, b) => {
      const rank = (r) => ((r.source || "") === "wikimedia" ? 0 : (r.source || "") === "flickr" ? 1 : 2)
      return rank(a) - rank(b)
    })
    for (const r of ranked) {
      const title = `${r.title || ""} ${r.tags?.map?.((t) => t.name).join(" ") || ""}`
      if (!hayHasDish(recipe, title)) continue
      const image = cleanUrl(r.url || r.thumbnail)
      if (!image) continue
      // Skip tiny icons / logos
      if ((r.width && r.width < 200) || (r.height && r.height < 200)) continue
      return {
        image,
        via: `openverse:${r.source || "cc"}`,
        aboutUrl: r.foreign_landing_url || r.url,
        aboutName: r.source === "wikimedia" ? "Wikimedia Commons" : r.creator || "Openverse",
        wikiTitle: r.title,
      }
    }
  }
  return null
}

async function wikiSummary(lang, title) {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(" ", "_"))}`
  const key = `wiki:${lang}:${title}`
  if (cache[key] !== undefined) return cache[key]
  try {
    const data = JSON.parse(await fetchText(url, { accept: "application/json", timeout: 10000 }))
    if (data.type !== "standard") {
      cache[key] = null
      return null
    }
    const image = cleanUrl((data.thumbnail?.source || data.originalimage?.source || "").split("?")[0])
    const page = data.content_urls?.desktop?.page
    if (!image || !page) {
      cache[key] = null
      return null
    }
    cache[key] = {
      image,
      via: `wikipedia-${lang}`,
      aboutUrl: page,
      aboutName: lang === "zh" ? "維基百科" : "Wikipedia",
      wikiTitle: data.title,
      description: data.description || "",
      extract: data.extract || "",
    }
  } catch {
    cache[key] = null
  }
  return cache[key]
}

async function wikiSearch(lang, query) {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}` +
    `&srlimit=8&format=json&origin=*`
  const key = `ws:${lang}:${query}`
  if (cache[key] !== undefined) return cache[key]
  try {
    const data = JSON.parse(await fetchText(url, { accept: "application/json", timeout: 10000 }))
    cache[key] = (data.query?.search || []).map((r) => r.title)
  } catch {
    cache[key] = []
  }
  return cache[key]
}

async function fromWikipedia(recipe) {
  const { zh, en } = tokens(recipe)
  const queries = []
  for (const name of zh) queries.push({ lang: "zh", query: name })
  queries.push({ lang: "en", query: recipe.name.trim() })
  if (en.length >= 2) queries.push({ lang: "en", query: en.join(" ") })

  for (const { lang, query } of queries) {
    const titles = [query, ...(await wikiSearch(lang, query))]
    const seen = new Set()
    for (const title of titles) {
      if (!title || seen.has(title)) continue
      seen.add(title)
      const summary = await wikiSummary(lang, title)
      if (!summary) continue
      const blob = `${summary.wikiTitle} ${summary.description} ${summary.extract}`
      if (!hayHasDish(recipe, blob)) continue
      return summary
    }
  }
  return null
}

async function fromCommons(recipe) {
  const { zh, en } = tokens(recipe)
  const queries = [...zh, recipe.name, en.slice(0, 3).join(" ")].filter(Boolean)
  for (const query of queries) {
    const key = `commons:${query}`
    let files = cache[key]
    if (files === undefined) {
      try {
        const url =
          `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
          `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=16` +
          `&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=800&format=json&origin=*`
        const data = JSON.parse(await fetchText(url, { accept: "application/json", timeout: 12000 }))
        files = Object.values(data.query?.pages || {})
        cache[key] = files
      } catch {
        cache[key] = []
        files = []
      }
    }
    for (const page of files) {
      const title = page.title || ""
      const ii = (page.imageinfo || [])[0]
      if (!ii || !/^image\//.test(ii.mime || "")) continue
      const base = title.replace(/^File:/, "").replace(/\.[^.]+$/, "")
      if (!hayHasDish(recipe, base)) continue
      const image = cleanUrl((ii.thumburl || ii.url || "").split("?")[0])
      if (!image) continue
      return {
        image,
        via: "commons",
        aboutUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
        aboutName: "Wikimedia Commons",
        wikiTitle: title,
      }
    }
  }
  return null
}

/** Guess Made With Lau / Xiachufang-style pages from dish names (best-effort). */
async function fromGuessedSites(recipe) {
  const slug = recipe.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const guesses = [
    `https://www.madewithlau.com/recipes/${slug}`,
    `https://www.madewithlau.com/recipes/${slug.replace(/-stir-fry$/, "").replace(/-with-/g, "-")}`,
  ]
  // Xiachufang search page → first recipe og (search HTML)
  if (recipe.zh) {
    guesses.push(`https://www.xiachufang.com/search/?keyword=${encodeURIComponent(recipe.zh)}&cat=1001`)
  }
  for (const url of guesses) {
    const key = `guess:${url}`
    if (cache[key] !== undefined) {
      if (cache[key]) return cache[key]
      continue
    }
    try {
      const html = await fetchText(url, { timeout: 10000 })
      // Xiachufang search: pick first recipe link then would need second fetch — skip search pages
      if (url.includes("xiachufang.com/search")) {
        const m = html.match(/href="(\/recipe\/\d+\/)"/)
        if (m) {
          const recipeUrl = `https://www.xiachufang.com${m[1]}`
          const page = await fetchText(recipeUrl, { timeout: 10000 })
          const img = extractOgImage(page)
          if (img && hayHasDish(recipe, `${recipe.name} ${recipe.zh} ${html.slice(0, 500)}`)) {
            // For search hits, trust og if page title contains dish
            const titleM = page.match(/<title>([^<]+)/i)
            if (titleM && hayHasDish(recipe, titleM[1])) {
              const hit = { image: img, via: "xiachufang-og", aboutUrl: recipeUrl, aboutName: "下厨房" }
              cache[key] = hit
              return hit
            }
          }
        }
        cache[key] = null
        continue
      }
      // MWL: only accept if page looks like the dish (title)
      const titleM = html.match(/<title>([^<]+)/i)
      if (!titleM || /page not found|404/i.test(titleM[1])) {
        cache[key] = null
        continue
      }
      if (!hayHasDish(recipe, titleM[1])) {
        cache[key] = null
        continue
      }
      const img = extractOgImage(html)
      if (!img) {
        cache[key] = null
        continue
      }
      const hit = { image: img, via: "madewithlau-og", aboutUrl: url, aboutName: "Made With Lau" }
      cache[key] = hit
      return hit
    } catch {
      cache[key] = null
    }
  }
  return null
}

async function resolveOne(recipe) {
  const base = { id: recipe.id, name: recipe.name, zh: recipe.zh, sourceUrl: recipe.sourceUrl || "" }
  const src = await fromSource(recipe)
  if (src?.image) return { ...base, ...src }
  const guessed = await fromGuessedSites(recipe)
  if (guessed?.image) return { ...base, ...guessed }
  const ov = await fromOpenverse(recipe)
  if (ov?.image) return { ...base, ...ov }
  const wiki = await fromWikipedia(recipe)
  if (wiki?.image) return { ...base, ...wiki }
  const commons = await fromCommons(recipe)
  if (commons?.image) return { ...base, ...commons }
  return { ...base, image: null, via: "none" }
}

async function mapPool(items, concurrency, fn) {
  const out = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx], idx)
      if ((idx + 1) % 10 === 0) {
        saveCache()
        console.error(`… ${idx + 1}/${items.length}`)
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return out
}

const results = await mapPool(RECIPES, 5, resolveOne)
saveCache()
writeFileSync(OUT, JSON.stringify(results, null, 2))
const ok = results.filter((r) => r.image)
const by = {}
for (const r of results) {
  const k = (r.via || "none").split(":")[0]
  by[k] = (by[k] || 0) + 1
}
console.log(JSON.stringify({ total: results.length, withImage: ok.length, missing: results.length - ok.length, by }, null, 2))
const missing = results.filter((r) => !r.image)
writeFileSync("/tmp/recipe-images-missing.json", JSON.stringify(missing, null, 2))
console.log("missing written", missing.length)
