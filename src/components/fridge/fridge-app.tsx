import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react"
import {
  Bell,
  Camera,
  Check,
  Plus,
  Refrigerator,
  Settings,
  ShoppingBasket,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { scanFoods } from "@/lib/scan.functions"
import type { ScanHit } from "@/lib/scan.functions"
import { SHELF } from "@/lib/shelf"
import {
  addDays,
  daysUntil,
  defaultExpiry,
  findShelf,
  foodsForMeal,
  ideasByIds,
  planMeals,
  rankRecipes,
  searchRecipes,
  shopForIdeas,
  statusOf,
  todayISO,
  type FoodItem,
  type ItemStatus,
} from "@/lib/logic"
import { draftFromName, useFridge, type ShopNote } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  cuisineLabel,
  foodLabel,
  placeLabel,
  recipeText,
  statusText,
  translate,
  whenText,
  type Locale,
  type UiKey,
} from "@/lib/i18n"

type Tab = "tonight" | "fridge" | "scan" | "shop"
type Draft = Omit<FoodItem, "id">
type ScanRow = ScanHit & { on: boolean; expires: string }

const fieldClass =
  "h-11 w-full rounded-card border border-line bg-raised px-3 text-fg outline-none focus-visible:outline-2 focus-visible:outline-mint"

const TABS: { id: Tab; icon: typeof UtensilsCrossed }[] = [
  { id: "tonight", icon: UtensilsCrossed },
  { id: "fridge", icon: Refrigerator },
  { id: "scan", icon: Camera },
  { id: "shop", icon: ShoppingBasket },
]

const CUISINES = ["All", "Cantonese", "Hong Kong", "Chinese", "Western"]
const FAVORITE_CUISINES = ["Cantonese", "Hong Kong", "Chinese", "Sichuan", "Japanese", "Korean", "Italian", "Western", "Asian", "Breakfast"]

