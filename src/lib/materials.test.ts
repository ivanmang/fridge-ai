import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  formatMaterialQty,
  groupMaterials,
  legacyNeedOptional,
  recipeCores,
  recipeSoft,
  recipeStaples,
} from "./materials.ts"
import { MORE } from "./more-dishes.ts"
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
  })
})
