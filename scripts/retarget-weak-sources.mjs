#!/usr/bin/env node
/**
 * Retarget shared/weak + empty Knorr stand-in sourceUrls to exclusive /
 * title-matched recipe pages (Woks / MWL / BBC / DayDayCook / Afterwork / LKK).
 *
 * Never invents ingredients — only swaps sourceUrl when a title-matched page
 * is found. Materials sync happens via audit + apply-materials-rewrite.
 *
 * Reads /tmp/home-recipes.json (+ optional /tmp/ingredient-audit.json)
 * Writes /tmp/retarget-weak-sources.json and patches src/lib/recipe-sources.ts
 *
 * Env: DRY=1 | MIN_SCORE=6 | LIMIT=0 | ONLY=shared,knorr
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"

const RECIPES = JSON.parse(readFileSync("/tmp/home-recipes.json", "utf8"))
const AUDIT = existsSync("/tmp/ingredient-audit.json")
  ? JSON.parse(readFileSync("/tmp/ingredient-audit.json", "utf8"))
  : null
const OUT = "/tmp/retarget-weak-sources.json"
const CACHE = "/tmp/retarget-weak-cache.json"
const SOURCES_PATH = "src/lib/recipe-sources.ts"
const UA = "Mozilla/5.0 (compatible; FridgeAI-retarget/1.0; +https://github.com/ivanmang/fridge-ai)"
const DRY = Boolean(process.env.DRY)
const MIN_SCORE = Number(process.env.MIN_SCORE || 6)
const LIMIT = Number(process.env.LIMIT || 0)
const ONLY = new Set(
  String(process.env.ONLY || "shared,knorr")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
)

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {}
const saveCache = () => writeFileSync(CACHE, JSON.stringify(cache, null, 2))

const STOP = new Set([
  "style", "simple", "home", "pan", "fried", "sauce", "soft", "cold", "boiled",
  "steamed", "stir", "fry", "and", "the", "for", "hk", "with", "from", "dish",
  "bowl", "over", "into", "mild", "extra", "quick", "easy", "recipe", "recipes",
  "chinese", "korean", "japanese", "thai", "how", "make", "best", "knorr",
])

function tokens(recipe) {
  const zhName = (recipe.zh || "").trim()
  const zh = []
  if (zhName) {
    const trimmed = zhName.replace(/[飯麵面汤湯粥煲蓋风風卷餅沙律]$/u, "")
    if (trimmed?.length >= 2) zh.push(trimmed)
    zh.push(zhName)
  }
  const en = recipe.name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
  return { zh, en }
}

function scoreTitle(recipe, title) {
  const hay = String(title || "")
    .toLowerCase()
    .normalize("NFKC")
  const { zh, en } = tokens(recipe)
  let score = 0
  for (const name of zh) if (name.length >= 2 && hay.includes(name.toLowerCase())) score += 5
  const strong = en.filter((t) => t.length >= 4)
  for (const t of strong) if (hay.includes(t)) score += 2
  for (const t of en.filter((x) => x.length === 3)) if (hay.includes(t)) score += 1
  if (/\b(what to do|list of|guide to|how to use|back to school)\b/i.test(title || "")) score -= 5
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
    if (h.includes("daydaycook")) return "DayDayCook"
    if (h.includes("afterwork-kitchen")) return "Afterwork Kitchen"
    if (h.includes("knorr")) return "Knorr"
  } catch {
    /* ignore */
  }
  return "Recipe guide"
}

function slugs(name) {
  const base = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const out = new Set([base])
  out.add(base.replace(/-stir-fry$/, "").replace(/-stirfry$/, ""))
  out.add(base.replace(/-with-/g, "-"))
  out.add(base.replace(/-home$/, "").replace(/-style$/, "").replace(/-ish$/, "").replace(/-knorr$/, ""))
  out.add(base.replace(/^hk-/, ""))
  const parts = base.split("-").filter(Boolean)
  if (parts.length >= 3) out.add(parts.slice(0, 3).join("-"))
  if (parts.length >= 2) out.add(parts.slice(0, 2).join("-"))
  return [...out].filter((s) => s.length >= 4)
}

async function fetchJson(url, timeout = 15000) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchHtml(url, timeout = 18000) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9,zh-HK;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { html: await res.text(), finalUrl: res.url }
}

async function searchWoks(recipe) {
  const q = recipe.name.replace(/\b(home|style|ish|knorr)\b/gi, " ").replace(/\s+/g, " ").trim()
  const key = `woks:${q}`
  if (cache[key] !== undefined) return cache[key]
  try {
    const hits = await fetchJson(
      `https://thewoksoflife.com/wp-json/wp/v2/search?search=${encodeURIComponent(q)}&per_page=10&type=post`,
    )
    let best = null
    for (const h of hits || []) {
      if (isForbiddenUrl(h.url)) continue
      const score = scoreTitle(recipe, h.title || "")
      if (!best || score > best.score) best = { url: h.url.split("?")[0], title: h.title, score, via: "woks-search" }
    }
    cache[key] = best && best.score >= 4 ? best : null
    return cache[key]
  } catch {
    cache[key] = null
    return null
  }
}

