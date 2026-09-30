import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  deriveMaterials,
  formatMaterialQty,
  groupMaterials,
  legacyNeedOptional,
  recipeCores,
  recipeSoft,
  recipeStaples,
  withMaterials,
} from "./materials.ts"
import { MATERIALS_SYNC } from "./materials-sync.ts"
import { MORE } from "./more-dishes.ts"
import { enrichRecipe } from "./recipe-media.ts"
import { isRegistryName } from "./shelf.ts"

describe("recipe materials", () => {
  it("XO chicken fried rice exposes marinade + main groups with amounts", () => {
    const dish = MORE.find((r) => r.id === "home-xo-chicken-fried-rice")
    assert.ok(dish)
    assert.ok(dish.materials?.length)
    const groups = groupMaterials(dish).map((section) => section.group)
    assert.ok(groups.includes("marinade"))
    assert.ok(groups.includes("main"))
    assert.deepEqual(recipeCores(dish).sort(), [
      "Bean sprouts",
      "Chicken breast",
      "Cooked rice",
      "Eggs",
      "Onion",
      "XO sauce",
    ].sort())
    assert.ok(recipeCores(dish).includes("XO sauce"))
    assert.ok(recipeStaples(dish).includes("Soy sauce"))
    const chicken = dish.materials!.find((row) => row.name === "Chicken breast")
    assert.equal(chicken?.group, "marinade")
    assert.equal(chicken?.amount, 8)
    assert.equal(chicken?.unit, "oz")
    assert.match(formatMaterialQty(chicken!, "en"), /8 oz/)
    assert.match(formatMaterialQty(chicken!, "zh"), /8 盎司/)
  })

  it("chicken steak rice is café materials, not XO dump", () => {
    const dish = MORE.find((r) => r.id === "home-chicken-steak-rice")
    assert.ok(dish)
    assert.ok(dish.materials?.length)
    assert.deepEqual(recipeCores(dish).sort(), ["Chicken breast", "Cooked rice", "Eggs"].sort())
    assert.ok(!recipeSoft(dish).includes("Bean sprouts"))
    assert.ok(!recipeSoft(dish).includes("XO sauce"))
    assert.ok(recipeSoft(dish).includes("Ketchup"))
    const legacy = legacyNeedOptional(dish.materials!)
    assert.deepEqual(legacy.need.sort(), dish.need.sort())
  })

  it("structured materials only use registry names", () => {
    for (const recipe of MORE) {
      if (!recipe.materials?.length) continue
      for (const row of recipe.materials) {
        assert.ok(isRegistryName(row.name), `${recipe.id} materials → ${row.name}`)
      }
    }
    for (const [id, rows] of Object.entries(MATERIALS_SYNC)) {
      for (const row of rows) {
        assert.ok(isRegistryName(row.name), `sync ${id} → ${row.name}`)
      }
    }
  })

  it("deriveMaterials marks shelf staples and enrich attaches sync overlays", () => {
    const tomato = MORE.find((r) => r.id === "home-tomato-egg")
    assert.ok(tomato)
    assert.equal(tomato.materials, undefined)
    const derived = deriveMaterials(tomato)
    assert.ok(derived.some((row) => row.name === "Tomato" && row.role === "core"))
    assert.ok(derived.some((row) => row.name === "Soy sauce" && row.role === "staple"))
    const enriched = enrichRecipe(tomato)
    assert.ok(enriched.materials?.length)
    assert.ok(enriched.materials!.some((row) => row.name === "Tomato" && row.amount === 3))
    const flat = MORE.find((r) => r.id === "home-hk-borscht")
    assert.ok(flat)
    const withDerived = withMaterials(flat)
    assert.ok(withDerived.materials?.length)
    assert.equal(withDerived.materials!.every((row) => row.group === "main"), true)
  })

  it("high-traffic sync overlays include amounts for mapo and garlic pak choi", () => {
    assert.ok(MATERIALS_SYNC["home-mapo-tofu"]?.some((row) => row.amount != null))
    assert.ok(MATERIALS_SYNC["home-garlic-pak-choi"]?.some((row) => row.unit === "g"))
  })
})
