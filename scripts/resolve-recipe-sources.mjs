#!/usr/bin/env node
/**
 * Find verified direct recipe page URLs (never Google / ?s= /search).
 * Sites: Made With Lau, Xiachufang recipe pages, BBC Food, LKK when guessable.
 * Writes /tmp/recipe-sources-resolved.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"

const RECIPES = JSON.parse(readFileSync("/tmp/home-recipes.json", "utf8"))
const OUT = "/tmp/recipe-sources-resolved.json"
const CACHE = "/tmp/recipe-sources-cache.json"
const UA = "FridgeAI-recipe-sources/1.0 (https://github.com/ivanmang/fridge-ai)"
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {}
const save = () => writeFileSync(CACHE, JSON.stringify(cache, null, 2))

const STOP = new Set([
  "style","simple","home","pan","fried","sauce","soft","cold","boiled","steamed","stir","fry",
  "and","the","for","hk","with","from","dish","bowl","over","into","mild","extra","quick","easy",
])

function tokens(recipe) {
  const zhName = (recipe.zh || "").trim()
  const zh = []
  if (zhName) {
    const trimmed = zhName.replace(/[飯麵面汤湯粥煲蓋风風]$/u, "")
    if (trimmed?.length >= 2) zh.push(trimmed)
    zh.push(zhName)
  }
  const en = recipe.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w))
  return { zh, en }
}

function hayHasDish(recipe, hayRaw) {
  const hay = (hayRaw || "").toLowerCase()
  const { zh, en } = tokens(recipe)
  for (const name of zh) if (name.length >= 2 && hay.includes(name.toLowerCase())) return true
  const strong = en.filter((t) => t.length >= 4)
  if (strong.length >= 2) return strong.filter((t) => hay.includes(t)).length >= 2
  if (strong.length === 1) return hay.includes(strong[0])
  return en.length >= 1 && en.some((t) => hay.includes(t))
}

async function fetchText(url, timeout = 12000) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { html: await res.text(), finalUrl: res.url }
}

function isForbiddenUrl(url) {
  try {
    const u = new URL(url)
    if (/google\./i.test(u.hostname)) return true
    if (/[?&]s=/.test(u.search) || u.searchParams.has("s")) return true
    if (/\/search\/?/i.test(u.pathname) || u.searchParams.has("keyword") || u.searchParams.has("q")) return true
    return false
  } catch {
    return true
  }
}

function slugs(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const out = new Set([base])
  out.add(base.replace(/-stir-fry$/, ""))
  out.add(base.replace(/-with-/g, "-"))
  out.add(base.replace(/-home$/, "").replace(/-style$/, ""))
  out.add(base.replace(/^hk-/, "").replace(/^home-/, ""))
  // common alternates
  const parts = base.split("-").filter(Boolean)
  if (parts.length >= 3) out.add(parts.slice(0, 3).join("-"))
  if (parts.length >= 2) out.add(parts.slice(0, 2).join("-"))
  return [...out].filter((s) => s.length >= 4)
}

async function tryMwl(recipe) {
  for (const slug of slugs(recipe.name)) {
    const url = `https://www.madewithlau.com/recipes/${slug}`
    if (isForbiddenUrl(url)) continue
    const key = `mwl:${slug}`
    if (cache[key] !== undefined) {
      if (cache[key]) return cache[key]
      continue
    }
    try {
      const { html, finalUrl } = await fetchText(url)
      if (isForbiddenUrl(finalUrl)) { cache[key] = null; continue }
      const title = html.match(/<title>([^<]+)/i)?.[1] || ""
      if (/page not found|404|error/i.test(title)) { cache[key] = null; continue }
      if (!hayHasDish(recipe, title)) { cache[key] = null; continue }
      const hit = { url: finalUrl.split("?")[0], name: "Made With Lau", via: "mwl" }
      cache[key] = hit
      return hit
    } catch {
      cache[key] = null
    }
  }
  return null
}

async function tryXiachufang(recipe) {
  if (!recipe.zh) return null
  const search = `https://www.xiachufang.com/search/?keyword=${encodeURIComponent(recipe.zh)}&cat=1001`
  const key = `xfsearch:${recipe.zh}`
  if (cache[key] !== undefined) return cache[key]
  try {
    const { html } = await fetchText(search)
    // collect recipe links in order
    const links = [...html.matchAll(/href="(\/recipe\/\d+\/)"/g)].map((m) => m[1])
    const seen = new Set()
    for (const path of links) {
      if (seen.has(path)) continue
      seen.add(path)
      const recipeUrl = `https://www.xiachufang.com${path}`
      if (isForbiddenUrl(recipeUrl)) continue
      try {
        const page = await fetchText(recipeUrl)
        const title = page.html.match(/<title>([^<]+)/i)?.[1] || ""
        if (!hayHasDish(recipe, title)) continue
        const hit = { url: recipeUrl, name: "下厨房", via: "xiachufang" }
        cache[key] = hit
        return hit
      } catch {
        continue
      }
    }
    cache[key] = null
  } catch {
    cache[key] = null
  }
  return null
}

async function tryBbc(recipe) {
  // BBC has a recipes search JSON-ish HTML; only accept /food/recipes/<slug>_digits
  const q = encodeURIComponent(recipe.name)
  const search = `https://www.bbc.co.uk/food/search?q=${q}`
  // We scrape search only to DISCOVER a direct recipe path — never store the search URL.
  const key = `bbc:${recipe.name}`
  if (cache[key] !== undefined) return cache[key]
  try {
    const { html } = await fetchText(search)
    const paths = [...html.matchAll(/href="(\/food\/recipes\/[a-z0-9_]+)"/gi)].map((m) => m[1])
    const seen = new Set()
    for (const path of paths) {
      if (seen.has(path)) continue
      seen.add(path)
      const url = `https://www.bbc.co.uk${path}`
      if (isForbiddenUrl(url)) continue
      try {
        const page = await fetchText(url)
        const title = page.html.match(/<title>([^<]+)/i)?.[1] || ""
        if (!hayHasDish(recipe, title)) continue
        const hit = { url, name: "BBC Food", via: "bbc" }
        cache[key] = hit
        return hit
      } catch {
        continue
      }
    }
    cache[key] = null
  } catch {
    cache[key] = null
  }
  return null
}

async function tryWoks(recipe) {
  for (const slug of slugs(recipe.name)) {
    const url = `https://thewoksoflife.com/${slug}/`
    const key = `wol:${slug}`
    if (cache[key] !== undefined) {
      if (cache[key]) return cache[key]
      continue
    }
    try {
      const { html, finalUrl } = await fetchText(url)
      if (isForbiddenUrl(finalUrl)) { cache[key] = null; continue }
      const title = html.match(/<title>([^<]+)/i)?.[1] || ""
      if (/page not found|404|error/i.test(title)) { cache[key] = null; continue }
      if (!hayHasDish(recipe, title)) { cache[key] = null; continue }
      const hit = { url: finalUrl.replace(/\/$/, "") + "/", name: "The Woks of Life", via: "woksoflife" }
      cache[key] = hit
      return hit
    } catch {
      cache[key] = null
    }
  }
  return null
}

async function resolveOne(recipe) {
  // Keep existing verified sourceUrl if present and not forbidden
  if (recipe.sourceUrl && !isForbiddenUrl(recipe.sourceUrl)) {
    return {
      id: recipe.id,
      url: recipe.sourceUrl,
      name: recipe.sourceName || "Recipe guide",
      via: "existing",
    }
  }
  const western = /^(western|breakfast|italian)$/i.test(recipe.cuisine || "")
  let hit = null
  if (western) {
    hit = (await tryBbc(recipe)) || (await tryMwl(recipe))
  } else {
    hit = (await tryMwl(recipe)) || (await tryWoks(recipe)) || (await tryXiachufang(recipe)) || (await tryBbc(recipe))
  }
  if (!hit) return { id: recipe.id, url: null, via: "none" }
  return { id: recipe.id, ...hit }
}

const need = RECIPES // resolve all; existing kept
const out = new Array(need.length)
let i = 0
async function worker() {
  while (i < need.length) {
    const idx = i++
    out[idx] = await resolveOne(need[idx])
    if ((idx + 1) % 15 === 0) {
      save()
      const ok = out.filter((x) => x?.url).length
      console.error(`… ${idx + 1}/${need.length} ok ${ok}`)
    }
  }
}
await Promise.all(Array.from({ length: 6 }, () => worker()))
save()
writeFileSync(OUT, JSON.stringify(out, null, 2))
const ok = out.filter((x) => x.url)
const by = {}
for (const r of out) by[r.via || "none"] = (by[r.via || "none"] || 0) + 1
console.log(JSON.stringify({ total: out.length, withSource: ok.length, missing: out.length - ok.length, by }, null, 2))
