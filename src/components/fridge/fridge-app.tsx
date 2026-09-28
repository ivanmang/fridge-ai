import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
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
import { SurveyPanel, TasteProfile } from "@/components/fridge/survey-panel"
import { lookupDishes } from "@/lib/dish.functions"
import { scanFoods } from "@/lib/scan.functions"
import type { ScanHit } from "@/lib/scan.functions"
import { SHELF } from "@/lib/shelf"
import {
  addDays,
  daysUntil,
  defaultExpiry,
  findShelf,
  foodsForMeal,
  fitsTaste,
  ideasByIds,
  listRecipes,
  dishSource,
  planMeals,
  rankRecipes,
  searchRecipes,
  shopForIdeas,
  statusOf,
  todayISO,
  type FoodItem,
  type ItemStatus,
  type RankedRecipe,
} from "@/lib/logic"
import { draftFromName, useFridge, type ShopNote } from "@/lib/store"
import { emptySurvey, surveyReady } from "@/lib/survey"
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
type ScanRow = ScanHit & { on: boolean; expires: string; expirySource: "estimated" | "package" }

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
  const keys = ["priority0", "priority1", "priority2", "priority3"] as const
  const notes = ["priorityNote0", "priorityNote1", "priorityNote2", "priorityNote3"] as const
  return (
    <div>
      <p className="text-sm font-semibold">{t(keys[priority])}</p>
      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={priority}
        aria-label={t("priorityBar")}
        aria-valuetext={t(keys[priority])}
        onChange={(e) => setSettings({ priority: Number(e.target.value) as 0 | 1 | 2 | 3 })}
        className="priority-bar w-full"
      />
      <div className="flex justify-between text-xs text-muted">
        <span>{t("priority0")}</span>
        <span>{t("priority3")}</span>
      </div>
      <p className="mt-2 text-xs text-muted">{t(notes[priority])}</p>
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
  const taste = useFridge((s) => (surveyReady(s.settings.survey) ? s.settings.survey : null))
  const wanted = useFridge((s) => s.settings.wanted) ?? []
  const extras = useFridge((s) => s.extras) ?? []
  const setSettings = useFridge((s) => s.setSettings)
  const saveExtra = useFridge((s) => s.saveExtra)
  const [query, setQuery] = useState("")
  const [remote, setRemote] = useState<RankedRecipe["recipe"][]>([])
  const [looking, setLooking] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [ingredient, setIngredient] = useState("")
  const [needs, setNeeds] = useState<string[]>([])
  const [warn, setWarn] = useState("")
  const [stepText, setStepText] = useState("")
  const requestRef = useRef(0)
  const hits = useMemo(() => searchRecipes(query, items, vegetarian, taste), [query, items, vegetarian, taste])
  const picked = useMemo(() => ideasByIds(wanted, items, extras), [wanted, items, extras])

  async function lookUp() {
    const q = query.trim()
    if (q.length < 2 || looking) return
    const request = ++requestRef.current
    setLooking(true)
    setWarn("")
    try {
      const result = await lookupDishes({ data: { query: q, vegetarian, locale } })
      if (request !== requestRef.current) return
      if (result.ok) {
        setRemote(result.dishes)
        if (!result.dishes.length) setWarn(t("noMoreDishes"))
      } else setWarn(t("lookupUnavailable"))
    } catch {
      if (request === requestRef.current) setWarn(t("lookupUnavailable"))
    } finally {
      if (request === requestRef.current) setLooking(false)
    }
  }

  function toggle(id: string) {
    setSettings({ wanted: wanted.includes(id) ? wanted.filter((item) => item !== id) : [...wanted, id] })
  }

  function addNeed() {
    const next = ingredient.trim()
    if (!next) return
    if (!needs.some((item) => item.toLowerCase() === next.toLowerCase())) setNeeds((current) => [...current, next])
    setIngredient("")
    setWarn("")
  }

  function saveMine() {
    const dish = name.trim()
    if (!dish) {
      setWarn(t("needName"))
      return
    }
    if (!needs.length) {
      setWarn(t("needIngredient"))
      return
    }
    const steps = stepText.split("\n").map((line) => line.trim()).filter(Boolean)
    if (!steps.length) {
      setWarn(t("needStep"))
      return
    }
    const id = `mine-${crypto.randomUUID()}`
    saveExtra({
      id,
      name: dish,
      cuisine: "Home",
      time: 20,
      servings: 2,
      need: needs,
      optional: [],
      steps,
    })
    if (!wanted.includes(id)) setSettings({ wanted: [...wanted, id] })
    setAdding(false)
    setQuery("")
  }

  const mine = extras.filter((recipe) => recipe.id.startsWith("mine-"))

  const known = new Set(hits.map((row) => row.recipe.name.toLowerCase()))
  const others = remote.filter(
    (recipe) => !known.has(recipe.name.toLowerCase()) && !hits.some((row) => row.recipe.id === recipe.id) && fitsTaste(recipe, taste),
  )

  function ResultButton({ recipe, missing }: { recipe: RankedRecipe["recipe"]; missing: string[] }) {
    const copy = recipeText(locale, recipe)
    const on = wanted.includes(recipe.id)
    return (
      <button
        type="button"
        onClick={() => {
          if (!hits.some((row) => row.recipe.id === recipe.id)) saveExtra(recipe)
          toggle(recipe.id)
        }}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-3 rounded-card border px-4 text-left",
          on ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface",
        )}
      >
        <span>
          <span className="block font-medium">{copy.name}</span>
          <span className={cn("text-sm", on ? "text-mint-ink" : "text-muted")}>
            {copy.cuisine}
            {missing.length ? ` · ${t("missing", { list: missing.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ") })}` : ""}
          </span>
        </span>
      </button>
    )
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setRemote([]); setWarn(""); requestRef.current++ }}
        placeholder={t("searchDish")}
        aria-label={t("searchDish")}
        className="h-11 w-full rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
      />
      {query.trim().length >= 2 && (
        <button type="button" disabled={looking} onClick={() => void lookUp()} className="mt-2 h-11 w-full rounded-card border border-line text-sm font-semibold disabled:opacity-60">{looking ? t("looking") : t("searchMoreDishes")}</button>
      )}
      {warn && !adding && <p role="status" className="mt-2 text-sm text-clay">{warn}</p>}
      {query.trim() && (
        <div className="mt-2 space-y-2">
          {!hits.length && !others.length && !looking && <p className="text-sm text-muted">{t("noDish")}</p>}
          {hits.map((row) => (
            <ResultButton key={row.recipe.id} recipe={row.recipe} missing={row.missing} />
          ))}
          {(others.length > 0 || looking) && hits.length > 0 && <p className="pt-1 text-sm text-muted">{t("otherDishes")}</p>}
          {looking && <p className="text-sm text-muted">{t("looking")}</p>}
          {others.map((recipe) => (
            <ResultButton key={recipe.id} recipe={recipe} missing={ideasByIds([recipe.id], items, [recipe])[0]?.missing ?? recipe.need} />
          ))}
        </div>
      )}
      {!adding && (
        <button
          type="button"
          onClick={() => {
            setName(query.trim())
            setNeeds([])
            setIngredient("")
            setStepText("")
            setWarn("")
            setAdding(true)
          }}
          className="mt-2 h-11 w-full rounded-card border border-line text-sm font-semibold"
        >
          {t("addMyDish")}
        </button>
      )}
      {adding && (
        <form
          className="mt-2 space-y-2 rounded-card border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMine()
          }}
        >
          <label className="block text-sm">
            {t("dishName")}
            <input value={name} onChange={(e) => setName(e.target.value)} className={cn(fieldClass, "mt-1")} />
          </label>
          <div className="flex gap-2">
            <input
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addNeed()
                }
              }}
              placeholder={t("ingredient")}
              aria-label={t("ingredient")}
              className={fieldClass}
            />
            <button type="button" onClick={addNeed} className="h-11 shrink-0 rounded-card border border-line px-3 text-sm font-semibold">
              {t("addIngredient")}
            </button>
          </div>
          {needs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {needs.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setNeeds((current) => current.filter((need) => need !== item))}
                  className="h-11 rounded-full border border-line px-3 text-sm"
                >
                  {foodLabel(locale, item)}
                </button>
              ))}
            </div>
          )}
          <label className="block text-sm">
            {t("cookingSteps")}
            <textarea value={stepText} onChange={(e) => setStepText(e.target.value)} rows={4} placeholder={t("stepsHint")} className="mt-1 w-full rounded-card border border-line bg-raised p-3 text-fg outline-none" />
          </label>
          {warn && <p role="alert" className="text-sm text-clay">{warn}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)} className="h-11 rounded-card border border-line px-4 text-sm font-semibold">
              {t("cancel")}
            </button>
            <button type="submit" className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink">
              {t("saveDish")}
            </button>
          </div>
        </form>
      )}
      {mine.length > 0 && (
        <div className="mt-3">
          <p className="text-sm">{t("myDishes")}</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {mine.map((recipe) => {
              const on = wanted.includes(recipe.id)
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => toggle(recipe.id)}
                  className={cn(
                    "h-11 shrink-0 rounded-full border px-3 text-sm",
                    on ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
                  )}
                >
                  {recipe.name}
                </button>
              )
            })}
          </div>
        </div>
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
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [editing, setEditing] = useState<FoodItem | null>(null)
  const [adding, setAdding] = useState(false)

  useLayoutEffect(() => {
    void Promise.resolve(useFridge.persist.rehydrate()).finally(() => setHydrated(true))
  }, [])

  const items = useFridge((s) => s.items)
  const settings = useFridge((s) => s.settings)
  const setSettings = useFridge((s) => s.setSettings)
  const { locale, t } = useI18n()

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-Hant" : "en"
  }, [locale])

  useEffect(() => {
    if (hydrated && !items.length && !settings.onboarded) setOnboardingOpen(true)
  }, [hydrated, items.length, settings.onboarded])

  useEffect(() => {
    if (!settings.notify) return
    const tick = () => {
      const state = useFridge.getState()
      if (!state.settings.notify) return
      const now = new Date()
      if (now.getHours() < state.settings.remindHour) return
      const day = todayISO(now)
      if (state.settings.lastPing === day) return
      const urgent = state.items.filter((item) => daysUntil(item.expires) === 0)
      if (!urgent.length) return
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const names = urgent.slice(0, 3).map((item) => foodLabel(state.settings.locale || "en", item.name))
        const extra = urgent.length - names.length
        const lang = (state.settings.locale || "en") as Locale
        const body = extra > 0 ? translate(lang, "notifyMore", { names: names.join("、"), n: extra }) : names.join(lang === "zh" ? "、" : ", ")
        new Notification(translate(lang, "notifyTitle"), { body })
        state.setSettings({ lastPing: day })
      }
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [settings.notify, settings.remindHour, locale])

  const urgentCount = items.filter((item) => daysUntil(item.expires) === 0).length

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
          <button type="button" onClick={() => setAdding(true)} className="grid size-11 place-items-center rounded-full border border-line bg-surface" aria-label={t("quickAdd")} title={t("quickAdd")}><Plus className="size-5" /></button>
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
        {tab === "tonight" && <Tonight items={items} onAdd={() => setAdding(true)} onPhoto={() => setTab("scan")} onSample={() => useFridge.getState().loadSample()} />}
        {tab === "fridge" && <FridgeList items={items} onAdd={() => setAdding(true)} onOpen={setEditing} />}
        {tab === "scan" && <ScanPanel onManual={() => setAdding(true)} />}
        {tab === "shop" && <ShopPanel items={items} />}
      </div>

      <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((item) => {
            const Icon = item.icon
            const on = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={on ? "page" : undefined}
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
      {onboardingOpen && (
        <WelcomeSheet
          onClose={() => {
            setSettings({ onboarded: true })
            setOnboardingOpen(false)
          }}
          onManual={() => {
            setSettings({ onboarded: true })
            setOnboardingOpen(false)
            setAdding(true)
          }}
          onPhoto={() => {
            setSettings({ onboarded: true })
            setOnboardingOpen(false)
            setTab("scan")
          }}
          onSample={() => {
            setSettings({ onboarded: true })
            useFridge.getState().loadSample()
            setOnboardingOpen(false)
          }}
        />
      )}
      {adding && <ItemSheet onClose={() => setAdding(false)} />}
      {editing && <ItemSheet item={editing} onClose={() => setEditing(null)} />}
    </main>
  )
}

function DishCatalog({ onCook }: { onCook: (id: string) => void }) {
  const { locale, t } = useI18n()
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const taste = useFridge((s) => (surveyReady(s.settings.survey) ? s.settings.survey : null))
  const [source, setSource] = useState<"all" | "home" | "lkk" | "knorr" | "guardian">("all")
  const [query, setQuery] = useState("")
  const [shown, setShown] = useState(12)
  const [showAll, setShowAll] = useState(false)
  const dishes = useMemo(() => listRecipes(vegetarian, taste), [vegetarian, taste])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return dishes.filter((recipe) => {
      if (source !== "all" && dishSource(recipe.id) !== source) return false
      if (!q && source === "all" && !showAll) return recipe.id.startsWith("home-")
      if (!q) return true
      const copy = recipeText(locale, recipe)
      return copy.name.toLowerCase().includes(q) || recipe.name.toLowerCase().includes(q)
    })
  }, [dishes, source, query, locale, showAll])
  const page = filtered.slice(0, shown)

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">{t("allDishes")}</h2>
        <p className="text-sm text-muted">{t("dishCount", { n: filtered.length })}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["all", "sourceAll"],
            ["home", "sourceHome"],
            ["lkk", "sourceLkk"],
            ["knorr", "sourceKnorr"],
            ["guardian", "sourceGuardian"],
          ] as const
        ).map(([id, key]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSource(id)
              setShown(12)
              setShowAll(id !== "all")
            }}
            className={cn(
              "h-11 shrink-0 rounded-full border px-3 text-sm",
              source === id ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
            )}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setShown(12)
        }}
        placeholder={t("searchDish")}
        className="h-11 w-full rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
      />
      <ul className="space-y-2">
        {page.map((recipe) => {
          const copy = recipeText(locale, recipe)
          const from = dishSource(recipe.id)
          const sourceLabel = from === "home" ? t("sourceHome") : from === "knorr" ? t("sourceKnorr") : from === "guardian" ? t("sourceGuardian") : t("sourceLkk")
          return (
            <li key={recipe.id} className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{copy.name}</p>
                <p className="text-sm text-muted">
                  {sourceLabel} · {copy.cuisine} · {t("minutes", { n: recipe.time })}
                </p>
              </div>
              <button type="button" onClick={() => onCook(recipe.id)} className="h-11 shrink-0 rounded-card border border-line px-3 text-sm font-semibold">
                {t("cookThis")}
              </button>
            </li>
          )
        })}
      </ul>
      {!query && source === "all" && !showAll && (
        <button type="button" onClick={() => setShowAll(true)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">{t("browseDishes")}</button>
      )}
      {shown < filtered.length && (
        <button type="button" onClick={() => setShown((n) => n + 24)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">
          {t("showMoreDishes")}
        </button>
      )}
    </section>
  )
}

