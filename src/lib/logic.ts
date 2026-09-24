import { RECIPES, type Recipe } from "@/lib/recipes"
import { SHELF, type ShelfFood } from "@/lib/shelf"

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
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

export function findShelf(name: string): ShelfFood | undefined {
  const n = norm(name)
  if (!n) return undefined
  let best: { food: ShelfFood; score: number } | undefined
  for (const food of SHELF) {
    for (const alias of [food.name, ...food.aliases].map(norm)) {
      if (!alias) continue
      const score = alias === n ? 100 + alias.length : n.includes(alias) || alias.includes(n) ? alias.length : 0
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

export function rankRecipes(items: FoodItem[], vegetarian: boolean): RankedRecipe[] {
  const pool = vegetarian ? RECIPES.filter(isVegetarian) : RECIPES
  return pool
    .map((recipe) => {
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
      const score = 5 * matched.length + 1.2 * optionalHits + 3 * urgent.length - 4 * missing.length
      return { recipe, score, matched, missing, urgent }
    })
    .filter((row) => row.matched.length > 0)
    .sort((a, b) => b.score - a.score || a.recipe.time - b.recipe.time)
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
