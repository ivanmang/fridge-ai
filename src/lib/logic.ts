import { RECIPES, type Recipe } from "@/lib/recipes"
import { MORE, MORE_ZH } from "@/lib/more-dishes"
import { EXTRA } from "@/lib/extra-dishes"
import { recipeAllNames, recipeCores, recipeSoft, recipeStaples } from "@/lib/materials"
import { enrichRecipe } from "@/lib/recipe-media"
import { surveyAnswered, surveyReady, type SurveyAnswers } from "@/lib/survey"
import { SHELF, type ShelfFood } from "@/lib/shelf"
import { ZH_CUISINE, ZH_FOOD, ZH_RECIPE } from "@/lib/zh"

export { enrichRecipe } from "@/lib/recipe-media"
export { recipeAllNames, recipeCores, recipeSoft, recipeStaples } from "@/lib/materials"

export type FoodItem = {
  id: string
  name: string
  /** Freeform display qty (always set; kept in sync when amount/unit are used). */
  qty: string
  /** Optional structured amount — pairs with `unit` for My food. */
  amount?: number
  /** Optional unit aligned with recipe materials (g, ml, piece, …). */
  unit?: string
  location: ShelfFood["location"]
  bought: string
  expires: string
  /** Whether the date came from our estimate or the package/user. */
  expirySource?: "estimated" | "package"
  opened: boolean
}

export type ItemStatus = "fresh" | "soon" | "today" | "expired"

const MEAT = [
  "chicken",
  "beef",
  "pork",
  "bacon",
  "ham",
  "sausage",
  "salmon",
  "fish",
  "shrimp",
  "prawn",
  "tuna",
  "luncheon",
  "spam",
  "meat",
]

export function todayISO(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  dt.setDate(dt.getDate() + days)
  return todayISO(dt)
}

