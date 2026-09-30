import assert from "node:assert/strict"
import { test } from "node:test"
import { formatInventoryQty, parseQtyString, syncQtyFromAmount } from "./inventory-qty.ts"

test("formatInventoryQty prefers structured amount+unit", () => {
  assert.equal(formatInventoryQty({ qty: "1", amount: 400, unit: "g" }, "en"), "400 g")
  assert.equal(formatInventoryQty({ qty: "1", amount: 2, unit: "piece" }, "zh"), "2 件")
  assert.equal(formatInventoryQty({ qty: "1 bunch" }, "en"), "1 bunch")
})

test("syncQtyFromAmount keeps freeform qty string in sync", () => {
  assert.equal(syncQtyFromAmount(1, "tbsp", "en"), "1 tbsp")
  assert.equal(syncQtyFromAmount(3, "clove", "zh"), "3 瓣")
  assert.equal(syncQtyFromAmount(undefined, "g", "en", "2"), "2")
})

test("parseQtyString reads simple amount+unit", () => {
  assert.deepEqual(parseQtyString("400 g"), { qty: "400 g", amount: 400, unit: "g" })
  assert.deepEqual(parseQtyString("6"), { qty: "6", amount: 6, unit: undefined })
  assert.equal(parseQtyString("1 bunch").qty, "1 bunch")
})
