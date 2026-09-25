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

export type ShopNote = { id: string; text: string; done: boolean }

export type FridgeSettings = {
  vegetarian: boolean
  notify: boolean
  remindHour: number
  lastPing: string
  puckHost: string
  locale: Locale
  suggest: SuggestMode
  priority: Priority
  favorites: string[]
  wanted: string[]
  survey: SurveyAnswers
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
  clearItems: () => void
  replaceAll: (items: FoodItem[]) => void
  setSettings: (patch: Partial<FridgeSettings>) => void
  saveExtra: (recipe: Recipe) => void
  addShop: (text: string) => void
  toggleShop: (id: string) => void
  clearDoneShop: () => void
}

const emptySettings: FridgeSettings = {
  vegetarian: false,
  notify: false,
  remindHour: 18,
  lastPing: "",
  puckHost: "http://fridgesnap.local",
  locale: "en",
  suggest: "strict",
  priority: 0,
  favorites: [],
  wanted: [],
  survey: emptySurvey,
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
      clearItems: () => set({ items: [] }),
      replaceAll: (items) => set({ items }),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      saveExtra: (recipe) =>
        set((s) => {
          const next = [recipe, ...(s.extras ?? []).filter((item) => item.id !== recipe.id)]
          const mine = next.filter((item) => item.id.startsWith("mine-"))
          const rest = next.filter((item) => !item.id.startsWith("mine-")).slice(0, 12)
          return { extras: [...mine.slice(0, 24), ...rest] }
        }),
      addShop: (text) =>
        set((s) => ({
          shop: [...s.shop, { id: crypto.randomUUID(), text: text.trim(), done: false }],
        })),
      toggleShop: (id) =>
        set((s) => ({
          shop: s.shop.map((note) => (note.id === id ? { ...note, done: !note.done } : note)),
        })),
      clearDoneShop: () => set((s) => ({ shop: s.shop.filter((note) => !note.done) })),
    }),
    {
      name: "fridge-ai",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
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
    opened,
  }
}
