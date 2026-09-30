import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { BACKUP_VERSION, parseBackup } from "./backup.ts"
import { isScanErrorCode, scanErrorKey } from "./scan-errors.ts"

describe("scanErrorKey", () => {
  it("maps stable codes to i18n keys", () => {
    assert.equal(scanErrorKey("unavailable"), "scanUnavailable")
    assert.equal(scanErrorKey("limit"), "scanLimit")
    assert.equal(scanErrorKey("busy"), "scanBusy")
    assert.equal(scanErrorKey("timeout"), "scanTimeout")
    assert.equal(scanErrorKey("weird"), "scanFailed")
  })

  it("recognizes known codes", () => {
    assert.equal(isScanErrorCode("unavailable"), true)
    assert.equal(isScanErrorCode("Photo recognition is unavailable"), false)
  })
})

describe("parseBackup", () => {
  it("accepts a minimal valid backup with version", () => {
    const parsed = parseBackup({
      version: BACKUP_VERSION,
      items: [
        {
          id: "1",
          name: "Milk",
          qty: "1",
          location: "fridge",
          bought: "2026-01-01",
          expires: "2026-01-08",
          opened: false,
        },
      ],
    })
    assert.equal(parsed.version, BACKUP_VERSION)
    assert.equal(parsed.items.length, 1)
    assert.equal(parsed.items[0].name, "Milk")
  })

  it("rejects hostile settings shapes", () => {
    assert.throws(() =>
      parseBackup({
        items: [
          {
            id: "1",
            name: "Milk",
            qty: "1",
            location: "fridge",
            bought: "2026-01-01",
            expires: "2026-01-08",
            opened: false,
          },
        ],
        settings: { vegetarian: false, evil: true },
      }),
    )
  })

  it("rejects items missing required fields", () => {
    assert.throws(() => parseBackup({ items: [{ id: "1", name: "Milk" }] }))
  })

  it("merges optional shop and extras when present", () => {
    const parsed = parseBackup({
      items: [
        {
          id: "1",
          name: "Eggs",
          qty: "6",
          location: "fridge",
          bought: "2026-01-01",
          expires: "2026-01-14",
          opened: false,
        },
      ],
      shop: [{ id: "s1", text: "Butter", done: false }],
      extras: [
        {
          id: "mine-1",
          name: "Toast",
          cuisine: "Home",
          time: 5,
          servings: 1,
          need: ["bread"],
          optional: [],
          steps: ["Toast bread"],
        },
      ],
      settings: { locale: "zh", vegetarian: true },
    })
    assert.equal(parsed.shop?.[0].text, "Butter")
    assert.equal(parsed.extras?.[0].name, "Toast")
    assert.equal(parsed.settings?.locale, "zh")
  })
})
