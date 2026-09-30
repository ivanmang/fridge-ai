import { z } from "zod"
import type { FridgeSettings } from "@/lib/store"
import type { FoodItem } from "@/lib/logic"
import type { Recipe } from "@/lib/recipes"
import type { ShopNote } from "@/lib/store"

const foodItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  qty: z.string(),
  location: z.enum(["fridge", "freezer", "pantry"]),
  bought: z.string().min(1),
  expires: z.string().min(1),
  expirySource: z.enum(["estimated", "package"]).optional(),
  opened: z.boolean(),
})

const shopNoteSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  done: z.boolean(),
})

const recipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cuisine: z.string(),
  time: z.number(),
  servings: z.number(),
  need: z.array(z.string()),
  optional: z.array(z.string()).default([]),
  steps: z.array(z.string()),
  zh: z
    .object({
      name: z.string(),
      steps: z.array(z.string()),
    })
    .optional(),
})

const surveySchema = z
  .object({
    done: z.boolean().optional(),
  })
  .passthrough()

const settingsSchema = z
  .object({
    vegetarian: z.boolean().optional(),
    notify: z.boolean().optional(),
    remindHour: z.number().int().min(0).max(23).optional(),
    lastPing: z.string().optional(),
    puckHost: z.string().optional(),
    locale: z.enum(["en", "zh"]).optional(),
    suggest: z.enum(["strict", "free"]).optional(),
    priority: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
    favorites: z.array(z.string()).optional(),
    wanted: z.array(z.string()).optional(),
    survey: surveySchema.optional(),
    onboarded: z.boolean().optional(),
    includeOutlines: z.boolean().optional(),
    savedRecipes: z.array(z.string()).optional(),
    cookedHistory: z.array(z.string()).optional(),
    lastTonightId: z.string().optional(),
  })
  .strict()

export const backupSchema = z
  .object({
    version: z.number().int().positive().optional(),
    items: z.array(foodItemSchema),
    shop: z.array(shopNoteSchema).optional(),
    extras: z.array(recipeSchema).optional(),
    settings: settingsSchema.optional(),
  })
  .strict()

export type ParsedBackup = {
  version: number
  items: FoodItem[]
  shop?: ShopNote[]
  extras?: Recipe[]
  settings?: Partial<FridgeSettings>
}

/** Validate a backup JSON payload. Rejects unknown settings keys and bad shapes. */
export function parseBackup(raw: unknown): ParsedBackup {
  const data = backupSchema.parse(raw)
  return {
    version: data.version ?? 1,
    items: data.items as FoodItem[],
    shop: data.shop as ShopNote[] | undefined,
    extras: data.extras as Recipe[] | undefined,
    settings: data.settings as Partial<FridgeSettings> | undefined,
  }
}

export const BACKUP_VERSION = 1