function Tonight({ items, onAdd, onPhoto, onSample }: { items: FoodItem[]; onAdd: () => void; onPhoto: () => void; onSample: () => void }) {
  const { locale, t } = useI18n()
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const taste = useFridge((s) => (surveyReady(s.settings.survey) ? s.settings.survey : null))
  const setSettings = useFridge((s) => s.setSettings)
  const priority = useFridge((s) => (s.settings.priority ?? (s.settings.suggest === "free" ? 3 : 0)) as 0 | 1 | 2 | 3)
  const favorites = useFridge((s) => s.settings.favorites) ?? []
  const wanted = useFridge((s) => s.settings.wanted) ?? []
  const extras = useFridge((s) => s.extras) ?? []
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
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerFinished, setTimerFinished] = useState(false)

  useEffect(() => {
    if (phase !== "cook") return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    if ("wakeLock" in navigator) {
      void navigator.wakeLock.request("screen").then((sentinel) => {
        if (cancelled) void sentinel.release()
        else lock = sentinel
      }).catch(() => undefined)
    }
    return () => { cancelled = true; if (lock) void lock.release() }
  }, [phase])

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return
    const id = window.setInterval(() => setTimerSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearInterval(id)
  }, [timerRunning, timerSeconds])

  useEffect(() => {
    if (timerRunning && timerSeconds === 0) { setTimerRunning(false); setTimerFinished(true) }
  }, [timerRunning, timerSeconds])

  const all = useMemo(() => rankRecipes(items, vegetarian, priority, favorites, taste), [items, vegetarian, priority, favorites, taste])
  const plan = useMemo(() => planMeals(items, vegetarian, priority, favorites, taste), [items, vegetarian, priority, favorites, taste])
  const picked = useMemo(() => ideasByIds(wanted, items, extras), [wanted, items, extras])
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
    (mealId ? ideasByIds([mealId], items, extras)[0] : undefined) ??
    picked[0] ??
    (priority >= 2 ? plan.ideas[0] : undefined) ??
    ranked[0]
  const rest = ranked.filter((row) => row.recipe.id !== active?.recipe.id).slice(0, 3)
  const join = (names: string[]) => names.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ")
  const dish = active ? recipeText(locale, active.recipe) : null
  const isOutline = Boolean(active && !active.recipe.id.startsWith("home-") && active.recipe.steps.some((step) => /cook them until just done|prep the ingredients|season, toss briefly/i.test(step)))
  const used = active ? foodsForMeal(active.recipe, items) : []

  function addSuggested() {
    const have = new Set(shop.map((row) => row.text.toLowerCase()))
    for (const row of shopRows) {
      const label = foodLabel(locale, row.name)
      if (!have.has(label.toLowerCase())) { addShop(label); have.add(label.toLowerCase()) }
    }
    setNote(t("onList"))
  }

  function startCook(id: string) {
    setMealId(id)
    setStepIndex(0)
    setTimerRunning(false)
    setTimerSeconds(0)
    setTimerFinished(false)
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
        expirySource: "estimated",
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
      if (!have.has(label.toLowerCase())) { addShop(label); have.add(label.toLowerCase()) }
    }
    setNote(t("onList"))
  }

  return (
    <section className="space-y-4">
      {phase === "pick" && items.length > 0 && active && (
        <p className="text-sm text-muted">{t("tonightLead")}</p>
      )}
      {active && dish && phase !== "pick" && (
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

      {!items.length && !active && phase === "pick" && (
        <div className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-2xl">{t("emptyTitle")}</h2>
          <p className="mt-2 text-sm text-muted">{t("emptyBody")}</p>
          <div className="mt-4 grid gap-2">
            <button type="button" onClick={onAdd} className="h-11 rounded-card bg-mint font-semibold text-mint-ink">{t("addFood")}</button>
            <button type="button" onClick={onPhoto} className="h-11 rounded-card border border-line font-semibold">{t("welcomePhoto")}</button>
            <button type="button" onClick={onSample} className="h-11 rounded-card border border-line font-semibold">{t("welcomeSample")}</button>
          </div>
        </div>
      )}
      {phase === "pick" && taste && items.length > 0 && !active && <p className="text-sm text-muted">{t("surveyEmpty")}</p>}
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
          {isOutline && <p className="mt-3 text-xs text-muted">{t("recipeGuideOnly")}</p>}
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("youHave")}</p>
              <p className="mt-1 text-mint">{active.matched.length ? join(active.matched) : "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("stillNeedLabel")}</p>
              <p className="mt-1 text-muted">{active.missing.length ? join(active.missing) : t("haveAll")}</p>
            </div>
          </div>
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
        <article className="flex min-h-[58dvh] flex-col rounded-card border border-line bg-surface p-5">
          <button type="button" onClick={() => setPhase("pick")} className="mb-4 h-11 self-start text-sm text-muted underline">{t("exitCook")}</button>
          <p className="text-xs font-medium tracking-wide text-mint uppercase">{dish.name}</p>
          {isOutline && <p className="mt-2 text-sm text-clay">{t("recipeGuideOnly")}</p>}
          <p className="mt-1 text-sm text-muted">{t("stepOf", { n: stepIndex + 1, m: dish.steps.length })}</p>
          <ol className="mt-4 flex-1 space-y-4 text-lg leading-relaxed">
            {dish.steps.map((step, i) => (
              <li key={step} className={cn("flex gap-3", i !== stepIndex && "text-muted")}>
                <span className={cn("tabular-nums", i === stepIndex && "text-mint")}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-card border border-line p-3">
            <p className="text-sm font-semibold">{t("timer")}{timerSeconds > 0 ? ` · ${Math.floor(timerSeconds / 60)}:${String(timerSeconds % 60).padStart(2, "0")}` : ""}</p>
            {timerFinished && <p role="status" className="mt-1 text-sm text-mint">{t("timerDone")}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 10, 15].map((minutes) => <button key={minutes} type="button" onClick={() => { setTimerFinished(false); setTimerSeconds(minutes * 60); setTimerRunning(true) }} className="h-10 rounded-full border border-line px-3 text-sm">{t("minutes", { n: minutes })}</button>)}
              {timerSeconds > 0 && <button type="button" onClick={() => setTimerRunning((running) => !running)} className="h-10 rounded-full border border-line px-3 text-sm">{timerRunning ? t("pause") : t("resume")}</button>}
            </div>
          </div>
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
            <button type="button" onClick={openPlate} className="mt-3 h-11 w-full text-sm text-muted">
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
              {t("addToShoppingList")}
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
      {phase === "pick" && items.length > 0 && (
        <div className="grid gap-2">
          <button type="button" onClick={() => setBrowseOpen(true)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">{t("browseDishes")}</button>
          <button type="button" onClick={() => setPrefsOpen((open) => !open)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">{t("chooseHow")}</button>
        </div>
      )}
      {phase === "pick" && prefsOpen && (
        <section className="rounded-card border border-line bg-surface px-4 py-3">
          <p className="text-sm text-muted">{t("chooseHowBody")}</p>
          <SuggestControl />
          {priority < 2 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {CUISINES.map((name) => (
                <button key={name} type="button" onClick={() => setCuisine(name)} className={cn("shrink-0 rounded-full border px-3 py-2 text-sm", cuisine === name ? "border-mint bg-mint text-mint-ink" : "border-line bg-raised text-fg")}>{cuisineLabel(locale, name)}</button>
              ))}
            </div>
          )}
        </section>
      )}
      {phase === "pick" && items.length > 0 && !taste && !surveyOpen && <TastePrompt onOpen={() => setSurveyOpen(true)} />}
      {phase === "pick" && surveyOpen && <SurveyPanel onDone={() => setSurveyOpen(false)} />}
      {phase === "pick" && taste && <TasteProfile onEdit={() => {
        setSettings({ survey: { ...(useFridge.getState().settings.survey ?? emptySurvey), done: false } })
        setSurveyOpen(true)
      }} />}
      {browseOpen && <Sheet title={t("browseDishes")} onClose={() => setBrowseOpen(false)}>
        <DishCatalog onCook={(id) => { setBrowseOpen(false); startCook(id) }} />
      </Sheet>}
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
      <p className="mt-4 text-xs text-muted">{t("sourceWarning")}</p>
      <ul className="mt-4 space-y-2">
        {shown.map((item, index) => {
          const status = statusOf(item.expires)
          const urgent = daysUntil(item.expires) <= 3
          const previousUrgent = index > 0 && daysUntil(shown[index - 1].expires) <= 3
          return (
            <li key={item.id}>
              {(index === 0 || previousUrgent !== urgent) && <h2 className="pb-2 font-display text-xl">{urgent ? t("useOrReplace") : t("fresh")}</h2>}
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
                    {item.qty} · {placeLabel(locale, item.location)} · {item.expirySource === "package" ? t("packageDate") : t("estimatedDate")}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-right text-sm tabular-nums",
                    status === "expired" || status === "today" ? "text-clay" : "text-muted",
                  )}
                >
                  <span className="block">{status === "expired" && item.expirySource !== "package" ? t("pastEstimate") : statusText(locale, status)}</span>
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

function ScanPanel({ onManual }: { onManual: () => void }) {
  const addMany = useFridge((s) => s.addMany)
  const puckHost = useFridge((s) => s.settings.puckHost || "http://fridgesnap.local")
  const { locale, t } = useI18n()
  const [preview, setPreview] = useState("")
  const [rows, setRows] = useState<ScanRow[]>([])
  const [busy, setBusy] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [puckReady, setPuckReady] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const setSettings = useFridge((s) => s.setSettings)

  async function onFile(file: File | undefined) {
    if (!file) return
    setError("")
    setSaved("")
    setRows([])
    try {
      const image = await shrinkImage(file)
      if (!image) { setError(t("tooLarge")); return }
      setPreview(image)
    } catch {
      setError(t("scanFailed"))
    }
  }

  async function pullDoor() {
    setPulling(true)
    setError("")
    setSaved("")
    setRows([])
    try {
      const file = await fetchDoorPhoto(puckHost)
      await onFile(file)
      setPuckReady(true)
    } catch (err) {
      setPuckReady(false)
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
      setRows(
        result.foods.map((food) => ({
          ...food,
          name: foodLabel(locale, food.name),
          on: true,
          expires: defaultExpiry(food.name),
          expirySource: "estimated" as const,
        })),
      )
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
    addMany(chosen.map((row) => ({ ...draftFromName(row.name, row.qty), expires: row.expires, expirySource: row.expirySource })))
    setRows([])
    setPreview("")
    setSaved(t("added", { n: chosen.length }))
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted">
        {t("scanIntro")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface px-4 py-6 text-center">
          <Camera className="size-6 text-mint" />
          <span className="mt-2 text-sm font-medium">{t("phonePhoto")}</span>
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
          className="min-h-32 rounded-card border border-line bg-surface px-4 text-center font-semibold disabled:opacity-60"
        >
          <span className="block">{pulling ? t("askingPuck") : t("fridgeSnap")}</span>
          <span className="mt-1 block text-xs font-normal text-muted">{puckReady ? t("lastDoor") : t("fridgeSnapOffline")}</span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onManual} className="min-h-11 rounded-card border border-line p-2 text-sm font-semibold">{t("addManually")}</button>
        <button type="button" onClick={() => setSetupOpen(true)} className="min-h-11 rounded-card border border-line p-2 text-sm font-semibold">{t("fridgeSnapSetup")}</button>
      </div>
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
      {error && <p role="alert" className="text-sm text-clay">{error}</p>}
      {saved && <p role="status" className="text-sm text-mint">{saved}</p>}
      {setupOpen && (
        <Sheet title={t("fridgeSnap")} onClose={() => setSetupOpen(false)}>
          <p className="text-sm text-muted">{t("doorNote")}</p>
          <label className="mt-4 block text-sm text-muted">
            {t("doorAddr")}
            <input value={puckHost} onChange={(e) => { setSettings({ puckHost: e.target.value }); setPuckReady(false) }} className={cn(fieldClass, "mt-1")} spellCheck={false} />
          </label>
          <button type="button" disabled={pulling} onClick={() => void pullDoor()} className="mt-4 h-11 w-full rounded-card bg-mint font-semibold text-mint-ink disabled:opacity-60">{pulling ? t("askingPuck") : t("testConnection")}</button>
          {error && <p role="alert" className="mt-3 text-sm text-clay">{error}</p>}
          {puckReady && <p role="status" className="mt-3 text-sm text-mint">{t("connected")}</p>}
        </Sheet>
      )}
      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-card border border-mint/40 bg-mint/10 px-4 py-3">
            <p className="font-semibold">{t("reviewCount", { n: rows.length })}</p>
            <p className="mt-1 text-sm text-muted">{t("nothingSaved")}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setRows((current) => current.map((row) => ({ ...row, on: true })))} className="h-10 rounded-full border border-line px-3 text-sm">{t("confirmAll")}</button>
            <button type="button" onClick={() => setRows((current) => current.map((row) => ({ ...row, on: false })))} className="h-10 rounded-full border border-line px-3 text-sm">{t("uncheckAll")}</button>
          </div>
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
                        i === index ? { ...item, name: e.target.value, expires: item.expirySource === "package" ? item.expires : defaultExpiry(e.target.value) } : item,
                      ),
                    )
                  }
                  aria-label={t("name")}
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
                <label className="block text-sm text-muted">
                  {t("dateSource")}
                  <select
                    value={row.expirySource}
                    onChange={(e) => setRows((current) => current.map((item, i) => (i === index ? { ...item, expirySource: e.target.value as ScanRow["expirySource"] } : item)))}
                    className={fieldClass}
                  >
                    <option value="estimated">{t("dateSourceEstimated")}</option>
                    <option value="package">{t("dateSourcePackage")}</option>
                  </select>
                </label>
                <label className="block text-sm text-muted">
                  {t("expires")}
                  <input
                    type="date"
                    value={row.expires}
                    onChange={(e) => setRows((current) => current.map((item, i) => (i === index ? { ...item, expires: e.target.value } : item)))}
                    className={fieldClass}
                  />
                </label>
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
  const taste = useFridge((s) => (surveyReady(s.settings.survey) ? s.settings.survey : null))
  const priority = useFridge((s) => (s.settings.priority ?? (s.settings.suggest === "free" ? 3 : 0)) as 0 | 1 | 2 | 3)
  const favorites = useFridge((s) => s.settings.favorites) ?? []
  const wanted = useFridge((s) => s.settings.wanted) ?? []
  const extras = useFridge((s) => s.extras) ?? []
  const { locale, t } = useI18n()
  const [note, setNote] = useState("")
  const [boughtCandidate, setBoughtCandidate] = useState<ShopNote | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const plan = useMemo(() => planMeals(items, vegetarian, priority, favorites, taste), [items, vegetarian, priority, favorites, taste])
  const picked = useMemo(() => ideasByIds(wanted, items, extras), [wanted, items, extras])
  const focus = picked.length ? picked : plan.ideas
  const shopRows = picked.length ? shopForIdeas(items, picked) : plan.shop
  const low = items.filter((item) => daysUntil(item.expires) >= 0 && daysUntil(item.expires) <= 2)
  const join = (names: string[]) => names.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ")

  function addSuggested() {
    const have = new Set(shop.map((row) => row.text.toLowerCase()))
    for (const row of shopRows) {
      const label = foodLabel(locale, row.name)
      if (!have.has(label.toLowerCase())) { addShop(label); have.add(label.toLowerCase()) }
    }
  }

  return (
    <section className="space-y-5">
      <h2 className="font-display text-3xl">{t("shoppingList")}</h2>
      {focus.length > 0 && (
        <div>
          <h2 className="font-display text-2xl">{t("forTonight")}</h2>
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
                      onClick={() => {
                        const label = foodLabel(locale, row.name)
                        if (!shop.some((note) => !note.done && note.text.toLowerCase() === label.toLowerCase())) addShop(label)
                      }}
                      className="h-10 shrink-0 rounded-full bg-mint px-3 text-sm font-semibold text-mint-ink"
                    >
                      {t("addToShoppingList")}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={addSuggested} className="mt-3 h-11 w-full rounded-card border border-line text-sm font-semibold">
                {t("addToShoppingList")}
              </button>
            </>
          )}
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
      <ShopNotes notes={shop} onToggle={(id) => {
        const found = shop.find((row) => row.id === id)
        toggleShop(id)
        if (found && !found.done) setBoughtCandidate(found)
      }} onClear={clearDoneShop} />
      <button type="button" onClick={() => setSearchOpen((open) => !open)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">{t("searchDish")}</button>
      {searchOpen && <DishSearch />}
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
      {focus.length > 0 && (
        <details className="rounded-card border border-line bg-surface p-4">
          <summary className="cursor-pointer font-display text-xl">{picked.length ? t("wantedNow") : t("ideas")}</summary>
          <ul className="mt-3 space-y-2">
            {focus.map((row) => {
              const copy = recipeText(locale, row.recipe)
              return <li key={row.recipe.id} className="border-t border-line py-2 text-sm">
                <p className="font-medium">{copy.name} · {t("minutes", { n: row.recipe.time })}</p>
                <p className="text-muted">{row.missing.length ? t("stillNeed", { list: join(row.missing) }) : t("haveAll")}</p>
              </li>
            })}
          </ul>
        </details>
      )}
      {boughtCandidate && (
        <Sheet title={t("addToFridge")} onClose={() => setBoughtCandidate(null)}>
          <p className="text-sm text-muted">{boughtCandidate.text}</p>
          <p className="mt-2 text-xs text-muted">{t("estimateHint")}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setBoughtCandidate(null)} className="h-11 flex-1 rounded-card border border-line text-sm font-semibold">{t("keepOnList")}</button>
            <button type="button" onClick={() => { addItem(draftFromName(boughtCandidate.text)); setBoughtCandidate(null) }} className="h-11 flex-1 rounded-card bg-mint text-sm font-semibold text-mint-ink">{t("addToFridge")}</button>
          </div>
        </Sheet>
      )}
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
        <h2 className="font-display text-2xl">{t("shoppingList")}</h2>
        <button type="button" onClick={onClear} className="text-sm text-muted">
          {t("clearCompleted")}
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
  const existing = useFridge((s) => s.items)
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
          expirySource: item.expirySource ?? "estimated",
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
      expires: current.expirySource === "package" || !name.trim() ? current.expires : defaultExpiry(name, current.bought, current.opened),
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
      {!item && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label={t("quickAdd")}>
          {[...new Set([...existing.slice(0, 3).map((row) => row.name), "Eggs", "Milk", "Tomato", "Chicken breast"])].slice(0, 6).map((name) => (
            <button key={name} type="button" onClick={() => applyName(foodLabel(locale, name))} className="h-10 shrink-0 rounded-full border border-line bg-raised px-3 text-sm">{foodLabel(locale, name)}</button>
          ))}
        </div>
      )}
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
                expires: draft.expirySource === "package" ? draft.expires : defaultExpiry(draft.name, e.target.value, draft.opened),
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
      <Field label={t("dateSource")}>
        <select
          value={draft.expirySource ?? "estimated"}
          onChange={(e) => setDraft({ ...draft, expirySource: e.target.value as Draft["expirySource"], expires: e.target.value === "estimated" ? defaultExpiry(draft.name, draft.bought, draft.opened) : draft.expires })}
          className={fieldClass}
        >
          <option value="estimated">{t("dateSourceEstimated")}</option>
          <option value="package">{t("dateSourcePackage")}</option>
        </select>
      </Field>
      <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={draft.opened}
          onChange={(e) =>
            setDraft({
              ...draft,
              opened: e.target.checked,
              expires: draft.expirySource === "package" ? draft.expires : defaultExpiry(draft.name, draft.bought, e.target.checked),
            })
          }
          className="size-5 accent-mint"
        />
        {t("opened")}
      </label>
      <p className="mt-2 text-xs text-muted">{draft.expirySource === "package" ? t("packageDateHint") : t("estimateHint")}</p>
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
  const extras = useFridge((s) => s.extras)
  const [backupMessage, setBackupMessage] = useState("")

  const { t } = useI18n()

  function exportJson() {
    const blob = new Blob([JSON.stringify({ items, shop, extras, settings }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fridge-ai.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    try {
      const data = JSON.parse(await file.text()) as {
        items?: FoodItem[]
        shop?: ShopNote[]
        extras?: RankedRecipe["recipe"][]
        settings?: Partial<typeof settings>
      }
      if (!Array.isArray(data.items) || !data.items.every((row) => row && typeof row.id === "string" && typeof row.name === "string" && typeof row.expires === "string")) throw new Error("Invalid backup")
      if (data.shop && (!Array.isArray(data.shop) || !data.shop.every((row) => row && typeof row.text === "string" && typeof row.id === "string"))) throw new Error("Invalid shopping list")
      if (data.extras && (!Array.isArray(data.extras) || !data.extras.every((row) => row && typeof row.name === "string" && Array.isArray(row.need)))) throw new Error("Invalid dishes")
      useFridge.setState((state) => ({
        items: data.items,
        shop: data.shop ?? state.shop,
        extras: data.extras ?? state.extras,
        settings: data.settings && typeof data.settings === "object" && !Array.isArray(data.settings) ? { ...state.settings, ...data.settings, onboarded: true } : { ...state.settings, onboarded: true },
      }))
      setBackupMessage(t("backupImported"))
    } catch {
      setBackupMessage(t("backupFailed"))
    }
  }

  return (
    <Sheet title={t("settings")} onClose={onClose}>
      <p className="mb-3 text-xs text-muted">{t("chooseHowBody")}</p>
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
      <div className="mt-4">
        <TasteProfile
          onEdit={() => {
            setSettings({ survey: { ...(settings.survey ?? emptySurvey), done: false } })
            onClose()
          }}
        />
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
      <details className="mt-4 rounded-card border border-line p-3">
        <summary className="cursor-pointer text-sm font-semibold">{t("fridgeSnap")}</summary>
        <label className="mt-3 block text-sm text-muted">
          {t("doorAddr")}
          <input value={settings.puckHost ?? "http://fridgesnap.local"} onChange={(e) => setSettings({ puckHost: e.target.value })} spellCheck={false} autoCapitalize="off" className={cn(fieldClass, "mt-1")} />
        </label>
        <p className="mt-2 text-xs text-muted">{t("doorNote")}</p>
      </details>
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
      {backupMessage && <p role="status" className="mt-3 text-sm text-mint">{backupMessage}</p>}
    </Sheet>
  )
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n()
  const dialog = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialog.current?.querySelector<HTMLElement>("button, input, select, [tabindex]")?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current()
      if (event.key !== "Tab" || !dialog.current) return
      const focusable = [...dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = oldOverflow
      previous?.focus()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-bg/80 sm:items-center" role="presentation" onClick={onClose}>
      <div
        ref={dialog}
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

function TastePrompt({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n()
  return (
    <section className="rounded-card border border-line bg-surface px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{t("improveSuggestions")}</h2>
          <p className="mt-1 text-sm text-muted">{t("improveSuggestionsBody")}</p>
        </div>
        <button type="button" onClick={onOpen} className="h-11 shrink-0 rounded-card border border-line px-3 text-sm font-semibold">
          {t("improveSuggestions")}
        </button>
      </div>
    </section>
  )
}

function WelcomeSheet({
  onClose,
  onManual,
  onPhoto,
  onSample,
}: {
  onClose: () => void
  onManual: () => void
  onPhoto: () => void
  onSample: () => void
}) {
  const { t } = useI18n()
  return (
    <Sheet title={t("welcomeTitle")} onClose={onClose}>
      <p className="text-sm text-muted">{t("welcomeBody")}</p>
      <div className="mt-5 grid gap-2">
        <button type="button" onClick={onManual} className="h-12 rounded-card bg-mint font-semibold text-mint-ink">
          {t("welcomeManual")}
        </button>
        <button type="button" onClick={onPhoto} className="h-12 rounded-card border border-line font-semibold">
          {t("welcomePhoto")}
        </button>
        <button type="button" onClick={onSample} className="h-12 rounded-card border border-line font-semibold">
          {t("welcomeSample")}
        </button>
        <button type="button" onClick={onClose} className="h-11 text-sm text-muted">
          {t("welcomeLater")}
        </button>
      </div>
    </Sheet>
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
