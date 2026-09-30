import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  addDays,
  applyRecipeFilters,
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
  searchRecipes,
  statusOf,
  todayISO,
  trustLevel,
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
    assert.equal(trustLevel(RECIPES[0]), "idea")
    assert.equal(trustLevel(MORE[0]), "full")
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

  it("boosts lastTonight and saved recipes in ranking", () => {
    const items = sampleItems()
    const base = rankRecipes(items, false, 0, [])
    const topId = base[0]!.recipe.id
    const otherId = base.find((row) => row.recipe.id !== topId)?.recipe.id
    assert.ok(otherId)
    const boosted = rankRecipes(items, false, 0, [], null, [], {
      lastTonightId: otherId,
      savedIds: [otherId],
    })
    assert.equal(boosted[0]!.recipe.id, otherId)
  })
})

describe("applyRecipeFilters", () => {
  it("keeps fridge-first haveOnly and useSoon filters", () => {
    const ranked = rankRecipes(sampleItems(), false, 0, [])
    const have = applyRecipeFilters(ranked, { haveOnly: true, hideZeroMatch: true })
    assert.ok(have.every((row) => row.missing.length === 0 && row.matched.length > 0))
    const soon = applyRecipeFilters(ranked, { useSoon: true, hideZeroMatch: false })
    assert.ok(soon.every((row) => row.urgent.length > 0))
  })

  it("filters by cuisine, time, saved and cooked ids", () => {
    const ranked = rankRecipes(sampleItems(), false, 0, [])
    const cantonese = applyRecipeFilters(ranked, { cuisine: "Cantonese", hideZeroMatch: false })
    assert.ok(cantonese.every((row) => row.recipe.cuisine === "Cantonese"))
    const quick = applyRecipeFilters(ranked, { maxTime: 15, hideZeroMatch: false })
    assert.ok(quick.every((row) => row.recipe.time <= 15))
    const id = ranked[0]!.recipe.id
    const saved = applyRecipeFilters(ranked, { savedOnly: true, savedIds: [id], hideZeroMatch: false })
    assert.equal(saved.length, 1)
    assert.equal(saved[0]!.recipe.id, id)
    const cooked = applyRecipeFilters(ranked, { cookedOnly: true, cookedIds: [id], hideZeroMatch: false })
    assert.equal(cooked.length, 1)
  })
})

describe("searchRecipes", () => {
  it("matches name and ingredients without outlines by default", () => {
    const hits = searchRecipes("tomato", sampleItems(), false)
    assert.ok(hits.length > 0)
    assert.ok(hits.every((row) => !isOutlineRecipe(row.recipe)))
    assert.ok(
      hits.some((row) => {
        const blob = `${row.recipe.name} ${row.recipe.need.join(" ")}`.toLowerCase()
        return blob.includes("tomato")
      }),
    )
  })

  it("includes outlines only when opted in", () => {
    const without = searchRecipes("beef", sampleItems(), false, null, { includeOutlines: false, limit: 20 })
    const withOutlines = searchRecipes("beef", sampleItems(), false, null, { includeOutlines: true, limit: 20 })
    assert.ok(without.every((row) => !isOutlineRecipe(row.recipe)))
    assert.ok(withOutlines.length >= without.length)
  })

  it("returns empty for blank query", () => {
    assert.deepEqual(searchRecipes("  ", sampleItems(), false), [])
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

describe("home recipe coverage", () => {
  it("ships a solid cookable core beyond the original eight", () => {
    assert.ok(MORE.length >= 75)
    assert.ok(MORE.every((recipe) => recipe.id.startsWith("home-")))
    assert.ok(MORE.every((recipe) => recipe.steps.length >= 3 && !isOutlineRecipe(recipe)))
  })
})
