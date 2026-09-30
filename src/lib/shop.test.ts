import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { mergeShopNote, sameShopText, type ShopNote } from "./shop.ts"

describe("sameShopText", () => {
  it("ignores case and surrounding space", () => {
    assert.equal(sameShopText(" Milk ", "milk"), true)
    assert.equal(sameShopText("Eggs", "egg"), false)
  })
})

describe("mergeShopNote", () => {
  it("adds a new open note", () => {
    const next = mergeShopNote([], "Milk", "id-1")
    assert.deepEqual(next, [{ id: "id-1", text: "Milk", done: false }])
  })

  it("skips an open duplicate", () => {
    const shop: ShopNote[] = [{ id: "a", text: "Milk", done: false }]
    const next = mergeShopNote(shop, " milk ", "b")
    assert.equal(next, shop)
    assert.equal(next.length, 1)
  })

  it("revives a completed duplicate to the front", () => {
    const shop: ShopNote[] = [
      { id: "a", text: "Eggs", done: false },
      { id: "b", text: "Milk", done: true },
    ]
    const next = mergeShopNote(shop, "Milk", "c")
    assert.equal(next.length, 2)
    assert.equal(next[0].id, "b")
    assert.equal(next[0].done, false)
    assert.equal(next[0].text, "Milk")
    assert.equal(next[1].id, "a")
  })

  it("ignores blank text", () => {
    const shop: ShopNote[] = [{ id: "a", text: "Milk", done: false }]
    assert.equal(mergeShopNote(shop, "  ").length, 1)
  })
})
