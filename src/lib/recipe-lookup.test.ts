import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { dishMatchTokens, isConfidentDishMatch, recipeSearchUrl } from "./recipe-lookup.ts"
import type { Recipe } from "./recipes.ts"

const sample: Recipe = {
  id: "home-tomato-egg-rice",
  name: "Tomato & egg rice",
  cuisine: "Hong Kong",
  time: 20,
  servings: 2,
  need: ["Tomato", "Eggs", "Cooked rice"],
  optional: [],
  steps: ["a", "b", "c"],
  zh: { name: "番茄炒蛋飯", steps: ["一", "二", "三"] },
}

const mapo: Recipe = {
  ...sample,
  id: "home-mapo-tofu-simple",
  name: "Simple mapo-style tofu",
  zh: { name: "簡易麻婆豆腐", steps: ["一", "二", "三"] },
}

describe("recipeSearchUrl", () => {
  it("builds an EN recipe web search from the dish name", () => {
    const url = recipeSearchUrl(sample, "en")
    assert.ok(url.startsWith("https://www.google.com/search?q="))
    assert.ok(url.includes(encodeURIComponent("Tomato & egg rice recipe")))
  })

  it("builds a ZH recipe web search from the Chinese name", () => {
    const url = recipeSearchUrl(sample, "zh")
    assert.ok(url.includes(encodeURIComponent("番茄炒蛋飯 食譜")))
  })
})

describe("isConfidentDishMatch", () => {
  it("accepts a Wikipedia page that contains the Chinese dish name", () => {
    assert.equal(isConfidentDishMatch(sample, "番茄炒蛋", "中国菜", "番茄炒蛋是常见家常菜"), true)
  })

  it("rejects a loosely related egg page for tomato egg rice", () => {
    assert.equal(isConfidentDishMatch(sample, "蛋包飯", "日本料理", "蛋包飯是包着炒蛋的米饭"), false)
  })

  it("requires distinctive English tokens for mapo tofu", () => {
    assert.deepEqual(dishMatchTokens(mapo).en.sort(), ["mapo", "tofu"])
    assert.equal(isConfidentDishMatch(mapo, "Mapo tofu", "Sichuan dish", "Mapo tofu is a tofu dish"), true)
    assert.equal(isConfidentDishMatch(mapo, "Douhua", "dessert", "Soft tofu pudding"), false)
  })

  it("rejects brand pages that only share a weak English token", () => {
    assert.equal(isConfidentDishMatch(sample, "Rotten Tomatoes", "review aggregator", "Tomatoes website"), false)
  })
})
