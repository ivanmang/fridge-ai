import type { Locale } from "@/lib/i18n"
import { formatMaterialQty } from "@/lib/materials"

/** Common kitchen units for My food lines (aligned with recipe materials). */
export const INVENTORY_UNITS = ["g", "ml", "oz", "cup", "tbsp", "tsp", "piece", "pack", "bunch", "clove"] as const

export type InventoryUnit = (typeof INVENTORY_UNITS)[number]

export type QtyFields = {
  qty: string
  amount?: number
  unit?: string
}

/** Prefer structured amount+unit when present; else freeform qty. */
export function formatInventoryQty(item: QtyFields, locale: Locale): string {
  if (item.amount != null && Number.isFinite(item.amount)) {
    const formatted = formatMaterialQty({ amount: item.amount, unit: item.unit }, locale)
    if (formatted) return formatted
  }
  return item.qty.trim() || "1"
}

/** Keep freeform `qty` in sync when the user edits amount/unit. */
export function syncQtyFromAmount(amount: number | undefined, unit: string | undefined, locale: Locale, fallback = "1"): string {
  if (amount == null || !Number.isFinite(amount)) return fallback
  return formatMaterialQty({ amount, unit }, locale) || fallback
}

/** Parse a simple "400 g" / "6" style string into amount+unit when obvious. */
export function parseQtyString(raw: string): { amount?: number; unit?: string; qty: string } {
  const qty = raw.trim() || "1"
  const match = qty.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z\u4e00-\u9fff]+)?$/)
  if (!match) return { qty }
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return { qty }
  const unitRaw = (match[2] ?? "").toLowerCase()
  const zhMap: Record<string, string> = {
    克: "g",
    毫升: "ml",
    件: "piece",
    包: "pack",
    束: "bunch",
    杯: "cup",
    湯匙: "tbsp",
    茶匙: "tsp",
    瓣: "clove",
    盎司: "oz",
  }
  const unit = zhMap[match[2] ?? ""] ?? (INVENTORY_UNITS.includes(unitRaw as InventoryUnit) ? unitRaw : unitRaw || undefined)
  if (unit && !INVENTORY_UNITS.includes(unit as InventoryUnit) && !zhMap[match[2] ?? ""]) {
    return { qty, amount }
  }
  return { qty, amount, unit: unit || undefined }
}
