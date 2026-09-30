import type { Locale } from "@/lib/i18n"
import type { Recipe } from "@/lib/recipes"

export type DishLookup = {
  image?: string
  aboutUrl?: string
  aboutName?: string
  wikiTitle?: string
}

const cache = new Map<string, DishLookup | null>()

const STOP = new Set([
  "style",
  "simple",
  "skillet",
  "bowl",
  "with",
  "from",
  "dish",
  "home",
  "pan",
  "fried",
  "sauce",
  "soft",
  "cold",
  "boiled",
  "steamed",
  "stir",
  "fry",
  "rice",
  "soup",
  "egg",
  "eggs",
  "and",
  "the",
  "for",
  "hk",
])

const WEAK_SOLO = new Set([
  "tomato",
  "chicken",
  "pork",
  "beef",
  "tofu",
  "fish",
  "shrimp",
  "onion",
  "cabbage",
  "potato",
  "bread",
  "milk",
  "bacon",
  "salad",
  "greens",
  "noodle",
  "noodles",
  "pasta",
  "bean",
  "beans",
  "meat",
  "mince",
  "garlic",
  "ginger",
  "chili",
  "pepper",
  "lemon",
  "apple",
  "mushroom",
  "spinach",
  "broccoli",
  "cucumber",
  "carrot",
  "avocado",
  "yogurt",
  "sausage",
  "lettuce",
  "celery",
  "corn",
  "eggplant",
])

/** Trusted publishers for home classics (site-scoped search — never invent per-dish paths). */
export const RECIPE_GUIDE_SITES = ["madewithlau.com", "hk.lkk.com"] as const

/** Locale-aware search biased to Made With Lau + Lee Kum Kee HK. */
export function recipeSearchUrl(recipe: Recipe, locale: Locale): string {
  const name = locale === "zh" ? recipe.zh?.name?.trim() || recipe.name : recipe.name
  const sites = RECIPE_GUIDE_SITES.map((host) => `site:${host}`).join(" OR ")
  const query = locale === "zh" ? `${sites} ${name}` : `${sites} ${name} recipe`
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

function cacheKey(recipe: Recipe, locale: Locale) {
  return `${locale}:${recipe.id}:${recipe.zh?.name ?? ""}:${recipe.name}`
}

export function dishMatchTokens(recipe: Recipe): { zh: string[]; en: string[] } {
  const zhName = recipe.zh?.name?.trim() ?? ""
  const zh: string[] = []
  if (zhName) {
    const trimmed = zhName.replace(/[飯麵汤湯粥煲]$/u, "")
    if (trimmed && trimmed !== zhName && trimmed.length >= 2) zh.push(trimmed)
    zh.push(zhName)
  }
  const en = recipe.name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !STOP.has(word))
  return { zh, en }
}

export function isConfidentDishMatch(recipe: Recipe, wikiTitle: string, description = "", extract = ""): boolean {
  const title = wikiTitle.toLowerCase()
  const hay = `${wikiTitle} ${description} ${extract}`.toLowerCase()
  const { zh, en } = dishMatchTokens(recipe)

  for (const name of zh) {
    if (name && hay.includes(name.toLowerCase())) return true
  }

  if (en.length >= 2) {
    const titleHits = en.filter((token) => title.includes(token))
    return titleHits.length >= 2 && en.every((token) => hay.includes(token))
  }

  if (en.length === 1) {
    const token = en[0]
    if (WEAK_SOLO.has(token)) return false
    return title.includes(token) && /\b(dish|cuisine|food|recipe|salad|soup|stew|toast)\b/i.test(hay)
  }

  return false
}

async function wikiSearchTitles(lang: "en" | "zh", query: string): Promise<string[]> {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}` +
    `&srlimit=8&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as { query?: { search?: { title: string }[] } }
  return (data.query?.search ?? []).map((row) => row.title)
}

async function wikiSummary(
  lang: "en" | "zh",
  title: string,
): Promise<(DishLookup & { description: string; extract: string }) | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(" ", "_"))}`
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) return null
  const data = (await res.json()) as {
    type?: string
    title?: string
    description?: string
    extract?: string
    thumbnail?: { source?: string }
    content_urls?: { desktop?: { page?: string } }
  }
  if (data.type !== "standard") return null
  const page = data.content_urls?.desktop?.page
  const image = data.thumbnail?.source?.split("?")[0]
  if (!page || !image) return null
  return {
    image,
    aboutUrl: page,
    aboutName: lang === "zh" ? "維基百科" : "Wikipedia",
    wikiTitle: data.title,
    description: data.description ?? "",
    extract: data.extract ?? "",
  }
}

function searchQueries(recipe: Recipe): { lang: "en" | "zh"; query: string }[] {
  const { zh, en } = dishMatchTokens(recipe)
  const queries: { lang: "en" | "zh"; query: string }[] = []
  for (const name of zh) queries.push({ lang: "zh", query: name })
  queries.push({ lang: "en", query: recipe.name.trim() })
  if (en.length >= 2) queries.push({ lang: "en", query: en.join(" ") })
  return queries
}

export async function lookupDish(recipe: Recipe, locale: Locale): Promise<DishLookup | null> {
  const key = cacheKey(recipe, locale)
  if (cache.has(key)) return cache.get(key) ?? null

  const trusted: DishLookup | null = recipe.sourceUrl
    ? {
        image: recipe.image,
        aboutUrl: recipe.sourceUrl,
        aboutName: recipe.sourceName,
      }
    : null

  if (trusted?.image && trusted.aboutUrl) {
    cache.set(key, trusted)
    return trusted
  }

  for (const { lang, query } of searchQueries(recipe)) {
    try {
      const titles = await wikiSearchTitles(lang, query)
      for (const title of titles) {
        const summary = await wikiSummary(lang, title)
        if (!summary) continue
        if (!isConfidentDishMatch(recipe, summary.wikiTitle ?? title, summary.description, summary.extract)) continue
        const hit: DishLookup = {
          image: summary.image,
          // Prefer a hand-verified publisher page over Wikipedia for "about"
          aboutUrl: trusted?.aboutUrl ?? summary.aboutUrl,
          aboutName: trusted?.aboutName ?? summary.aboutName,
          wikiTitle: summary.wikiTitle,
        }
        cache.set(key, hit)
        return hit
      }
    } catch {
      /* try next query */
    }
  }

  if (trusted?.aboutUrl) {
    cache.set(key, trusted)
    return trusted
  }

  cache.set(key, null)
  return null
}

export function clearDishLookupCache() {
  cache.clear()
}
