import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  SHELF,
  SHELF_BY_ID,
  SHELF_BY_NAME,
  SHELF_NAMES,
  isRegistryName,
  isStapleIngredient,
  type IngredientCategory,
} from "./shelf.ts"
import { ZH_FOOD } from "./zh.ts"
import { MORE } from "./more-dishes.ts"
import { EXTRA } from "./extra-dishes.ts"
import { findShelf } from "./logic.ts"

const CATEGORIES: IngredientCategory[] = [
  "protein",
  "veg",
  "carb",
  "dairy",
  "sauce",
  "spice",
  "pantry",
  "other",
]

describe("ingredient registry", () => {
  it("has unique ids and unique canonical names", () => {
    const ids = SHELF.map((f) => f.id)
    const names = SHELF.map((f) => f.name)
    assert.equal(new Set(ids).size, ids.length)
    assert.equal(new Set(names).size, names.length)
    assert.ok(SHELF.length >= 100)
  })

  it("uses only allowed categories and valid locations", () => {
    for (const food of SHELF) {
      assert.ok(CATEGORIES.includes(food.category), `${food.name} category ${food.category}`)
      assert.ok(["fridge", "freezer", "pantry"].includes(food.location))
      assert.ok(food.days > 0)
      assert.equal(SHELF_BY_ID.get(food.id)?.name, food.name)
      assert.equal(SHELF_BY_NAME.get(food.name)?.id, food.id)
      assert.ok(SHELF_NAMES.has(food.name))
    }
  })

  it("marks oils/salt/soy as staples", () => {
    assert.equal(isStapleIngredient("Cooking oil"), true)
    assert.equal(isStapleIngredient("Salt"), true)
    assert.equal(isStapleIngredient("Soy sauce"), true)
    assert.equal(isStapleIngredient("Avocado"), false)
  })

  it("includes Lime and HK packaging aliases", () => {
    assert.ok(isRegistryName("Lime"))
    assert.equal(findShelf("青檸")?.name, "Lime")
    assert.equal(findShelf("生抽")?.name, "Soy sauce")
    assert.equal(findShelf("豬絞肉")?.name, "Ground pork")
    assert.equal(findShelf("公仔麵")?.name, "Instant noodles")
    assert.equal(findShelf("菜心")?.name, "Choi sum")
    assert.equal(findShelf("蠔油")?.name, "Oyster sauce")
    assert.equal(findShelf("chili flakes")?.name, "Dried chili")
    assert.equal(findShelf("sourdough")?.name, "Bread")
    assert.equal(ZH_FOOD.Lime, "青檸")
  })

  it("cookable home dishes reference registry names only", () => {
    const home = [...MORE, ...EXTRA].filter((r) => r.id.startsWith("home-"))
    assert.ok(home.length >= 100)
    for (const recipe of home) {
      for (const name of [...recipe.need, ...recipe.optional]) {
        assert.ok(isRegistryName(name), `${recipe.id} uses non-registry "${name}"`)
      }
    }
  })

  it("avocado toast matches BBC toast materials (no rice)", () => {
    const toast = MORE.find((r) => r.id === "home-avocado-toast")
    assert.ok(toast)
    assert.deepEqual(toast!.need.slice().sort(), ["Avocado", "Bread"].sort())
    assert.ok(!toast!.need.includes("Cooked rice"))
    assert.ok(!toast!.need.includes("Eggs"))
    assert.ok(toast!.optional.includes("Lime"))
    assert.ok(toast!.optional.includes("Dried chili"))
    assert.ok(toast!.optional.includes("Cilantro"))
  })
})
