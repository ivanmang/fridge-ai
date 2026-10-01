import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Locale } from "@/lib/i18n"
import type { Recipe } from "@/lib/recipes"
import { emptySurvey, type SurveyAnswers } from "@/lib/survey"
import {
  defaultExpiry,
  findShelf,
  sampleItems,
  todayISO,
  type FoodItem,
  type Priority,
  type SuggestMode,
} from "@/lib/logic"
import { mergeShopNote, type ShopNote } from "@/lib/shop"

export type { ShopNote } from "@/lib/shop"
export { mergeShopNote, sameShopText } from "@/lib/shop"

export type ThemeMode = "dark" | "light"

export type FridgeSettings = {
  vegetarian: boolean
  notify: boolean
  remindHour: number
  lastPing: string
  puckHost: string
  locale: Locale
  /** Kitchen appearance — mint-on-dark default; light for bright counters. */
  theme: ThemeMode
  /** Optional legacy flag; cooking timer UI was removed. Kept for backup compat. */
  timerSound: boolean
  suggest: SuggestMode
  priority: Priority
  favorites: string[]
  wanted: string[]
  survey: SurveyAnswers
  /** True once the user has dismissed the first-run setup. */
  onboarded: boolean
  /** When false (default), browse/search hide the imported outline catalogue. */
  includeOutlines: boolean
  /** Bookmarked recipe ids for quick return. */
  savedRecipes: string[]
  /** Recently cooked recipe ids, newest first. */
  cookedHistory: string[]
  /** Last Tonight pick so repeat visits reopen the same dish when still ranked. */
  lastTonightId: string
  /** Dish committed via “I’m making this” until Clear fridge finishes (soft banner). */
  pendingMealId: string
}

type FridgeState = {
  items: FoodItem[]
  shop: ShopNote[]
  extras: Recipe[]
  settings: FridgeSettings
  addItem: (item: Omit<FoodItem, "id">) => void
  addMany: (items: Omit<FoodItem, "id">[]) => void
  updateItem: (id: string, patch: Partial<FoodItem>) => void
  removeItem: (id: string) => void
  removeMany: (ids: string[]) => void
  loadSample: () => void
  mergeSample: () => void
  clearItems: () => void
  replaceAll: (items: FoodItem[]) => void
  setSettings: (patch: Partial<FridgeSettings>) => void
  toggleSavedRecipe: (id: string) => void
  markCooked: (id: string) => void
  saveExtra: (recipe: Recipe) => void
  addShop: (text: string) => void
  toggleShop: (id: string) => void
  removeShop: (id: string) => void
  clearDoneShop: () => void
}

const emptySettings: FridgeSettings = {
  vegetarian: false,
  notify: false,
  remindHour: 18,
  lastPing: "",
  puckHost: "http://fridgesnap.local",
  locale: "en",
  theme: "dark",
  timerSound: true,
  suggest: "strict",
  priority: 0,
  favorites: [],
  wanted: [],
  survey: emptySurvey,
  onboarded: false,
  includeOutlines: false,
  savedRecipes: [],
  cookedHistory: [],
  lastTonightId: "",
  pendingMealId: "",
}

export const useFridge = create<FridgeState>()(
  persist(
    (set) => ({
      items: [],
      shop: [],
      extras: [],
      settings: emptySettings,
      addItem: (item) =>
        set((s) => ({ items: [{ ...item, id: crypto.randomUUID() }, ...s.items] })),
      addMany: (items) =>
        set((s) => ({
          items: [...items.map((item) => ({ ...item, id: crypto.randomUUID() })), ...s.items],
        })),
      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((item) => item.id !== id) })),
      removeMany: (ids) =>
        set((s) => ({ items: s.items.filter((item) => !ids.includes(item.id)) })),
      loadSample: () => set({ items: sampleItems() }),
      mergeSample: () =>
        set((s) => {
          const sample = sampleItems()
          const have = new Set(s.items.map((item) => item.name.toLowerCase()))
          const extra = sample.filter((item) => !have.has(item.name.toLowerCase()))
          return { items: [...extra, ...s.items] }
        }),
      clearItems: () => set({ items: [] }),
      replaceAll: (items) => set({ items }),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      toggleSavedRecipe: (id) =>
        set((s) => {
          const saved = s.settings.savedRecipes ?? []
          const next = saved.includes(id) ? saved.filter((item) => item !== id) : [id, ...saved].slice(0, 48)
          return { settings: { ...s.settings, savedRecipes: next } }
        }),
      markCooked: (id) =>
        set((s) => {
          const history = s.settings.cookedHistory ?? []
          const cookedHistory = [id, ...history.filter((item) => item !== id)].slice(0, 24)
          return { settings: { ...s.settings, cookedHistory, lastTonightId: id } }
        }),
      saveExtra: (recipe) =>
        set((s) => {
          const next = [recipe, ...(s.extras ?? []).filter((item) => item.id !== recipe.id)]
          const mine = next.filter((item) => item.id.startsWith("mine-"))
          const rest = next.filter((item) => !item.id.startsWith("mine-")).slice(0, 12)
          return { extras: [...mine.slice(0, 24), ...rest] }
        }),
      addShop: (text) => set((s) => ({ shop: mergeShopNote(s.shop, text) })),
      toggleShop: (id) =>
        set((s) => ({
          shop: s.shop.map((note) => (note.id === id ? { ...note, done: !note.done } : note)),
        })),
      removeShop: (id) => set((s) => ({ shop: s.shop.filter((note) => note.id !== id) })),
      clearDoneShop: () => set((s) => ({ shop: s.shop.filter((note) => !note.done) })),
    }),
    {
      name: "fridge-ai",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as Partial<FridgeState>
        return {
          ...current,
          ...raw,
          settings: withSettingsDefaults(raw.settings ?? current.settings),
          items: raw.items ?? current.items,
          shop: raw.shop ?? current.shop,
          extras: raw.extras ?? current.extras,
        }
      },
    },
  ),
)

export function draftFromName(name: string, qty = "1", opened = false): Omit<FoodItem, "id"> {
  const shelf = findShelf(name)
  const bought = todayISO()
  return {
    name: name.trim(),
    qty: qty.trim() || "1",
    location: shelf?.location ?? "fridge",
    bought,
    expires: defaultExpiry(name, bought, opened),
    expirySource: "estimated",
    opened,
  }
}

/** Merge persisted settings so older localStorage payloads get new defaults. */
export function withSettingsDefaults(partial?: Partial<FridgeSettings> | null): FridgeSettings {
  return { ...emptySettings, ...(partial ?? {}) }
}
