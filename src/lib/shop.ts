export type ShopNote = { id: string; text: string; done: boolean }

/** Case-insensitive match for shopping-list rows. */
export function sameShopText(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/**
 * Append a note, or revive a completed duplicate.
 * Skips when an open (not done) duplicate already exists.
 */
export function mergeShopNote(shop: ShopNote[], text: string, id: string = crypto.randomUUID()): ShopNote[] {
  const trimmed = text.trim()
  if (!trimmed) return shop
  const existing = shop.find((note) => sameShopText(note.text, trimmed))
  if (existing) {
    if (!existing.done) return shop
    return [{ ...existing, done: false, text: trimmed }, ...shop.filter((note) => note.id !== existing.id)]
  }
  return [...shop, { id, text: trimmed, done: false }]
}
