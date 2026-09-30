import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MORE } from "./more-dishes.ts"
import { EXTRA } from "./extra-dishes.ts"
import { RECIPE_IMAGES, enrichRecipe, recipeImage } from "./recipe-media.ts"

const cookable = [...MORE, ...EXTRA].filter((r) => r.id.startsWith("home-"))

describe("RECIPE_IMAGES", () => {
  it("covers every home cookable with a dish-specific https image (no Unsplash buckets)", () => {
    const missing = cookable.filter((recipe) => !RECIPE_IMAGES[recipe.id]).map((r) => r.id)
    assert.deepEqual(missing, [], `missing images for: ${missing.join(", ")}`)
    for (const recipe of cookable) {
      const url = RECIPE_IMAGES[recipe.id]
      assert.ok(url.startsWith("https://"), recipe.id)
      assert.ok(!url.includes("images.unsplash.com"), `unsplash bucket forbidden: ${recipe.id}`)
    }
  })

  it("recipeImage always returns a URL for home dishes", () => {
    for (const recipe of cookable) {
      const url = recipeImage(recipe)
      assert.ok(url?.startsWith("https://"), recipe.id)
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
})
