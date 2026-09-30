import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MORE } from "./more-dishes.ts"
import { EXTRA } from "./extra-dishes.ts"
import {
  RECIPE_IMAGES,
  enrichRecipe,
  inferRecipeImage,
  recipeImage,
} from "./recipe-media.ts"
import type { Recipe } from "./recipes.ts"

const cookable = [...MORE, ...EXTRA].filter((r) => r.id.startsWith("home-"))

describe("RECIPE_IMAGES", () => {
  it("covers every home cookable with a https image", () => {
    const missing = cookable.filter((recipe) => !RECIPE_IMAGES[recipe.id]).map((r) => r.id)
    assert.deepEqual(missing, [], `missing images for: ${missing.join(", ")}`)
    for (const recipe of cookable) {
      const url = RECIPE_IMAGES[recipe.id]
      assert.ok(url.startsWith("https://images.unsplash.com/"), recipe.id)
    }
  })

  it("recipeImage always returns a URL for home dishes", () => {
    for (const recipe of cookable) {
      const url = recipeImage(recipe)
      assert.ok(url.startsWith("https://"), recipe.id)
    }
  })

  it("enrichRecipe fills image without clobbering inline fields", () => {
    const base = cookable[0]
    const enriched = enrichRecipe(base)
    assert.equal(enriched.image, RECIPE_IMAGES[base.id])
    const custom = enrichRecipe({
      ...base,
      image: "https://example.com/custom.jpg",
    })
    assert.equal(custom.image, "https://example.com/custom.jpg")
  })

  it("infers a photo for unmapped home ids (500+ scale)", () => {
    const draft: Recipe = {
      id: "home-future-garlic-broccoli-extra",
      name: "Garlic broccoli extra",
      cuisine: "Chinese",
      time: 10,
      servings: 2,
      need: ["Broccoli", "Garlic"],
      optional: [],
      steps: ["a", "b", "c"],
    }
    assert.equal(RECIPE_IMAGES[draft.id], undefined)
    assert.equal(inferRecipeImage(draft), RECIPE_IMAGES["home-garlic-broccoli"])
    assert.ok(recipeImage(draft).startsWith("https://"))
  })
})
