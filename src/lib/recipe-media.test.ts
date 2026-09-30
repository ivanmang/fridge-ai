import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MORE } from "./more-dishes.ts"
import { EXTRA } from "./extra-dishes.ts"
import { RECIPE_IMAGES, enrichRecipe, recipeImage } from "./recipe-media.ts"
import { RECIPE_SOURCES, withRecipeSource } from "./recipe-sources.ts"
import { recipeGuideUrl, recipeSearchUrl } from "./recipe-lookup.ts"

const cookable = [...MORE, ...EXTRA].filter((r) => r.id.startsWith("home-"))

function isSearchUrl(url: string) {
  try {
    const u = new URL(url)
    if (/google\.|bing\.|duckduckgo\./i.test(u.host)) return true
    if (/\/search\b/i.test(u.pathname)) return true
    if ([...u.searchParams.keys()].some((k) => ["s", "q", "query", "keyword"].includes(k))) return true
    return false
  } catch {
    return true
  }
}

describe("RECIPE_IMAGES", () => {
  it("covers every home cookable with a dish-specific https image (no Unsplash buckets)", () => {
    const missing = cookable.filter((recipe) => !RECIPE_IMAGES[recipe.id]).map((r) => r.id)
    assert.deepEqual(missing, [], `missing images for: ${missing.join(", ")}`)
    for (const recipe of cookable) {
      const url = RECIPE_IMAGES[recipe.id]
      assert.ok(url.startsWith("https://"), recipe.id)
      assert.ok(!url.includes("images.unsplash.com"), `unsplash bucket forbidden: ${recipe.id}`)
      // Prefer publisher CDN from the recipe source page (not Flickr/Openverse stand-ins)
      assert.ok(
        /thewoksoflife\.com|cdn\.sanity\.io|ichef\.bbci\.co\.uk|cdn-akamai\.lkk\.com|chuimg\.com|xiachufang\.com|squarespace\.com|assets\.unileversolutions\.com|pic\.daydaycook\.com/i.test(
          url,
        ),
        `expected source-page host for ${recipe.id}: ${url}`,
      )
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
    assert.equal(enriched.image, RECIPE_IMAGES[base.id] || base.image)
    const custom = enrichRecipe({
      ...base,
      image: "https://example.com/custom.jpg",
    })
    assert.equal(custom.image, "https://example.com/custom.jpg")
  })
})

describe("direct recipe sources", () => {
  it("RECIPE_SOURCES only contains direct pages (never search URLs)", () => {
    for (const [id, src] of Object.entries(RECIPE_SOURCES)) {
      assert.ok(src.url.startsWith("https://"), id)
      assert.equal(isSearchUrl(src.url), false, `${id} looks like search: ${src.url}`)
      assert.ok(src.name.trim().length > 0, id)
    }
  })

  it("recipeGuideUrl returns direct pages and rejects search URLs", () => {
    const withSrc = cookable.map(withRecipeSource).find((r) => r.sourceUrl)
    assert.ok(withSrc)
    assert.ok(recipeGuideUrl(withSrc))
    assert.equal(isSearchUrl(recipeGuideUrl(withSrc)!), false)
    const searchy = {
      ...withSrc,
      sourceUrl: recipeSearchUrl(withSrc, "en"),
    }
    assert.equal(recipeGuideUrl(searchy), null)
  })

  it("withRecipeSource does not invent a search URL when unmapped", () => {
    const bare = cookable.find((r) => !r.sourceUrl && !RECIPE_SOURCES[r.id])
    if (!bare) return
    const enriched = withRecipeSource(bare)
    assert.equal(enriched.sourceUrl, undefined)
    assert.equal(recipeGuideUrl(enriched), null)
  })
})