export function daysUntil(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  const target = new Date(y, (m || 1) - 1, d || 1)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

export function statusOf(expires: string): ItemStatus {
  const n = daysUntil(expires)
  if (n < 0) return "expired"
  if (n === 0) return "today"
  if (n <= 3) return "soon"
  return "fresh"
}

export function whenLabel(expires: string) {
  const n = daysUntil(expires)
  if (n === 0) return "today"
  if (n === 1) return "tomorrow"
  if (n === -1) return "yesterday"
  if (n < 0) return `${-n}d ago`
  return `${n}d`
}

export function statusLabel(status: ItemStatus) {
  if (status === "expired") return "Expired"
  if (status === "today") return "Use today"
  if (status === "soon") return "Use soon"
  return "Fresh"
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()
}

/** Prebuilt alias rows — avoids rebuilding name lists on every findShelf call. */
const SHELF_ROWS: { alias: string; food: ShelfFood; rank: number }[] = []
for (const food of SHELF) {
  const labels: { text: string; rank: number }[] = [
    { text: food.name, rank: 300 },
    ...food.aliases.map((text) => ({ text, rank: 200 })),
  ]
  const zh = ZH_FOOD[food.name]
  if (zh) labels.push({ text: zh, rank: 200 })
  for (const { text, rank } of labels) {
    const alias = norm(text)
    if (alias) SHELF_ROWS.push({ alias, food, rank })
  }
}

/** Memoize fuzzy shelf matches — ranking calls findShelf thousands of times per tap. */
const findShelfCache = new Map<string, ShelfFood | undefined>()

export function findShelf(name: string): ShelfFood | undefined {
  const n = norm(name)
  if (!n) return undefined
  if (findShelfCache.has(n)) return findShelfCache.get(n)
  let best: { food: ShelfFood; score: number } | undefined
  for (const { alias, food, rank } of SHELF_ROWS) {
    // Exact alias wins hard so short labels like 麵 cannot steal 公仔麵.
    const score =
      alias === n
        ? rank + alias.length + 1000
        : alias.length >= 2 && (n.includes(alias) || alias.includes(n))
          ? rank / 2 + alias.length
          : 0
    if (score > (best?.score ?? 0)) best = { food, score }
  }
  findShelfCache.set(n, best?.food)
  return best?.food
}

/** Stable food identity for matching fridge stock to recipe needs. */
function foodKey(name: string) {
  return findShelf(name)?.name ?? `~${norm(name)}`
}

function shopName(name: string) {
  const shelf = findShelf(name)
  if (!shelf) return name
  const n = norm(name)
  const zh = ZH_FOOD[shelf.name] ? norm(ZH_FOOD[shelf.name]) : ""
  const exact = norm(shelf.name) === n || zh === n || shelf.aliases.some((alias) => norm(alias) === n)
  return exact ? shelf.name : name
}

export function defaultExpiry(name: string, bought = todayISO(), opened = false) {
  const shelf = findShelf(name)
  const days = opened ? Math.min(shelf?.days ?? 4, 4) : (shelf?.days ?? 5)
  return addDays(bought, days)
}

function sameFood(have: string, need: string) {
  return foodKey(have) === foodKey(need)
}

export function isVegetarian(recipe: Recipe) {
  return !recipeCores(recipe).some((need) => MEAT.some((meat) => norm(need).includes(meat)))
}

export type RankedRecipe = {
  recipe: Recipe
  score: number
  matched: string[]
  missing: string[]
  urgent: string[]
}

export type SuggestMode = "strict" | "free"
export type Priority = 0 | 1 | 2 | 3

type StockRow = { key: string; name: string; days: number }

function stockRows(items: FoodItem[]): StockRow[] {
  return items.map((item) => ({
    key: foodKey(item.name),
    name: item.name,
    days: daysUntil(item.expires),
  }))
}

function scoreOne(recipe: Recipe, stock: StockRow[], priority: Priority, favorites: string[]): RankedRecipe {
  const liked = favorites.includes(recipe.cuisine)
  const matched: string[] = []
  const missing: string[] = []
  const urgent: string[] = []
  for (const need of recipeCores(recipe)) {
    const key = foodKey(need)
    const hit = stock.find((item) => item.days >= 0 && item.key === key)
    if (hit) {
      matched.push(need)
      if (hit.days <= 3) urgent.push(hit.name)
    } else missing.push(need)
  }
  let optionalHits = 0
  for (const extra of recipeSoft(recipe)) {
    const key = foodKey(extra)
    const hit = stock.find((item) => item.days >= 0 && item.key === key)
    if (!hit) continue
    optionalHits += 1
    if (hit.days <= 3 && !urgent.includes(hit.name)) urgent.push(hit.name)
  }
  const favW = [0, 6, 18, 40][priority]
  const missW = [4, 2.5, 0.8, 0.25][priority]
  const matchW = [5, 4, 2, 1][priority]
  const urgentW = [4, 6, 8, 8][priority]
  const score = favW * (liked ? 1 : 0) + matchW * matched.length + 1.2 * optionalHits + urgentW * urgent.length - missW * missing.length + (recipe.id.startsWith("home-") ? 12 : 0)
  return { recipe, score, matched, missing, urgent }
}

const SEAFOOD = ["shrimp", "prawn", "fish", "salmon", "tuna", "scallop", "abalone", "crab", "蝦", "魚", "帶子", "蟹"]

function isSeafood(recipe: Recipe) {
  return recipeCores(recipe).some((need) => SEAFOOD.some((word) => norm(need).includes(word)))
}

const RED_MEAT = ["beef", "pork", "bacon", "ham", "sausage", "luncheon", "spam", "lamb", "牛", "豬"]
const LAND_MEAT = ["chicken", "雞", ...RED_MEAT]

function hasWord(recipe: Recipe, words: string[]) {
  return recipeCores(recipe).some((need) => words.some((word) => norm(need).includes(word)))
}

function isSpicy(recipe: Recipe) {
  const blob = norm([recipe.name, recipe.cuisine, ...recipeCores(recipe)].join(" "))
  return recipe.cuisine === "Sichuan" || ["chili", "chilli", "kimchi", "curry"].some((word) => blob.split(" ").includes(word))
}

function isSoup(recipe: Recipe) {
  const blob = norm([recipe.name, ...recipeCores(recipe)].join(" "))
  return blob.includes("soup") || recipe.name.includes("湯")
}

function profileBonus(recipe: Recipe, taste: SurveyAnswers | null | undefined) {
  if (!taste || taste.skipped) return 0
  let bonus = 0
  if (taste.meal === "breakfast" && recipe.cuisine === "Breakfast") bonus += 14
  if (taste.meal === "lunch" && recipe.cuisine !== "Breakfast" && recipe.time <= 35) bonus += 6
  if (taste.meal === "dinner" && recipe.cuisine === "Breakfast") bonus -= 8
  if (taste.meal === "late" && recipe.time <= 20) bonus += 8
  if (taste.people === "one" && recipe.servings <= 2) bonus += 4
  if (taste.people === "two" && recipe.servings >= 2 && recipe.servings <= 4) bonus += 4
  if (taste.people === "four" && recipe.servings >= 3) bonus += 4
  if (taste.people === "family" && recipe.servings >= 4) bonus += 5
  if (taste.style === "light" && recipe.time <= 20) bonus += 4
  if (taste.style === "everyday" && recipe.time >= 15 && recipe.time <= 40) bonus += 4
  if (taste.style === "hearty" && recipe.time >= 35) bonus += 4
  if (taste.style === "soup" && isSoup(recipe)) bonus += 12
  if (taste.heat === "medium" && isSpicy(recipe)) bonus += 4
  if (taste.heat === "hot" && isSpicy(recipe)) bonus += 10
  return bonus
}

export function fitsTaste(recipe: Recipe, taste: SurveyAnswers | null | undefined) {
  if (!taste || !surveyReady(taste) || taste.skipped) return true
  if (taste.diet === "vegetarian" && !isVegetarian(recipe)) return false
  if (taste.diet === "pescatarian" && hasWord(recipe, LAND_MEAT)) return false
  if (taste.diet === "no-seafood" && isSeafood(recipe)) return false
  if (taste.diet === "no-red-meat" && hasWord(recipe, RED_MEAT)) return false
  const mild = taste.heat === "mild" || taste.diet === "mild"
  if (mild && isSpicy(recipe)) return false
  if (taste.heat === "little" && (recipe.cuisine === "Sichuan" || hasWord(recipe, ["kimchi", "curry"]))) return false
  if (taste.pace === "15" && recipe.time > 15) return false
  if (taste.pace === "quick" && recipe.time > 25) return false
  if (taste.pace === "45" && recipe.time > 45) return false
  return true
}

function profileLeads(taste: SurveyAnswers | null | undefined) {
  return Boolean(taste && surveyReady(taste) && !taste.skipped && surveyAnswered(taste) && taste.goal !== "fridge")
}

export function rankRecipes(
  items: FoodItem[],
  vegetarian: boolean,
  priority: Priority = 0,
  favorites: string[] = [],
  taste: SurveyAnswers | null = null,
  extras: Recipe[] = [],
  options: { savedIds?: string[]; lastTonightId?: string; cookedIds?: string[] } = {},
): RankedRecipe[] {
  const profile = Boolean(taste && surveyReady(taste) && !taste.skipped && surveyAnswered(taste))
  const fridgeOnly = !profileLeads(taste) && (taste?.goal === "fridge" || priority < 2)
  const saved = new Set(options.savedIds ?? [])
  const cooked = new Set(options.cookedIds ?? [])
  const stock = stockRows(items)
  // Tonight ranking uses the cookable core only — imported outlines stay search/browse-only.
  const pool = cookableBook(vegetarian, extras)
  return pool
    .map((recipe) => {
      const row = scoreOne(recipe, stock, priority, favorites)
      const fit = profileBonus(recipe, taste)
      const liked = favorites.includes(recipe.cuisine)
      if (profileLeads(taste)) {
        const fridge = taste?.goal === "fridge-first" ? row.matched.length * 8 + row.urgent.length * 10 : row.matched.length * 2 + row.urgent.length * 8
        row.score = fit * 3 + (liked ? 36 : 0) + fridge
      } else {
        row.score += fit + (profile && liked ? 18 : 0)
      }
      if (saved.has(recipe.id)) row.score += 8
      if (cooked.has(recipe.id)) row.score += 4
      if (options.lastTonightId && recipe.id === options.lastTonightId) row.score += 10
      return row
    })
    .filter((row) => fitsTaste(row.recipe, taste))
    .filter((row) => !fridgeOnly || row.matched.length > 0)
    .sort((a, b) => b.score - a.score || a.recipe.time - b.recipe.time)
}

const OUTLINE_STEP =
  /cook them until just done|prep the ingredients|season, toss briefly|prep .+, .+\.|煮至剛熟|調味後上碟/i

/** Imported catalogue rows that only have the three-line outline template (not cookable here). */
export function isOutlineRecipe(recipe: Recipe): boolean {
  if (recipe.id.startsWith("home-") || recipe.id.startsWith("mine-") || recipe.id.startsWith("x-")) return false
  if (!recipe.steps.length) return true
  return recipe.steps.some((step) => OUTLINE_STEP.test(step))
}

export function isCookableRecipe(recipe: Recipe): boolean {
  return !isOutlineRecipe(recipe)
}

/** One-glance trust: cookable dish vs browse-only idea. */
export function trustLevel(recipe: Recipe): "full" | "idea" {
  return isOutlineRecipe(recipe) ? "idea" : "full"
}

export type RecipeFilters = {
  /** Only dishes with no missing required ingredients. */
  haveOnly?: boolean
  /** Only dishes that use food due within 3 days. */
  useSoon?: boolean
  /** Cuisine filter; "All" or empty means no filter. */
  cuisine?: string
  /** Max cook time in minutes. */
  maxTime?: number | null
  /** Drop zero-match dishes (default true for Cook tonight). */
  hideZeroMatch?: boolean
  /** Restrict to saved recipe ids. */
  savedOnly?: boolean
  /** Restrict to cooked-before recipe ids. */
  cookedOnly?: boolean
  savedIds?: string[]
  cookedIds?: string[]
}

export function applyRecipeFilters(rows: RankedRecipe[], filters: RecipeFilters = {}): RankedRecipe[] {
  const cuisine = filters.cuisine && filters.cuisine !== "All" ? filters.cuisine : ""
  const hideZero = filters.hideZeroMatch !== false
  const saved = new Set(filters.savedIds ?? [])
  const cooked = new Set(filters.cookedIds ?? [])
  return rows.filter((row) => {
    if (hideZero && row.matched.length === 0) return false
    if (filters.haveOnly && row.missing.length > 0) return false
    if (filters.useSoon && row.urgent.length === 0) return false
    if (cuisine && row.recipe.cuisine !== cuisine) return false
    if (filters.maxTime != null && row.recipe.time > filters.maxTime) return false
    if (filters.savedOnly && !saved.has(row.recipe.id)) return false
    if (filters.cookedOnly && !cooked.has(row.recipe.id)) return false
    return true
  })
}

/**
 * Attribution for UI labels.
 * - home / mine / x (looked-up) → kitchen favorites
 * - knorr- / guardian- → those catalogues
 * - free-form LKK-style IDs (no lkk- prefix) and explicit lkk- → Lee Kum Kee
 */
export function dishSource(id: string): "home" | "lkk" | "knorr" | "guardian" {
  if (id.startsWith("home-") || id.startsWith("mine-") || id.startsWith("x-")) return "home"
  if (id.startsWith("knorr-")) return "knorr"
  if (id.startsWith("guardian-")) return "guardian"
  if (id.startsWith("lkk-")) return "lkk"
  return "lkk"
}

/** Real cookable core: home recipes + user extras. Outline catalogue is excluded. */
const COOKABLE_BASE = [...MORE, ...EXTRA].map(enrichRecipe)
const COOKABLE_VEG = COOKABLE_BASE.filter(isVegetarian)
const FULL_BASE = [...MORE, ...EXTRA, ...RECIPES].map(enrichRecipe)
const FULL_VEG = FULL_BASE.filter(isVegetarian)
const RECIPE_BY_ID = new Map<string, Recipe>(FULL_BASE.map((recipe) => [recipe.id, recipe]))

function cookableBook(vegetarian: boolean, extras: Recipe[] = []): Recipe[] {
  const base = vegetarian ? COOKABLE_VEG : COOKABLE_BASE
  if (!extras.length) return base
  const added = extras.filter(isCookableRecipe).map(enrichRecipe)
  return vegetarian ? [...base, ...added.filter(isVegetarian)] : [...base, ...added]
}

/** Full searchable set including imported outlines (for browse / search only). */
function fullBook(vegetarian: boolean, extras: Recipe[] = []): Recipe[] {
  const base = vegetarian ? FULL_VEG : FULL_BASE
  if (!extras.length) return base
  const added = extras.map(enrichRecipe)
  return vegetarian ? [...base, ...added.filter(isVegetarian)] : [...base, ...added]
}

export function listRecipes(
  vegetarian: boolean,
  taste: SurveyAnswers | null = null,
  options: { includeOutlines?: boolean } = {},
): Recipe[] {
  const book = options.includeOutlines ? fullBook(vegetarian) : cookableBook(vegetarian)
  return book
    .filter((recipe) => fitsTaste(recipe, taste))
    .sort((a, b) => profileBonus(b, taste) - profileBonus(a, taste) || a.name.localeCompare(b.name))
}

export function searchRecipes(
  query: string,
  items: FoodItem[],
  vegetarian: boolean,
  taste: SurveyAnswers | null = null,
  options: { includeOutlines?: boolean; limit?: number } = {},
): RankedRecipe[] {
  const q = norm(query)
  if (!q) return []
  const includeOutlines = options.includeOutlines === true
  const limit = options.limit ?? 12
  const stock = stockRows(items)
  const cookable = cookableBook(vegetarian)
  const outlines = includeOutlines ? fullBook(vegetarian).filter(isOutlineRecipe) : []
  const match = (recipe: Recipe) => {
    const blob = norm(
      [
        recipe.name,
        recipe.cuisine,
        ZH_RECIPE[recipe.id]?.name ?? "",
        recipe.zh?.name ?? "",
        MORE_ZH[recipe.id] ?? "",
        ZH_CUISINE[recipe.cuisine] ?? "",
        ...recipeCores(recipe),
        ...recipeSoft(recipe),
      ].join(" "),
    )
    return blob.includes(q)
  }
  const cookHits = cookable.filter(match).filter((recipe) => fitsTaste(recipe, taste)).map((recipe) => scoreOne(recipe, stock, 3, []))
  const outlineHits = outlines
    .filter(match)
    .filter((recipe) => fitsTaste(recipe, taste))
    .map((recipe) => scoreOne(recipe, stock, 3, []))
  return [...cookHits, ...outlineHits].slice(0, limit)
}

/** Typeahead suggestions for dish search (name + ingredients). */
export function suggestRecipes(
  query: string,
  items: FoodItem[],
  vegetarian: boolean,
  taste: SurveyAnswers | null = null,
  options: { includeOutlines?: boolean; limit?: number } = {},
): RankedRecipe[] {
  return searchRecipes(query, items, vegetarian, taste, { includeOutlines: options.includeOutlines, limit: options.limit ?? 8 })
}

export function ideasByIds(ids: string[], items: FoodItem[], extras: Recipe[] = []): RankedRecipe[] {
  const stock = stockRows(items)
  const extraById = extras.length ? new Map(extras.map((recipe) => [recipe.id, enrichRecipe(recipe)])) : null
  return ids.flatMap((id) => {
    const recipe = extraById?.get(id) ?? RECIPE_BY_ID.get(id)
    return recipe ? [scoreOne(recipe, stock, 3, [])] : []
  })
}

export function foodsForMeal(recipe: Recipe, items: FoodItem[]): FoodItem[] {
  const used = new Set<string>()
  const out: FoodItem[] = []
  for (const need of recipeAllNames(recipe)) {
    const key = foodKey(need)
    const hit = items.find((item) => daysUntil(item.expires) >= 0 && !used.has(item.id) && foodKey(item.name) === key)
    if (!hit) continue
    used.add(hit.id)
    out.push(hit)
  }
  return out
}

export function shopForIdeas(items: FoodItem[], ideas: RankedRecipe[]) {
  const rows = new Map<string, { name: string; recipeIds: string[]; kind: "core" | "staple" }>()
  for (const idea of ideas) {
    const addName = (name: string, kind: "core" | "staple") => {
      const canonical = shopName(name)
      const key = norm(canonical)
      const existing = rows.get(key)
      if (existing) {
        if (!existing.recipeIds.includes(idea.recipe.id)) existing.recipeIds.push(idea.recipe.id)
        if (existing.kind === "staple" && kind === "core") existing.kind = "core"
        return
      }
      rows.set(key, { name: canonical, recipeIds: [idea.recipe.id], kind })
    }
    for (const need of idea.missing) addName(need, "core")
    for (const name of recipeStaples(idea.recipe)) {
      if (items.some((item) => daysUntil(item.expires) >= 0 && sameFood(item.name, name))) continue
      if (idea.missing.some((miss) => sameFood(miss, name))) continue
      addName(name, "staple")
    }
  }
  return [...rows.values()]
}

/** Core gaps only (default Shop “for tonight”). */
export function shopCoreGaps(items: FoodItem[], ideas: RankedRecipe[]) {
  return shopForIdeas(items, ideas).filter((row) => row.kind === "core")
}

/** Staple gaps for secondary Shop section. */
export function shopStapleGaps(items: FoodItem[], ideas: RankedRecipe[]) {
  return shopForIdeas(items, ideas).filter((row) => row.kind === "staple")
}

export function planFromRanked(
  ranked: RankedRecipe[],
  items: FoodItem[],
  priority: Priority = 0,
  favorites: string[] = [],
  taste: SurveyAnswers | null = null,
) {
  if (profileLeads(taste)) {
    const ideas = ranked.slice(0, 3)
    return { ideas, shop: shopForIdeas(items, ideas) }
  }
  const ideas: RankedRecipe[] = []
  const covered = new Set<string>()
  const cover = (row: RankedRecipe) => {
    for (const name of [...row.matched, ...row.urgent]) {
      covered.add(norm(findShelf(name)?.name ?? name))
    }
  }
  const urgentCap = priority >= 2 && favorites.length > 0 ? 2 : 3
  for (const row of ranked) {
    if (ideas.length >= urgentCap) break
    if (priority >= 2 && !row.urgent.length) continue
    const fresh = row.urgent.some((name) => !covered.has(norm(findShelf(name)?.name ?? name)))
    if (ideas.length === 0 || fresh) {
      ideas.push(row)
      cover(row)
    }
  }
  const fill = priority >= 2 && favorites.length > 0 ? ranked.filter((row) => favorites.includes(row.recipe.cuisine)) : ranked
  for (const row of fill) {
    if (ideas.length >= 3) break
    if (ideas.some((idea) => idea.recipe.id === row.recipe.id)) continue
    ideas.push(row)
  }
  return { ideas, shop: shopForIdeas(items, ideas) }
}

export function planMeals(
  items: FoodItem[],
  vegetarian: boolean,
  priority: Priority = 0,
  favorites: string[] = [],
  taste: SurveyAnswers | null = null,
  extras: Recipe[] = [],
  options: { savedIds?: string[]; lastTonightId?: string; cookedIds?: string[] } = {},
) {
  const ranked = rankRecipes(items, vegetarian, priority, favorites, taste, extras, options)
  return planFromRanked(ranked, items, priority, favorites, taste)
}

export function sampleItems(): FoodItem[] {
  const row = (name: string, qty: string, boughtAgo: number, life: number): FoodItem => {
    const bought = addDays(todayISO(), -boughtAgo)
    return {
      id: crypto.randomUUID(),
      name,
      qty,
      location: findShelf(name)?.location ?? "fridge",
      bought,
      expires: addDays(bought, life),
      expirySource: "estimated",
      opened: false,
    }
  }
  return [
    row("Choi sum", "1 bunch", 3, 4),
    row("Milk", "1 carton", 5, 7),
    row("Cooked rice", "1 bowl", 1, 3),
    row("Eggs", "6", 2, 28),
    row("Tomato", "3", 1, 7),
    row("Chicken breast", "400 g", 0, 2),
    row("Tofu", "1 block", 1, 5),
    row("Garlic", "1 head", 0, 30),
    row("Spring onion", "1 bunch", 2, 7),
  ]
}
