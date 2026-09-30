import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  dishMatchTokens,
  guideSitesFor,
  isConfidentDishMatch,
  recipeOriginLang,
  recipeSearchUrl,
} from "./recipe-lookup.ts"
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

const avocado: Recipe = {
  ...sample,
  id: "home-avocado-toast",
  name: "Avocado toast",
  cuisine: "Western",
  need: ["Bread", "Avocado"],
  zh: { name: "牛油果多士", steps: ["一", "二", "三"] },
}

const baconEggRice: Recipe = {
  ...sample,
  id: "home-bacon-egg-rice",
  name: "Bacon egg rice",
  cuisine: "Western",
  need: ["Bacon", "Eggs", "Cooked rice"],
  zh: { name: "培根蛋飯", steps: ["一", "二", "三"] },
}

function queryOf(url: string) {
  return decodeURIComponent(url.split("q=")[1] ?? "")
}

describe("recipeSearchUrl", () => {
  it("searches Asian dishes in Chinese on Asian sites, even when UI is English", () => {
    assert.equal(recipeOriginLang(sample), "zh")
    const q = queryOf(recipeSearchUrl(sample, "en"))
    assert.ok(q.includes("site:madewithlau.com"))
    assert.ok(q.includes("site:hk.lkk.com"))
    assert.ok(q.includes("site:thewoksoflife.com"))
    assert.ok(q.includes("site:xiachufang.com"))
    assert.ok(!q.includes("bbc.co.uk"))
    assert.ok(q.includes("番茄炒蛋飯"))
    assert.ok(!q.includes("Tomato & egg rice"))
  })

  it("searches Western dishes in English on BBC, even when UI is Chinese", () => {
    assert.equal(recipeOriginLang(baconEggRice), "en")
    assert.deepEqual([...guideSitesFor(baconEggRice)], ["bbc.co.uk/food"])
    const q = queryOf(recipeSearchUrl(baconEggRice, "zh"))
    assert.ok(q.includes("site:bbc.co.uk/food"))
    assert.ok(q.includes("Bacon egg rice recipe"))
    assert.ok(!q.includes("培根蛋飯"))
    assert.ok(!q.includes("madewithlau.com"))
  })

  it("keeps Western avocado toast on BBC with the English name in ZH UI", () => {
    const q = queryOf(recipeSearchUrl(avocado, "zh"))
    assert.ok(q.includes("site:bbc.co.uk/food"))
    assert.ok(q.includes("Avocado toast recipe"))
    assert.ok(!q.includes("牛油果多士"))
  })

  it("uses Chinese name for HK dishes in ZH UI too", () => {
    const q = queryOf(recipeSearchUrl(sample, "zh"))
    assert.ok(q.includes("番茄炒蛋飯"))
    assert.ok(q.includes("site:hk.lkk.com"))
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
