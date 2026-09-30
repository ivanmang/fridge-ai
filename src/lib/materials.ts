import type { Recipe } from "@/lib/recipes"
import { isStapleIngredient } from "@/lib/shelf"

/** How a line participates in Tonight match / Shop. */
export type MaterialRole = "core" | "staple" | "optional"

/** Cook-order section — mirrors source 材料 groups when known. */
export type MaterialGroup = "marinade" | "sauce" | "main" | "garnish" | "other"

/** Structured recipe material (shelf-canonical `name` only). */
export type RecipeMaterial = {
  name: string
  role: MaterialRole
  group?: MaterialGroup
  amount?: number
  unit?: string
  note?: string
  zhNote?: string
}

const GROUP_ORDER: MaterialGroup[] = ["marinade", "sauce", "main", "garnish", "other"]

function uniqNames(names: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of names) {
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}

/** Required cook materials — drives match / missing / Shop cores. */
export function recipeCores(recipe: Recipe): string[] {
  if (recipe.materials?.length) {
    return uniqNames(recipe.materials.filter((row) => row.role === "core").map((row) => row.name))
  }
  return recipe.need
}

/** Soft materials (staples + optionals) — ranking bonus / secondary Shop. */
export function recipeSoft(recipe: Recipe): string[] {
  if (recipe.materials?.length) {
    return uniqNames(recipe.materials.filter((row) => row.role !== "core").map((row) => row.name))
  }
  return recipe.optional
}

/** Staple soft lines only (oil, soy, salt…). */
export function recipeStaples(recipe: Recipe): string[] {
  if (recipe.materials?.length) {
    return uniqNames(
      recipe.materials
        .filter((row) => row.role === "staple" || (row.role === "optional" && isStapleIngredient(row.name)))
        .map((row) => row.name),
    )
  }
  return recipe.optional.filter((name) => isStapleIngredient(name))
}

/** All materials for display / clear-fridge matching. */
export function recipeAllNames(recipe: Recipe): string[] {
  if (recipe.materials?.length) {
    return uniqNames(recipe.materials.map((row) => row.name))
  }
  return uniqNames([...recipe.need, ...recipe.optional])
}

export function materialByName(recipe: Recipe, name: string): RecipeMaterial | undefined {
  if (!recipe.materials?.length) return undefined
  const key = name.toLowerCase()
  return recipe.materials.find((row) => row.name.toLowerCase() === key)
}

/** Format amount + unit for EN/ZH prep lists. */
export function formatMaterialQty(
  material: Pick<RecipeMaterial, "amount" | "unit" | "note" | "zhNote">,
  locale: "en" | "zh",
): string {
  const note = locale === "zh" ? material.zhNote || material.note : material.note
  const parts: string[] = []
  if (material.amount != null && Number.isFinite(material.amount)) {
    const amount =
      material.amount % 1 === 0 ? String(material.amount) : String(Math.round(material.amount * 100) / 100)
    const unit = material.unit ? formatUnit(material.unit, locale, material.amount) : ""
    parts.push(unit ? `${amount} ${unit}` : amount)
  } else if (material.unit) {
    parts.push(formatUnit(material.unit, locale, 1))
  }
  if (note) parts.push(note)
  return parts.join(locale === "zh" ? " · " : " · ")
}

function formatUnit(unit: string, locale: "en" | "zh", amount: number): string {
  if (locale !== "zh") return unit
  const map: Record<string, string> = {
    tsp: "茶匙",
    tbsp: "湯匙",
    cup: "杯",
    cups: "杯",
    oz: "盎司",
    g: "克",
    ml: "毫升",
    clove: "瓣",
    cloves: "瓣",
    piece: amount > 1 ? "件" : "件",
    pieces: "件",
    bowl: "碗",
    bowls: "碗",
  }
  return map[unit] ?? unit
}

export type MaterialSection = {
  group: MaterialGroup
  items: RecipeMaterial[]
}

/** Group materials for prep UI (marinade → sauce → main → …). */
export function groupMaterials(recipe: Recipe): MaterialSection[] {
  const rows = recipe.materials
  if (!rows?.length) {
    const fallback: RecipeMaterial[] = [
      ...recipe.need.map((name) => ({ name, role: "core" as const, group: "main" as const })),
      ...recipe.optional.map((name) => ({
        name,
        role: (isStapleIngredient(name) ? "staple" : "optional") as MaterialRole,
        group: "main" as const,
      })),
    ]
    if (!fallback.length) return []
    return [{ group: "main", items: fallback }]
  }
  const buckets = new Map<MaterialGroup, RecipeMaterial[]>()
  for (const row of rows) {
    const group = row.group ?? "main"
    const list = buckets.get(group) ?? []
    list.push(row)
    buckets.set(group, list)
  }
  return GROUP_ORDER.filter((group) => buckets.has(group)).map((group) => ({
    group,
    items: buckets.get(group)!,
  }))
}

/** Build legacy need/optional arrays from structured materials (keep authors in sync). */
export function legacyNeedOptional(materials: RecipeMaterial[]): { need: string[]; optional: string[] } {
  return {
    need: uniqNames(materials.filter((row) => row.role === "core").map((row) => row.name)),
    optional: uniqNames(materials.filter((row) => row.role !== "core").map((row) => row.name)),
  }
}
