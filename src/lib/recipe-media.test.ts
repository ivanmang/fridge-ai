import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MORE } from "./more-dishes.ts"
import { RECIPE_MEDIA, enrichRecipe } from "./recipe-media.ts"

describe("RECIPE_MEDIA", () => {
  it("covers every home recipe with image + source", () => {
    const missing = MORE.filter((recipe) => !RECIPE_MEDIA[recipe.id]).map((recipe) => recipe.id)
    assert.deepEqual(missing, [])
    for (const recipe of MORE) {
      const media = RECIPE_MEDIA[recipe.id]
      assert.ok(media.image.startsWith("https://"), recipe.id)
      assert.ok(media.sourceUrl.startsWith("https://"), recipe.id)
      assert.ok(media.sourceName.trim().length > 0, recipe.id)
    }
  })

  it("enrichRecipe fills media without clobbering inline fields", () => {
    const base = MORE[0]
    const enriched = enrichRecipe(base)
    assert.equal(enriched.image, RECIPE_MEDIA[base.id].image)
    assert.equal(enriched.sourceUrl, RECIPE_MEDIA[base.id].sourceUrl)
    const custom = enrichRecipe({
      ...base,
      image: "https://example.com/custom.jpg",
      sourceUrl: "https://example.com/recipe",
      sourceName: "Custom",
    })
    assert.equal(custom.image, "https://example.com/custom.jpg")
    assert.equal(custom.sourceUrl, "https://example.com/recipe")
    assert.equal(custom.sourceName, "Custom")
  })
})