async function trySlugHost(recipe, hostTpl, name, via) {
  for (const slug of slugs(recipe.name)) {
    const url = hostTpl.replace("{slug}", slug)
    const key = `${via}:${slug}`
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
      if (/page not found|404|error|找不到/i.test(title)) {
        cache[key] = null
        continue
      }
      const score = scoreTitle(recipe, title)
      if (score < 4) {
        cache[key] = null
        continue
      }
      const hit = { url: finalUrl.split("?")[0].replace(/\/$/, "") + (via === "woks-slug" ? "/" : ""), title, score, via, name }
      // normalize trailing slash for non-woks
      if (!via.startsWith("woks")) hit.url = hit.url.replace(/\/$/, "")
      cache[key] = hit
      return hit
    } catch {
      cache[key] = null
    }
  }
  return null
}

async function tryBbc(recipe) {
  const key = `bbc:${recipe.name}`
  if (cache[key] !== undefined) return cache[key]
  try {
    const { html } = await fetchHtml(`https://www.bbc.co.uk/food/search?q=${encodeURIComponent(recipe.name)}`)
    const paths = [...html.matchAll(/href="(\/food\/recipes\/[a-z0-9_]+)"/gi)].map((m) => m[1])
    const seen = new Set()
    let best = null
    for (const path of paths) {
      if (seen.has(path)) continue
      seen.add(path)
      const url = `https://www.bbc.co.uk${path}`
      try {
        const page = await fetchHtml(url)
        const title = page.html.match(/<title>([^<]+)/i)?.[1] || ""
        const score = scoreTitle(recipe, title)
        if (!best || score > best.score) best = { url, title, score, via: "bbc-search", name: "BBC Food" }
        if (best.score >= MIN_SCORE) break
      } catch {
        continue
      }
    }
    cache[key] = best && best.score >= 4 ? best : null
    return cache[key]
  } catch {
    cache[key] = null
    return null
  }
}

async function findBetter(recipe) {
  const candidates = []
  const push = (hit) => {
    if (hit && hit.score >= 4) candidates.push(hit)
  }
  push(await searchWoks(recipe))
  push(await trySlugHost(recipe, "https://www.madewithlau.com/recipes/{slug}", "Made With Lau", "mwl-slug"))
  push(await trySlugHost(recipe, "https://thewoksoflife.com/{slug}/", "The Woks of Life", "woks-slug"))
  push(await trySlugHost(recipe, "https://www.daydaycook.com/zh-Hant/recipe/{slug}", "DayDayCook", "ddc-slug"))
  push(await trySlugHost(recipe, "https://www.afterwork-kitchen.com/recipes/{slug}", "Afterwork Kitchen", "afterwork-slug"))
  push(await tryBbc(recipe))
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0] || null
}

// Build shared map
const byUrl = new Map()
for (const r of RECIPES) {
  if (!r.sourceUrl) continue
  if (!byUrl.has(r.sourceUrl)) byUrl.set(r.sourceUrl, [])
  byUrl.get(r.sourceUrl).push(r)
}

const auditById = new Map((AUDIT?.dishes || []).map((d) => [d.id, d]))

function needsRetarget(r) {
  const shared = (r.sourceUrl && byUrl.get(r.sourceUrl)?.length) || 0
  const isKnorr = /knorr\.com/i.test(r.sourceUrl || "")
  const audit = auditById.get(r.id)
  const titleScore = audit?.titleScore ?? 0
  const empty = audit ? !(audit.sourceIngredients || []).length : isKnorr
  if (ONLY.has("knorr") && isKnorr && empty) return { reason: "knorr-empty", shared, titleScore }
  if (ONLY.has("shared") && shared > 1 && titleScore < MIN_SCORE) {
    // Prefer leaving the best title match on a shared URL alone.
    const siblings = byUrl.get(r.sourceUrl) || []
    const scores = siblings.map((s) => ({
      id: s.id,
      score: auditById.get(s.id)?.titleScore ?? scoreTitle(s, r.sourceUrl),
    }))
    const bestScore = Math.max(0, ...scores.map((s) => s.score))
    const myScore = auditById.get(r.id)?.titleScore ?? 0
    if (myScore >= MIN_SCORE && myScore === bestScore) return null
    return { reason: "shared-weak", shared, titleScore: myScore }
  }
  if (ONLY.has("empty") && empty && !isKnorr) return { reason: "empty-source", shared, titleScore }
  return null
}

let targets = RECIPES.map((r) => {
  const need = needsRetarget(r)
  return need ? { recipe: r, ...need } : null
}).filter(Boolean)