function SuggestControl() {
  const { locale, t } = useI18n()
  const settings = useFridge((s) => s.settings)
  const setSettings = useFridge((s) => s.setSettings)
  const priority = settings.priority ?? (settings.suggest === "free" ? 3 : 0)
  const favorites = settings.favorites ?? []
  const note = t((["priorityNote0", "priorityNote1", "priorityNote2", "priorityNote3"] as const)[priority])
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            [0, "priority0"],
            [1, "priority1"],
            [2, "priority2"],
            [3, "priority3"],
          ] as const
        ).map(([level, key]) => (
          <button
            key={level}
            type="button"
            onClick={() => setSettings({ priority: level })}
            className={cn(
              "h-11 rounded-full border text-sm font-semibold",
              priority === level ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
            )}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{note}</p>
      {priority > 0 && (
        <>
          <p className="mt-3 text-sm">{t("pickFavorites")}</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {FAVORITE_CUISINES.map((name) => {
              const on = favorites.includes(name)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    setSettings({
                      favorites: on ? favorites.filter((item) => item !== name) : [...favorites, name],
                    })
                  }
                  className={cn(
                    "h-11 shrink-0 rounded-full border px-3 text-sm",
                    on ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
                  )}
                >
                  {cuisineLabel(locale, name)}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function DishSearch() {
  const { locale, t } = useI18n()
  const items = useFridge((s) => s.items)
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const wanted = useFridge((s) => s.settings.wanted) ?? []
  const setSettings = useFridge((s) => s.setSettings)
  const [query, setQuery] = useState("")
  const hits = useMemo(() => searchRecipes(query, items, vegetarian), [query, items, vegetarian])
  const picked = useMemo(() => ideasByIds(wanted, items), [wanted, items])

  function toggle(id: string) {
    setSettings({ wanted: wanted.includes(id) ? wanted.filter((item) => item !== id) : [...wanted, id] })
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchDish")}
        className="h-11 w-full rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
      />
      {query.trim() && (
        <ul className="mt-2 space-y-2">
          {!hits.length && <li className="text-sm text-muted">{t("noDish")}</li>}
          {hits.map((row) => {
            const copy = recipeText(locale, row.recipe)
            const on = wanted.includes(row.recipe.id)
            return (
              <li key={row.recipe.id}>
                <button
                  type="button"
                  onClick={() => toggle(row.recipe.id)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-3 rounded-card border px-4 text-left",
                    on ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface",
                  )}
                >
                  <span>
                    <span className="block font-medium">{copy.name}</span>
                    <span className={cn("text-sm", on ? "text-mint-ink" : "text-muted")}>
                      {copy.cuisine}
                      {row.missing.length ? ` · ${t("missing", { list: row.missing.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ") })}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {picked.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{t("wantedNow")}</p>
            <button type="button" onClick={() => setSettings({ wanted: [] })} className="text-sm text-muted">
              {t("clearWanted")}
            </button>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {picked.map((row) => (
              <button
                key={row.recipe.id}
                type="button"
                onClick={() => toggle(row.recipe.id)}
                className="h-11 shrink-0 rounded-full border border-mint bg-mint px-3 text-sm font-semibold text-mint-ink"
              >
                {recipeText(locale, row.recipe).name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function useI18n() {
  const locale = (useFridge((s) => s.settings.locale) || "en") as Locale
  const t = (key: UiKey, vars?: Record<string, string | number>) => translate(locale, key, vars)
  return { locale, t }
}

export function FridgeApp() {
  const [tab, setTab] = useState<Tab>("tonight")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editing, setEditing] = useState<FoodItem | null>(null)
  const [adding, setAdding] = useState(false)

  useLayoutEffect(() => {
    void useFridge.persist.rehydrate()
  }, [])

  const items = useFridge((s) => s.items)
  const settings = useFridge((s) => s.settings)
  const setSettings = useFridge((s) => s.setSettings)
  const { locale, t } = useI18n()

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-Hant" : "en"
  }, [locale])

  useEffect(() => {
    if (!settings.notify) return
    const tick = () => {
      const state = useFridge.getState()
      if (!state.settings.notify) return
      const now = new Date()
      if (now.getHours() < state.settings.remindHour) return
      const day = todayISO(now)
      if (state.settings.lastPing === day) return
      const urgent = state.items.filter((item) => daysUntil(item.expires) <= 0)
      if (!urgent.length) return
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const names = urgent.slice(0, 3).map((item) => foodLabel(state.settings.locale || "en", item.name))
        const extra = urgent.length - names.length
        const lang = (state.settings.locale || "en") as Locale
        const body = extra > 0 ? translate(lang, "notifyMore", { names: names.join("、"), n: extra }) : names.join(lang === "zh" ? "、" : ", ")
        new Notification(translate(lang, "notifyTitle"), { body })
      }
      state.setSettings({ lastPing: day })
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [settings.notify, settings.remindHour, locale])

  const urgentCount = items.filter((item) => daysUntil(item.expires) <= 0).length

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-bg pb-28 text-fg">
      <header className="flex items-start justify-between gap-3 px-5 pt-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">{t("kicker")}</p>
          <h1 className="font-display text-4xl leading-none">FridgeAI</h1>
          <p className="mt-2 text-sm tabular-nums text-muted">
            {t("stored", { n: items.length })}
            {urgentCount > 0 ? ` · ${t("useTodayCount", { n: urgentCount })}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSettings({ locale: locale === "zh" ? "en" : "zh" })}
            className="grid h-11 min-w-11 place-items-center rounded-full border border-line bg-surface px-3 text-sm font-semibold text-fg"
            aria-label={locale === "zh" ? t("switchToEn") : t("switchToZh")}
          >
            {locale === "zh" ? "EN" : "中"}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="grid size-11 place-items-center rounded-full border border-line bg-surface text-fg"
            aria-label={t("settings")}
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      {urgentCount > 0 && tab !== "tonight" && (
        <div className="px-5">
          <button
            type="button"
            onClick={() => setTab("tonight")}
            className="mt-4 flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left"
          >
          <Bell className="size-4 shrink-0 text-clay" />
          <span className="text-sm">
            {urgentCount === 1 ? t("bannerOne") : t("bannerMany", { n: urgentCount })}
          </span>
          </button>
        </div>
      )}

      <div className="px-5 pt-5">
        {tab === "tonight" && <Tonight items={items} />}
        {tab === "fridge" && <FridgeList items={items} onAdd={() => setAdding(true)} onOpen={setEditing} />}
        {tab === "scan" && <ScanPanel />}
        {tab === "shop" && <ShopPanel items={items} />}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((item) => {
            const Icon = item.icon
            const on = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-xs",
                  on ? "text-mint" : "text-muted",
                )}
              >
                <Icon className="size-5" />
                {t(item.id)}
              </button>
            )
          })}
        </div>
      </nav>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      {adding && <ItemSheet onClose={() => setAdding(false)} />}
      {editing && <ItemSheet item={editing} onClose={() => setEditing(null)} />}
    </main>
  )
}

function Tonight({ items }: { items: FoodItem[] }) {
  const { locale, t } = useI18n()
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const priority = useFridge((s) => (s.settings.priority ?? (s.settings.suggest === "free" ? 3 : 0)) as 0 | 1 | 2 | 3)
  const favorites = useFridge((s) => s.settings.favorites) ?? []
  const wanted = useFridge((s) => s.settings.wanted) ?? []
  const addItem = useFridge((s) => s.addItem)
  const addShop = useFridge((s) => s.addShop)
  const removeMany = useFridge((s) => s.removeMany)
  const shop = useFridge((s) => s.shop)
  const [cuisine, setCuisine] = useState("All")
  const [phase, setPhase] = useState<"pick" | "cook" | "plate">("pick")
  const [mealId, setMealId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [checked, setChecked] = useState<string[]>([])
  const [leftovers, setLeftovers] = useState(false)
  const [note, setNote] = useState("")
  const all = useMemo(() => rankRecipes(items, vegetarian, priority, favorites), [items, vegetarian, priority, favorites])
  const plan = useMemo(() => planMeals(items, vegetarian, priority, favorites), [items, vegetarian, priority, favorites])
  const picked = useMemo(() => ideasByIds(wanted, items), [wanted, items])
  const shopRows = picked.length ? shopForIdeas(items, picked) : plan.shop
  const shopIdeas = picked.length ? picked : plan.ideas
  const ranked =
    priority < 2
      ? cuisine === "All"
        ? all
        : all.filter((row) => row.recipe.cuisine === cuisine)
      : [
          ...plan.ideas,
          ...all.filter((row) => {
            if (plan.ideas.some((idea) => idea.recipe.id === row.recipe.id)) return false
            if (!favorites.length) return true
            return favorites.includes(row.recipe.cuisine)
          }),
        ]
  const active =
    (mealId ? all.find((row) => row.recipe.id === mealId) : undefined) ??
    (priority >= 2 ? plan.ideas[0] : undefined) ??
    ranked[0]
  const rest = ranked.filter((row) => row.recipe.id !== active?.recipe.id).slice(0, 4)
  const join = (names: string[]) => names.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ")
  const dish = active ? recipeText(locale, active.recipe) : null
  const used = active ? foodsForMeal(active.recipe, items) : []

  function addSuggested() {
    const have = new Set(shop.map((row) => row.text.toLowerCase()))
    for (const row of shopRows) {
      const label = foodLabel(locale, row.name)
      if (!have.has(label.toLowerCase())) addShop(label)
    }
    setNote(t("onList"))
  }

  function startCook(id: string) {
    setMealId(id)
    setStepIndex(0)
    setNote("")
    setPhase("cook")
  }

  function openPlate() {
    if (!active) return
    setChecked(foodsForMeal(active.recipe, items).map((item) => item.id))
    setLeftovers(false)
    setPhase("plate")
  }

  function finishMeal() {
    if (!dish) return
    if (!checked.length && !leftovers) {
      setNote(t("nothingUsed"))
      setPhase("pick")
      setMealId(null)
      return
    }
    if (checked.length) removeMany(checked)
    if (leftovers) {
      const today = todayISO()
      addItem({
        name: "Cooked leftovers",
        qty: dish.name,
        location: "fridge",
        bought: today,
        expires: addDays(today, 3),
        opened: true,
      })
    }
    setNote(t("mealDone"))
    setPhase("pick")
    setMealId(null)
  }

  function listMissing() {
    if (!active) return
    const have = new Set(shop.map((row) => row.text.toLowerCase()))
    for (const name of active.missing) {
      const label = foodLabel(locale, name)
      if (!have.has(label.toLowerCase())) addShop(label)
    }
    setNote(t("onList"))
  }

  return (
    <section className="space-y-4">
      {active && dish && (
        <ol className="grid grid-cols-3 gap-2 text-center text-xs">
          {(
            [
              ["pick", "flowChoose"],
              ["cook", "flowCook"],
              ["plate", "flowClear"],
            ] as const
          ).map(([id, key], index) => {
            const on = phase === id
            const done = (phase === "cook" && index === 0) || (phase === "plate" && index < 2)
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    if (id === "pick") setPhase("pick")
                    if (id === "cook" && phase === "plate") setPhase("cook")
                  }}
                  className={cn(
                    "h-11 w-full rounded-full border",
                    on ? "border-mint bg-mint text-mint-ink" : done ? "border-line bg-surface text-fg" : "border-line text-muted",
                  )}
                >
                  {index + 1} {t(key)}
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {phase === "pick" && <SuggestControl />}
      {phase === "pick" && <DishSearch />}

      {phase === "pick" && priority < 2 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CUISINES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCuisine(name)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-2 text-sm",
                cuisine === name ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
              )}
            >
              {cuisineLabel(locale, name)}
            </button>
          ))}
        </div>
      )}

      {!items.length && priority < 2 && <Empty title={t("emptyTitle")} body={t("emptyBody")} />}
      {items.length > 0 && !active && <Empty title={t("filterTitle")} body={t("filterBody")} />}
      {note && <p className="text-sm text-mint">{note}</p>}

      {active && dish && phase === "pick" && (
        <article className="rounded-card border border-line bg-surface p-5">
          <p className="text-xs font-medium tracking-wide text-mint uppercase">{dish.cuisine}</p>
          <h2 className={cn("mt-1 font-display text-3xl", locale === "en" && "italic")}>{dish.name}</h2>
          <p className="mt-2 text-sm text-muted">
            {t("minutes", { n: active.recipe.time })} ·{" "}
            {active.recipe.servings === 1 ? t("serving") : t("servings", { n: active.recipe.servings })}
          </p>
          {active.urgent.length > 0 && <p className="mt-3 text-sm text-clay">{t("usesSoon", { list: join(active.urgent) })}</p>}
          {active.missing.length > 0 ? (
            <p className="mt-2 text-sm text-muted">{t("stillNeed", { list: join(active.missing) })}</p>
          ) : (
            <p className="mt-2 text-sm text-muted">{t("haveAll")}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => startCook(active.recipe.id)} className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink">
              {t("cookThis")}
            </button>
            {rest[0] && (
              <button type="button" onClick={() => setMealId(rest[0].recipe.id)} className="h-11 rounded-card border border-line px-4 text-sm font-semibold">
                {t("another")}
              </button>
            )}
          </div>
        </article>
      )}

      {active && dish && phase === "cook" && (
        <article className="rounded-card border border-line bg-surface p-5">
          <p className="text-xs font-medium tracking-wide text-mint uppercase">{dish.name}</p>
          <p className="mt-1 text-sm text-muted">{t("stepOf", { n: stepIndex + 1, m: dish.steps.length })}</p>
          <ol className="mt-4 space-y-2 text-sm">
            {dish.steps.map((step, i) => (
              <li key={step} className={cn("flex gap-3", i !== stepIndex && "text-muted")}>
                <span className={cn("tabular-nums", i === stepIndex && "text-mint")}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {active.missing.length > 0 && (
            <button type="button" onClick={listMissing} className="mt-4 text-sm text-muted underline">
              {t("addMissing")}
            </button>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((n) => Math.max(0, n - 1))}
              disabled={stepIndex === 0}
              className="h-11 rounded-card border border-line px-4 text-sm font-semibold disabled:opacity-40"
            >
              {t("prev")}
            </button>
            {stepIndex < dish.steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStepIndex((n) => n + 1)}
                className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink"
              >
                {t("next")}
              </button>
            ) : (
              <button type="button" onClick={openPlate} className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink">
                {t("ate")}
              </button>
            )}
          </div>
          {stepIndex < dish.steps.length - 1 && (
            <button type="button" onClick={openPlate} className="mt-3 w-full text-sm text-muted">
              {t("ate")}
            </button>
          )}
        </article>
      )}

      {active && dish && phase === "plate" && (
        <article className="rounded-card border border-line bg-surface p-5">
          <h2 className={cn("font-display text-3xl", locale === "en" && "italic")}>{dish.name}</h2>
          <p className="mt-2 text-sm text-muted">{used.length ? t("plateLead") : t("nothingUsed")}</p>
          {used.length > 0 && (
            <ul className="mt-4 space-y-2">
              {used.map((item) => (
                <li key={item.id}>
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={checked.includes(item.id)}
                      onChange={(e) =>
                        setChecked((current) =>
                          e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                        )
                      }
                      className="size-5 accent-mint"
                    />
                    {foodLabel(locale, item.name)}
                    <span className="text-muted">{item.qty}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <label className="mt-4 flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={leftovers} onChange={(e) => setLeftovers(e.target.checked)} className="size-5 accent-mint" />
            {t("keepLeft")}
          </label>
          <button type="button" onClick={finishMeal} className="mt-4 h-11 w-full rounded-card bg-mint font-semibold text-mint-ink">
            {t("updateFridge")}
          </button>
        </article>
      )}

      {phase === "pick" && (shopRows.length > 0 || picked.length > 0) && (
        <article className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-2xl">{t("suggestedList")}</h2>
          {picked.length > 0 && <p className="mt-1 text-sm text-muted">{t("wantedNow")}</p>}
          {shopRows.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t("nothingExtra")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {shopRows.map((row) => (
                <li key={row.name} className="text-sm">
                  <span className="font-medium">{foodLabel(locale, row.name)}</span>
                  <span className="text-muted">
                    {" "}
                    · {t("forList", { list: join(row.recipeIds.map((id) => recipeText(locale, shopIdeas.find((idea) => idea.recipe.id === id)!.recipe).name)) })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {shopRows.length > 0 && (
            <button type="button" onClick={addSuggested} className="mt-4 h-11 w-full rounded-card bg-mint font-semibold text-mint-ink">
              {t("addToNotes")}
            </button>
          )}
        </article>
      )}

      {phase === "pick" && rest.length > 0 && (
        <ul className="space-y-2">
          {rest.map((row) => {
            const copy = recipeText(locale, row.recipe)
            return (
              <li key={row.recipe.id} className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{copy.name}</p>
                  <p className="text-sm text-muted">
                    {copy.cuisine} · {t("minutes", { n: row.recipe.time })}
                    {row.missing.length ? ` · ${t("missing", { list: join(row.missing) })}` : ""}
                  </p>
                </div>
                <button type="button" onClick={() => startCook(row.recipe.id)} className="h-11 shrink-0 rounded-card border border-line px-3 text-sm font-semibold">
                  {t("cookThis")}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function FridgeList({
  items,
  onAdd,
  onOpen,
}: {
  items: FoodItem[]
  onAdd: () => void
  onOpen: (item: FoodItem) => void
}) {
  const { locale, t } = useI18n()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | ItemStatus>("all")
  const q = query.trim().toLowerCase()
  const shown = items
    .filter((item) => (filter === "all" ? true : statusOf(item.expires) === filter))
    .filter((item) => item.name.toLowerCase().includes(q) || foodLabel(locale, item.name).toLowerCase().includes(q))
    .slice()
    .sort((a, b) => a.expires.localeCompare(b.expires))

  return (
    <section>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="h-11 min-w-0 flex-1 rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
        />
        <button
          type="button"
          onClick={onAdd}
          className="grid size-11 shrink-0 place-items-center rounded-card bg-mint text-mint-ink"
          aria-label={t("addFood")}
        >
          <Plus className="size-5" />
        </button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {(["all", "today", "soon", "expired", "fresh"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-2 text-sm",
              filter === key ? "border-mint bg-mint text-mint-ink" : "border-line text-muted",
            )}
          >
            {key === "all" ? t("all") : statusText(locale, key)}
          </button>
        ))}
      </div>
      {!shown.length && (
        <Empty
          title={items.length ? t("filterEmpty") : t("noneStored")}
          body={items.length ? t("clearSearch") : t("addOrScan")}
        />
      )}
      <ul className="mt-4 space-y-2">
        {shown.map((item) => {
          const status = statusOf(item.expires)
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left"
              >
                <span
                  className={cn(
                    "h-10 w-1 shrink-0 rounded-full",
                    status === "expired" || status === "today" ? "bg-clay" : status === "soon" ? "bg-mint" : "bg-line",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{foodLabel(locale, item.name)}</span>
                  <span className="block text-sm text-muted">
                    {item.qty} · {placeLabel(locale, item.location)}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-right text-sm tabular-nums",
                    status === "expired" || status === "today" ? "text-clay" : "text-muted",
                  )}
                >
                  <span className="block">{statusText(locale, status)}</span>
                  <span className="block">{whenText(locale, item.expires)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ScanPanel() {
  const addMany = useFridge((s) => s.addMany)
  const puckHost = useFridge((s) => s.settings.puckHost || "http://fridgesnap.local")
  const { locale, t } = useI18n()
  const [preview, setPreview] = useState("")
  const [rows, setRows] = useState<ScanRow[]>([])
  const [busy, setBusy] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")

  async function onFile(file: File | undefined) {
    if (!file) return
    setError("")
    setSaved("")
    setRows([])
    const image = await shrinkImage(file)
    if (!image) {
      setError(t("tooLarge"))
      return
    }
    setPreview(image)
  }

  async function pullDoor() {
    setPulling(true)
    setError("")
    setSaved("")
    setRows([])
    try {
      const file = await fetchDoorPhoto(puckHost)
      await onFile(file)
    } catch (err) {
      setError(puckError(locale, err))
    } finally {
      setPulling(false)
    }
  }

  async function identify() {
    if (!preview) return
    setBusy(true)
    setError("")
    setSaved("")
    try {
      const result = await scanFoods({ data: { image: preview } })
      if (!result.ok) {
        setError(result.error)
        setRows([])
        return
      }
      if (!result.foods.length) {
        setError(t("nothingSeen"))
        setRows([])
        return
      }
      setRows(result.foods.map((food) => ({ ...food, name: foodLabel(locale, food.name), on: true, expires: defaultExpiry(food.name) })))
    } catch {
      setError(t("scanFailed"))
    } finally {
      setBusy(false)
    }
  }

  function save() {
    const chosen = rows.filter((row) => row.on && row.name.trim())
    if (!chosen.length) {
      setError(t("tickOne"))
      return
    }
    addMany(chosen.map((row) => ({ ...draftFromName(row.name, row.qty), expires: row.expires })))
    setRows([])
    setPreview("")
    setSaved(t("added", { n: chosen.length }))
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted">
        {t("scanIntro")}
      </p>
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface px-4 py-6 text-center">
        <Camera className="size-6 text-mint" />
        <span className="mt-2 text-sm font-medium">{t("takePhoto")}</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </label>
      <button
        type="button"
        disabled={pulling || busy}
        onClick={() => void pullDoor()}
        className="h-11 w-full rounded-card border border-line bg-surface font-semibold disabled:opacity-60"
      >
        {pulling ? t("askingPuck") : t("lastDoor")}
      </button>
      {preview && <img src={preview} alt={t("shelfAlt")} className="max-h-56 w-full rounded-card object-cover" />}
      {preview && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void identify()}
          className="h-11 w-full rounded-card bg-mint font-semibold text-mint-ink disabled:opacity-60"
        >
          {busy ? t("reading") : t("identify")}
        </button>
      )}
      {error && <p className="text-sm text-clay">{error}</p>}
      {saved && <p className="text-sm text-mint">{saved}</p>}
      {rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted">{t("uncheck")}</p>
          {rows.map((row, index) => (
            <div key={`${row.name}-${index}`} className="rounded-card border border-line bg-surface p-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={row.on}
                  onChange={(e) =>
                    setRows((current) => current.map((item, i) => (i === index ? { ...item, on: e.target.checked } : item)))
                  }
                  className="size-5 accent-mint"
                />
                <input
                  value={row.name}
                  onChange={(e) =>
                    setRows((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, name: e.target.value, expires: defaultExpiry(e.target.value) } : item,
                      ),
                    )
                  }
                  className="h-10 min-w-0 flex-1 bg-transparent font-medium outline-none"
                />
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  value={row.qty}
                  onChange={(e) =>
                    setRows((current) => current.map((item, i) => (i === index ? { ...item, qty: e.target.value } : item)))
                  }
                  aria-label={t("qty")}
                  className={fieldClass}
                />
                <input
                  type="date"
                  value={row.expires}
                  onChange={(e) =>
                    setRows((current) => current.map((item, i) => (i === index ? { ...item, expires: e.target.value } : item)))
                  }
                  aria-label={t("expires")}
                  className={fieldClass}
                />
              </div>
            </div>
          ))}
          <button type="button" onClick={save} className="h-11 w-full rounded-card bg-mint font-semibold text-mint-ink">
            {t("saveTicked")}
          </button>
        </div>
      )}
    </section>
  )
}

function ShopPanel({ items }: { items: FoodItem[] }) {
  const shop = useFridge((s) => s.shop)
  const addShop = useFridge((s) => s.addShop)
  const toggleShop = useFridge((s) => s.toggleShop)
  const clearDoneShop = useFridge((s) => s.clearDoneShop)
  const addItem = useFridge((s) => s.addItem)
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const priority = useFridge((s) => (s.settings.priority ?? (s.settings.suggest === "free" ? 3 : 0)) as 0 | 1 | 2 | 3)
  const favorites = useFridge((s) => s.settings.favorites) ?? []
  const wanted = useFridge((s) => s.settings.wanted) ?? []
  const { locale, t } = useI18n()
  const [note, setNote] = useState("")
  const plan = useMemo(() => planMeals(items, vegetarian, priority, favorites), [items, vegetarian, priority, favorites])
  const picked = useMemo(() => ideasByIds(wanted, items), [wanted, items])
  const focus = picked.length ? picked : plan.ideas
  const shopRows = picked.length ? shopForIdeas(items, picked) : plan.shop
  const low = items.filter((item) => daysUntil(item.expires) <= 2)
  const join = (names: string[]) => names.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ")

  function addSuggested() {
    const have = new Set(shop.map((row) => row.text.toLowerCase()))
    for (const row of shopRows) {
      const label = foodLabel(locale, row.name)
      if (!have.has(label.toLowerCase())) addShop(label)
    }
  }

  return (
    <section className="space-y-5">
      <DishSearch />
      <div>
        <h2 className="font-display text-2xl">{picked.length ? t("wantedNow") : t("ideas")}</h2>
        {!focus.length && <p className="mt-2 text-sm text-muted">{t("shopWait")}</p>}
        {focus.length > 0 && (
          <ul className="mt-3 space-y-2">
            {focus.map((row) => {
              const copy = recipeText(locale, row.recipe)
              const gaps = shopRows.filter((item) => item.recipeIds.includes(row.recipe.id)).map((item) => item.name)
              return (
                <li key={row.recipe.id} className="rounded-card border border-line bg-surface px-4 py-3">
                  <p className="font-medium">{copy.name}</p>
                  <p className="text-sm text-muted">
                    {copy.cuisine} · {t("minutes", { n: row.recipe.time })}
                  </p>
                  {row.urgent.length > 0 && <p className="mt-1 text-sm text-clay">{t("usesSoon", { list: join(row.urgent) })}</p>}
                  <p className="mt-1 text-sm text-muted">{gaps.length ? t("stillNeed", { list: join(gaps) }) : t("haveAll")}</p>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {focus.length > 0 && (
        <div>
          <h2 className="font-display text-2xl">{t("suggestedList")}</h2>
          {shopRows.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t("nothingExtra")}</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {shopRows.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3"
                  >
                    <span>
                      <span className="block font-medium">{foodLabel(locale, row.name)}</span>
                      <span className="text-sm text-muted">
                        {t("forList", {
                          list: join(
                            row.recipeIds.map((id) => recipeText(locale, focus.find((idea) => idea.recipe.id === id)!.recipe).name),
                          ),
                        })}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => addItem(draftFromName(row.name))}
                      className="h-10 shrink-0 rounded-full bg-mint px-3 text-sm font-semibold text-mint-ink"
                    >
                      {t("bought")}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={addSuggested} className="mt-3 h-11 w-full rounded-card border border-line text-sm font-semibold">
                {t("addToNotes")}
              </button>
            </>
          )}
        </div>
      )}

      {low.length > 0 && (
        <div>
          <h2 className="font-display text-2xl">{t("useOrReplace")}</h2>
          <ul className="mt-3 space-y-2">
            {low.map((item) => (
              <li key={item.id} className="rounded-card border border-line px-4 py-3 text-sm">
                <span className="font-medium">{foodLabel(locale, item.name)}</span>
                <span className="text-muted"> · {whenText(locale, item.expires)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!note.trim()) return
          addShop(note)
          setNote("")
        }}
      >
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("shopNote")}
          className="h-11 min-w-0 flex-1 rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
        />
        <button type="submit" className="h-11 rounded-card bg-raised px-4 text-sm font-semibold">
          {t("add")}
        </button>
      </form>
      <ShopNotes notes={shop} onToggle={toggleShop} onClear={clearDoneShop} />
    </section>
  )
}

function ShopNotes({
  notes,
  onToggle,
  onClear,
}: {
  notes: ShopNote[]
  onToggle: (id: string) => void
  onClear: () => void
}) {
  const { t } = useI18n()
  if (!notes.length) return null
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-2xl">{t("notes")}</h2>
        <button type="button" onClick={onClear} className="text-sm text-muted">
          {t("clearDone")}
        </button>
      </div>
      <ul className="space-y-2">
        {notes.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              onClick={() => onToggle(note.id)}
              className="flex min-h-11 w-full items-center gap-3 rounded-card border border-line px-4 text-left"
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full border",
                  note.done ? "border-mint bg-mint text-mint-ink" : "border-line",
                )}
              >
                {note.done && <Check className="size-3" />}
              </span>
              <span className={cn(note.done && "text-muted line-through")}>{note.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ItemSheet({ item, onClose }: { item?: FoodItem; onClose: () => void }) {
  const addItem = useFridge((s) => s.addItem)
  const updateItem = useFridge((s) => s.updateItem)
  const removeItem = useFridge((s) => s.removeItem)
  const { locale, t } = useI18n()
  const [draft, setDraft] = useState<Draft>(() => {
    const base = item
      ? {
          name: item.name,
          qty: item.qty,
          location: item.location,
          bought: item.bought,
          expires: item.expires,
          opened: item.opened,
        }
      : draftFromName("")
    return { ...base, name: foodLabel(locale, base.name) }
  })

  function applyName(name: string) {
    const shelf = findShelf(name)
    setDraft((current) => ({
      ...current,
      name,
      location: shelf?.location ?? current.location,
      expires: name.trim() ? defaultExpiry(name, current.bought, current.opened) : current.expires,
    }))
  }

  function save() {
    if (!draft.name.trim()) return
    if (item) updateItem(item.id, draft)
    else addItem(draft)
    onClose()
  }

  return (
    <Sheet title={item ? t("editFood") : t("addFood")} onClose={onClose}>
      <label className="block text-sm text-muted">
        {t("name")}
        <input list="shelf-names" value={draft.name} onChange={(e) => applyName(e.target.value)} className={cn(fieldClass, "mt-1")} />
        <datalist id="shelf-names">
          {SHELF.map((food) => (
            <option key={food.name} value={foodLabel(locale, food.name)} />
          ))}
        </datalist>
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label={t("qty")}>
          <input value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: e.target.value })} className={fieldClass} />
        </Field>
        <Field label={t("where")}>
          <select
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value as Draft["location"] })}
            className={fieldClass}
          >
            <option value="fridge">{t("placeFridge")}</option>
            <option value="freezer">{t("placeFreezer")}</option>
            <option value="pantry">{t("placePantry")}</option>
          </select>
        </Field>
        <Field label={t("boughtDate")}>
          <input
            type="date"
            value={draft.bought}
            onChange={(e) =>
              setDraft({
                ...draft,
                bought: e.target.value,
                expires: defaultExpiry(draft.name, e.target.value, draft.opened),
              })
            }
            className={fieldClass}
          />
        </Field>
        <Field label={t("useBy")}>
          <input
            type="date"
            value={draft.expires}
            onChange={(e) => setDraft({ ...draft, expires: e.target.value })}
            className={fieldClass}
          />
        </Field>
      </div>
      <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={draft.opened}
          onChange={(e) =>
            setDraft({
              ...draft,
              opened: e.target.checked,
              expires: defaultExpiry(draft.name, draft.bought, e.target.checked),
            })
          }
          className="size-5 accent-mint"
        />
        {t("opened")}
      </label>
      <p className="mt-2 text-xs text-muted">{t("estimate")}</p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink">
          {t("save")}
        </button>
        {item && (
          <button
            type="button"
            onClick={() => {
              removeItem(item.id)
              onClose()
            }}
            className="grid size-11 place-items-center rounded-card border border-line text-clay"
            aria-label={t("remove")}
          >
            <Trash2 className="size-5" />
          </button>
        )}
      </div>
    </Sheet>
  )
}

function SettingsSheet({ onClose }: { onClose: () => void }) {
  const settings = useFridge((s) => s.settings)
  const setSettings = useFridge((s) => s.setSettings)
  const items = useFridge((s) => s.items)
  const shop = useFridge((s) => s.shop)
  const loadSample = useFridge((s) => s.loadSample)
  const clearItems = useFridge((s) => s.clearItems)
  const replaceAll = useFridge((s) => s.replaceAll)

  const { t } = useI18n()

  function exportJson() {
    const blob = new Blob([JSON.stringify({ items, shop, settings }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fridge-ai.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text) as { items?: FoodItem[] }
    if (!Array.isArray(data.items)) return
    replaceAll(data.items.filter((row) => row && typeof row.name === "string" && typeof row.expires === "string"))
  }

  return (
    <Sheet title={t("settings")} onClose={onClose}>
      <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
        {t("veg")}
        <input
          type="checkbox"
          checked={settings.vegetarian}
          onChange={(e) => setSettings({ vegetarian: e.target.checked })}
          className="size-5 accent-mint"
        />
      </label>
      <div className="mt-4">
        <SuggestControl />
      </div>
      <label className="mt-3 flex min-h-11 items-center justify-between gap-3 text-sm">
        {t("remind")}
        <input
          type="checkbox"
          checked={settings.notify}
          onChange={(e) => {
            const on = e.target.checked
            setSettings({ notify: on })
            if (on && typeof Notification !== "undefined" && Notification.permission === "default") {
              void Notification.requestPermission()
            }
          }}
          className="size-5 accent-mint"
        />
      </label>
      <label className="mt-3 block text-sm text-muted">
        {t("remindHour")}
        <select
          value={settings.remindHour}
          onChange={(e) => setSettings({ remindHour: Number(e.target.value) })}
          className={cn(fieldClass, "mt-1")}
        >
          {[7, 12, 17, 18, 19, 20, 21].map((hour) => (
            <option key={hour} value={hour}>
              {hour}:00
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-xs text-muted">{t("remindNote")}</p>
      <label className="mt-3 block text-sm text-muted">
        {t("doorAddr")}
        <input
          value={settings.puckHost ?? "http://fridgesnap.local"}
          onChange={(e) => setSettings({ puckHost: e.target.value })}
          spellCheck={false}
          autoCapitalize="off"
          className={cn(fieldClass, "mt-1")}
        />
      </label>
      <p className="mt-2 text-xs text-muted">{t("doorNote")}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => loadSample()} className="h-11 rounded-card border border-line text-sm font-semibold">
          {t("loadSample")}
        </button>
        <button type="button" onClick={exportJson} className="h-11 rounded-card border border-line text-sm font-semibold">
          {t("export")}
        </button>
        <label className="flex h-11 items-center justify-center rounded-card border border-line text-sm font-semibold">
          {t("import")}
          <input type="file" accept="application/json" className="sr-only" onChange={(e) => void onImport(e.target.files?.[0])} />
        </label>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t("clearConfirm"))) clearItems()
          }}
          className="h-11 rounded-card border border-line text-sm font-semibold text-clay"
        >
          {t("clearFridge")}
        </button>
      </div>
    </Sheet>
  )
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-bg/80 sm:items-center" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-card border border-line bg-surface p-5 sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center" aria-label={t("close")}>
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-muted">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  )
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-6">
      <p className="font-display text-2xl">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  )
}

function puckError(locale: Locale, err: unknown) {
  const code = err instanceof Error ? err.message : ""
  if (code === "puckBad" || code === "puckOffline" || code === "puckEmpty" || code === "puckBadPhoto" || code === "puckBlank") {
    return translate(locale, code)
  }
  return translate(locale, "puckOffline")
}

async function fetchDoorPhoto(host: string) {
  const url = doorPhotoUrl(host)
  if (!url) throw new Error("puckBad")
  let res: Response
  try {
    res = await fetch(url, {
      mode: "cors",
      cache: "no-store",
      targetAddressSpace: "local",
    } as RequestInit)
  } catch {
    throw new Error("puckOffline")
  }
  if (res.status === 404) throw new Error("puckEmpty")
  if (!res.ok) throw new Error("puckBadPhoto")
  const blob = await res.blob()
  if (!blob.size) throw new Error("puckBlank")
  return new File([blob], "door.jpg", { type: blob.type || "image/jpeg" })
}

function doorPhotoUrl(host: string) {
  const trimmed = host.trim()
  if (!trimmed) return ""
  let url: URL
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `http://${trimmed}`)
  } catch {
    return ""
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return ""
  url.pathname = "/latest.jpg"
  url.search = ""
  url.hash = ""
  return url.toString()
}

async function shrinkImage(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  let quality = 0.72
  let url = canvas.toDataURL("image/jpeg", quality)
  while (url.length > 1_200_000 && quality > 0.45) {
    quality -= 0.08
    url = canvas.toDataURL("image/jpeg", quality)
  }
  return url.length > 1_400_000 ? "" : url
}
