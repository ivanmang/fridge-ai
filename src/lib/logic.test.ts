import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  addDays,
  defaultExpiry,
  dishSource,
  findShelf,
  fitsTaste,
  isOutlineRecipe,
  isVegetarian,
  listRecipes,
  planMeals,
  rankRecipes,
  sampleItems,
  statusOf,
  todayISO,
  type FoodItem,
} from "./logic.ts"
import { MORE } from "./more-dishes.ts"
import { RECIPES } from "./recipes.ts"
import { emptySurvey, type SurveyAnswers } from "./survey.ts"

function item(name: string, expiresIn: number, overrides: Partial<FoodItem> = {}): FoodItem {
  const bought = todayISO()
  return {
    id: `id-${name}`,
    name,
    qty: "1",
    location: findShelf(name)?.location ?? "fridge",
    bought,
    expires: addDays(bought, expiresIn),
    expirySource: "estimated",
    opened: false,
    ...overrides,
  }
}

describe("findShelf", () => {
  it("matches canonical English names", () => {
    assert.equal(findShelf("Milk")?.name, "Milk")
    assert.equal(findShelf("Choi sum")?.name, "Choi sum")
  })

  it("matches aliases including cheese → Cheddar", () => {
    assert.equal(findShelf("cheese")?.name, "Cheddar")
    assert.equal(findShelf("fresh milk")?.name, "Milk")
    assert.equal(findShelf("greek yogurt")?.name, "Yogurt")
  })

  it("matches Chinese food labels via ZH_FOOD", () => {
    assert.equal(findShelf("牛奶")?.name, "Milk")
    assert.equal(findShelf("雞蛋")?.name, "Eggs")
  })
})

describe("statusOf / defaultExpiry", () => {
  it("bands expiry status", () => {
    assert.equal(statusOf(addDays(todayISO(), -1)), "expired")
    assert.equal(statusOf(todayISO()), "today")
    assert.equal(statusOf(addDays(todayISO(), 2)), "soon")
    assert.equal(statusOf(addDays(todayISO(), 10)), "fresh")
  })

  it("uses shelf days for unopened food", () => {
    const eggs = defaultExpiry("Eggs", todayISO(), false)
    assert.equal(eggs, addDays(todayISO(), findShelf("Eggs")!.days))
  })

  it("caps opened food at 4 days", () => {
    assert.equal(defaultExpiry("Milk", todayISO(), true), addDays(todayISO(), 4))
  })
})

describe("dishSource / outline detection", () => {
  it("labels home, mine, lookup, knorr, guardian, and free-form LKK ids", () => {
    assert.equal(dishSource("home-tomato-egg-rice"), "home")
    assert.equal(dishSource("mine-abc"), "home")
    assert.equal(dishSource("x-1a2b"), "home")
    assert.equal(dishSource("knorr-soup"), "knorr")
    assert.equal(dishSource("guardian-salad"), "guardian")
    assert.equal(dishSource("lkk-beef"), "lkk")
    assert.equal(dishSource("fried-rice-with-beef"), "lkk")
  })

  it("marks imported three-line templates as outlines", () => {
    assert.equal(isOutlineRecipe(RECIPES[0]), true)
    assert.equal(isOutlineRecipe(MORE[0]), false)
  })
})

describe("rankRecipes / planMeals", () => {
  it("excludes expired items from matches", () => {
    const items = [item("Eggs", -2), item("Tomato", 2), item("Cooked rice", 1)]
    const ranked = rankRecipes(items, false, 0, [])
    const tomatoEgg = ranked.find((row) => row.recipe.id === "home-tomato-egg-rice")
    assert.ok(tomatoEgg)
    assert.ok(!tomatoEgg!.matched.includes("Eggs"))
    assert.ok(tomatoEgg!.missing.includes("Eggs"))
  })

  it("never ranks outline catalogue dishes for Tonight", () => {
    const ranked = rankRecipes(sampleItems(), false, 0, [])
    assert.ok(ranked.length > 0)
    assert.ok(ranked.every((row) => !isOutlineRecipe(row.recipe)))
    assert.ok(ranked.every((row) => row.recipe.id.startsWith("home-") || row.recipe.id.startsWith("mine-") || row.recipe.id.startsWith("x-")))
  })

  it("boosts home recipes and covers urgent food in planMeals", () => {
    const items = [
      item("Chicken breast", 1),
      item("Rice", 30),
      item("Ginger", 20),
      item("Choi sum", 1),
      item("Garlic", 20),
    ]
    const { ideas } = planMeals(items, false, 0, [])
    assert.ok(ideas.length >= 1)
    assert.ok(ideas.every((row) => row.recipe.id.startsWith("home-")))
    const urgentNames = new Set(ideas.flatMap((row) => row.urgent.map((name) => name.toLowerCase())))
    assert.ok([...urgentNames].some((name) => name.includes("chicken") || name.includes("choi")))
  })

  it("listRecipes defaults to cookable core only", () => {
    const cookable = listRecipes(false)
    const all = listRecipes(false, null, { includeOutlines: true })
    assert.ok(cookable.length >= 8)
    assert.ok(cookable.every((recipe) => !isOutlineRecipe(recipe)))
    assert.ok(all.length > cookable.length)
  })
})

describe("fitsTaste", () => {
  const veg: SurveyAnswers = {
    ...emptySurvey,
    done: true,
    diet: "vegetarian",
    heat: "mild",
    pace: "quick",
    skipped: false,
  }

  it("filters vegetarian and mild heat", () => {
    const meat = MORE.find((recipe) => !isVegetarian(recipe))!
    const greens = MORE.find((recipe) => recipe.id === "home-garlic-greens")!
    assert.equal(fitsTaste(meat, veg), false)
    assert.equal(fitsTaste(greens, veg), true)
  })

  it("respects pace caps", () => {
    const slow = { ...MORE[0], time: 40 }
    assert.equal(fitsTaste(slow, { ...veg, diet: "omnivore", pace: "15" }), false)
    assert.equal(fitsTaste(slow, { ...veg, diet: "omnivore", pace: "45" }), true)
  })
})