if (!AUDIT) {
  // Without audit, retarget all shared (non-best-guess) + knorr.
  targets = RECIPES.filter((r) => {
    const shared = (r.sourceUrl && byUrl.get(r.sourceUrl)?.length) || 0
    const isKnorr = /knorr\.com/i.test(r.sourceUrl || "")
    if (ONLY.has("knorr") && isKnorr) return true
    if (ONLY.has("shared") && shared > 1) {
      // Keep one dish per URL (highest token overlap with URL path).
      const sibs = byUrl.get(r.sourceUrl)
      const scored = sibs
        .map((s) => ({ id: s.id, score: scoreTitle(s, r.sourceUrl) }))
        .sort((a, b) => b.score - a.score)
      return scored[0]?.id !== r.id
    }
    return false
  }).map((r) => ({
    recipe: r,
    reason: /knorr/i.test(r.sourceUrl || "") ? "knorr-empty" : "shared-weak",
    shared: byUrl.get(r.sourceUrl)?.length || 0,
    titleScore: 0,
  }))
}

if (LIMIT > 0) targets = targets.slice(0, LIMIT)

console.error(`retarget candidates=${targets.length} minScore=${MIN_SCORE} dry=${DRY}`)

const results = []
let i = 0
async function worker() {
  while (i < targets.length) {
    const idx = i++
    const row = targets[idx]
    const r = row.recipe
    try {
      const hit = await findBetter(r)
      const keepKnorr = /knorr\.com/i.test(r.sourceUrl || "") && row.reason === "knorr-empty"
      // For Knorr: only retarget when we found a strong exclusive alternative;
      // otherwise leave Knorr URL for Wayback ingredient sync.
      const accept =
        hit &&
        hit.score >= MIN_SCORE &&
        hit.url !== r.sourceUrl &&
        (!keepKnorr || hit.score >= MIN_SCORE + 2)
      results[idx] = {
        id: r.id,
        name: r.name,
        zh: r.zh,
        reason: row.reason,
        prevUrl: r.sourceUrl,
        prevName: r.sourceName,
        nextUrl: accept ? hit.url : r.sourceUrl,
        nextName: accept ? hit.name || publisherOf(hit.url) : r.sourceName,
        score: hit?.score ?? 0,
        via: hit?.via || null,
        title: hit?.title || null,
        retargeted: Boolean(accept),
        skipped: accept ? null : keepKnorr ? "keep-knorr-for-wayback" : hit ? "score-low" : "no-match",
      }
    } catch (err) {
      results[idx] = {
        id: r.id,
        name: r.name,
        reason: row.reason,
        prevUrl: r.sourceUrl,
        error: String(err?.message || err),
        retargeted: false,
        skipped: "error",
      }
    }
    if ((idx + 1) % 20 === 0) {
      saveCache()
      const ok = results.filter((x) => x?.retargeted).length
      console.error(`… ${idx + 1}/${targets.length} retargeted ${ok}`)
    }
  }
}

await Promise.all(Array.from({ length: 5 }, () => worker()))
saveCache()

const retargeted = results.filter((r) => r?.retargeted)
if (!DRY && retargeted.length) {
  let src = readFileSync(SOURCES_PATH, "utf8")
  for (const row of retargeted) {
    const id = row.id
    const entry = `  ${JSON.stringify(id)}: { url: ${JSON.stringify(row.nextUrl)}, name: ${JSON.stringify(row.nextName)} },`
    const re = new RegExp(`  ${JSON.stringify(id)}: \\{ url: "[^"]*", name: "[^"]*" \\},`)
    if (re.test(src)) {
      src = src.replace(re, entry)
    } else {
      // insert before closing brace of RECIPE_SOURCES
      src = src.replace(
        /\n\}\s*\n\s*\/\*\* Merge verified sourceUrl/,
        `\n${entry}\n}\n\n/** Merge verified sourceUrl`,
      )
      if (!src.includes(entry)) {
        // fallback: before final `}\n` of file's RECIPE_SOURCES object
        const marker = "\n}\n"
        const idx = src.indexOf("export const RECIPE_SOURCES")
        const close = src.indexOf("\n}\n", idx)
        if (close > 0) src = src.slice(0, close) + "\n" + entry + src.slice(close)
      }
    }
  }
  writeFileSync(SOURCES_PATH, src)
}

const report = {
  candidates: targets.length,
  retargeted: retargeted.length,
  skipped: results.filter((r) => r && !r.retargeted).length,
  byReason: results.reduce((acc, r) => {
    if (!r) return acc
    const k = r.retargeted ? `retargeted:${r.reason}` : `skipped:${r.skipped || r.reason}`
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {}),
  byVia: retargeted.reduce((acc, r) => {
    acc[r.via] = (acc[r.via] || 0) + 1
    return acc
  }, {}),
  sample: retargeted.slice(0, 25),
}
writeFileSync(OUT, JSON.stringify({ report, results }, null, 2))
console.log(JSON.stringify(report, null, 2))
