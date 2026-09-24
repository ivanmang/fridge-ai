import { RECIPES, type Recipe } from "@/lib/recipes"
import { SHELF, type ShelfFood } from "@/lib/shelf"
import { ZH_CUISINE, ZH_FOOD, ZH_RECIPE } from "@/lib/zh"

export type FoodItem = {
  id: string
  name: string
  qty: string
  location: ShelfFood["location"]
  bought: string
  expires: string
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

export function findShelf(name: string): ShelfFood | undefined {
  const n = norm(name)
  if (!n) return undefined
  let best: { food: ShelfFood; score: number } | undefined
  for (const food of SHELF) {
    const extra = ZH_FOOD[food.name] ? [ZH_FOOD[food.name]] : []
    const names = [
      { text: food.name, rank: 300 },
      ...food.aliases.map((text) => ({ text, rank: 200 })),
      ...extra.map((text) => ({ text, rank: 200 })),
    ]
    for (const { text, rank } of names) {
      const alias = norm(text)
      if (!alias) continue
      const score = alias === n ? rank + alias.length : n.includes(alias) || alias.includes(n) ? rank / 2 + alias.length : 0
      if (score > (best?.score ?? 0)) best = { food, score }
    }
  }
  return best?.food
}

export function defaultExpiry(name: string, bought = todayISO(), opened = false) {
  const shelf = findShelf(name)
  const days = opened ? Math.min(shelf?.days ?? 4, 4) : (shelf?.days ?? 5)
  return addDays(bought, days)
}

function sameFood(have: string, need: string) {
  const left = findShelf(have)
  const right = findShelf(need)
  if (left && right) return left.name === right.name
  return norm(have) === norm(need)
}

export function isVegetarian(recipe: Recipe) {
  return !recipe.need.some((need) => MEAT.some((meat) => norm(need).includes(meat)))
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

function scoreOne(recipe: Recipe, items: FoodItem[], priority: Priority, favorites: string[]): RankedRecipe {
  const liked = favorites.includes(recipe.cuisine)
  const matched: string[] = []
  const missing: string[] = []
  const urgent: string[] = []
  for (const need of recipe.need) {
    const hit = items.find((item) => sameFood(item.name, need))
    if (hit) {
      matched.push(need)
      if (daysUntil(hit.expires) <= 3) urgent.push(hit.name)
    } else missing.push(need)
  }
  let optionalHits = 0
  for (const extra of recipe.optional) {
    const hit = items.find((item) => sameFood(item.name, extra))
    if (!hit) continue
    optionalHits += 1
    if (daysUntil(hit.expires) <= 3 && !urgent.includes(hit.name)) urgent.push(hit.name)
  }
  const favW = [0, 6, 18, 40][priority]
  const missW = [4, 2.5, 0.8, 0.25][priority]
  const matchW = [5, 4, 2, 1][priority]
  const urgentW = [4, 6, 8, 8][priority]
  const score = favW * (liked ? 1 : 0) + matchW * matched.length + 1.2 * optionalHits + urgentW * urgent.length - missW * missing.length
  return { recipe, score, matched, missing, urgent }
}

export function rankRecipes(
  items: FoodItem[],
  vegetarian: boolean,
  priority: Priority = 0,
  favorites: string[] = [],
): RankedRecipe[] {
  const pool = vegetarian ? RECIPES.filter(isVegetarian) : RECIPES
  return pool
    .map((recipe) => scoreOne(recipe, items, priority, favorites))
    .filter((row) => priority >= 2 || row.matched.length > 0)
    .sort((a, b) => b.score - a.score || a.recipe.time - b.recipe.time)
}

export function searchRecipes(query: string, items: FoodItem[], vegetarian: boolean): RankedRecipe[] {
  const q = norm(query)
  if (!q) return []
  const pool = vegetarian ? RECIPES.filter(isVegetarian) : RECIPES
  return pool
    .filter((recipe) => {
      const blob = norm(
        [recipe.name, recipe.cuisine, ZH_RECIPE[recipe.id]?.name ?? "", ZH_CUISINE[recipe.cuisine] ?? "", ...recipe.need, ...recipe.optional].join(" "),
      )
      return blob.includes(q)
    })
    .map((recipe) => scoreOne(recipe, items, 3, []))
    .slice(0, 6)
}

export function ideasByIds(ids: string[], items: FoodItem[]): RankedRecipe[] {
  const byId = new Map(RECIPES.map((recipe) => [recipe.id, recipe]))
  return ids.flatMap((id) => {
    const recipe = byId.get(id)
    return recipe ? [scoreOne(recipe, items, 3, [])] : []
  })
}

export function foodsForMeal(recipe: Recipe, items: FoodItem[]): FoodItem[] {
  const used = new Set<string>()
  const out: FoodItem[] = []
  for (const need of [...recipe.need, ...recipe.optional]) {
    const hit = items.find((item) => !used.has(item.id) && sameFood(item.name, need))
    if (!hit) continue
    used.add(hit.id)
    out.push(hit)
  }
  return out
}

const STAPLES = ["soy sauce", "oyster sauce", "ginger"]

export function shopForIdeas(items: FoodItem[], ideas: RankedRecipe[]) {
  const rows = new Map<string, { name: string; recipeIds: string[] }>()
  for (const idea of ideas) {
    const names = new Map<string, string>()
    const addName = (name: string) => {
      const canonical = findShelf(name)?.name ?? name
      names.set(norm(canonical), canonical)
    }
    for (const need of idea.missing) addName(need)
    for (const name of [...idea.recipe.need, ...idea.recipe.optional]) {
      if (!STAPLES.some((staple) => sameFood(name, staple))) continue
      if (items.some((item) => sameFood(item.name, name))) continue
      addName(name)
    }
    for (const [key, name] of names) {
      const row = rows.get(key) ?? { name, recipeIds: [] }
      if (!row.recipeIds.includes(idea.recipe.id)) row.recipeIds.push(idea.recipe.id)
      rows.set(key, row)
    }
  }
  return [...rows.values()]
}

export function planMeals(
  items: FoodItem[],
  vegetarian: boolean,
  priority: Priority = 0,
  favorites: string[] = [],
) {
  const ranked = rankRecipes(items, vegetarian, priority, favorites)
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
