import { useEffect, useMemo, useState } from "react"
import { DishCatalog } from "@/components/fridge/dish-catalog"
import { DishSearch } from "@/components/fridge/shop-panel"
import { RecipeSourceMedia } from "@/components/fridge/recipe-source-media"
import { CUISINES, Empty, Sheet, SuggestControl, TastePrompt, useI18n } from "@/components/fridge/shared"
import { SurveyPanel, TasteProfile } from "@/components/fridge/survey-panel"
import { cuisineLabel, foodLabel, recipeText } from "@/lib/i18n"
import {
  addDays,
  applyRecipeFilters,
  foodsForMeal,
  ideasByIds,
  isOutlineRecipe,
  planMeals,
  rankRecipes,
  shopForIdeas,
  todayISO,
  trustLevel,
  type FoodItem,
} from "@/lib/logic"
import { useFridge } from "@/lib/store"
import { emptySurvey, surveyReady } from "@/lib/survey"
import { cn } from "@/lib/utils"

function alertTimerDone() {
  try {
    navigator.vibrate?.([220, 120, 220, 120, 320])
  } catch {
    /* ignore */
  }
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = 880
    gain.gain.value = 0.12
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    window.setTimeout(() => {
      try {
        osc.stop()
        void ctx.close()
      } catch {
        /* ignore */
      }
    }, 700)
  } catch {
    /* ignore */
  }
}

export function Tonight({
  items,
  onAdd,
  onPhoto,
  onSample,
  openSurvey = false,
  onSurveyHandled,
}: {
  items: FoodItem[]
  onAdd: () => void
  onPhoto: () => void
  onSample: () => void
  openSurvey?: boolean
  onSurveyHandled?: () => void
}) {
  const { locale, t } = useI18n()
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const taste = useFridge((s) => (surveyReady(s.settings.survey) ? s.settings.survey : null))
  const setSettings = useFridge((s) => s.setSettings)
  const priority = useFridge((s) => (s.settings.priority ?? (s.settings.suggest === "free" ? 3 : 0)) as 0 | 1 | 2 | 3)
  const favorites = useFridge((s) => s.settings.favorites) ?? []
  const wanted = useFridge((s) => s.settings.wanted) ?? []
  const extras = useFridge((s) => s.extras) ?? []
  const savedRecipes = useFridge((s) => s.settings.savedRecipes ?? [])
  const cookedHistory = useFridge((s) => s.settings.cookedHistory ?? [])
  const lastTonightId = useFridge((s) => s.settings.lastTonightId ?? "")
  const pendingMealId = useFridge((s) => s.settings.pendingMealId ?? "")
  const toggleSavedRecipe = useFridge((s) => s.toggleSavedRecipe)
  const markCooked = useFridge((s) => s.markCooked)
  const addItem = useFridge((s) => s.addItem)
  const updateItem = useFridge((s) => s.updateItem)
  const removeItem = useFridge((s) => s.removeItem)
  const addShop = useFridge((s) => s.addShop)
  const shop = useFridge((s) => s.shop)
  const [mode, setMode] = useState<"cook" | "browse">("cook")
  const [cuisine, setCuisine] = useState("All")
  const [haveOnly, setHaveOnly] = useState(true)
  const [useSoon, setUseSoon] = useState(false)
  const [maxTime, setMaxTime] = useState<number | null>(null)
  const [phase, setPhase] = useState<"pick" | "prep" | "plate">("pick")
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [mealId, setMealId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [checked, setChecked] = useState<string[]>([])
  const [remaining, setRemaining] = useState<Record<string, string>>({})
  const [leftovers, setLeftovers] = useState(false)
  const [note, setNote] = useState("")
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [wantOpen, setWantOpen] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerFinished, setTimerFinished] = useState(false)
  const [customMinutes, setCustomMinutes] = useState("3")

  useEffect(() => {
    if (!openSurvey) return
    setSurveyOpen(true)
    setMode("cook")
    setPhase("pick")
    setOutlineOpen(false)
    onSurveyHandled?.()
  }, [openSurvey, onSurveyHandled])

  useEffect(() => {
    if (phase !== "prep" || !outlineOpen) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    if ("wakeLock" in navigator) {
      void navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (cancelled) void sentinel.release()
          else lock = sentinel
        })
        .catch(() => undefined)
    }
    return () => {
      cancelled = true
      if (lock) void lock.release()
    }
  }, [phase, outlineOpen])

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return
    const id = window.setInterval(() => setTimerSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearInterval(id)
  }, [timerRunning, timerSeconds])

  useEffect(() => {
    if (timerRunning && timerSeconds === 0) {
      setTimerRunning(false)
      setTimerFinished(true)
      alertTimerDone()
    }
  }, [timerRunning, timerSeconds])

  const rankOpts = useMemo(
    () => ({ savedIds: savedRecipes, cookedIds: cookedHistory, lastTonightId }),
    [savedRecipes, cookedHistory, lastTonightId],
  )
  const all = useMemo(
    () => rankRecipes(items, vegetarian, priority, favorites, taste, extras, rankOpts),
    [items, vegetarian, priority, favorites, taste, extras, rankOpts],
  )
  const plan = useMemo(
    () => planMeals(items, vegetarian, priority, favorites, taste, extras, rankOpts),
    [items, vegetarian, priority, favorites, taste, extras, rankOpts],
  )
  const picked = useMemo(() => ideasByIds(wanted, items, extras).filter((row) => !isOutlineRecipe(row.recipe)), [wanted, items, extras])
  const shopRows = picked.length ? shopForIdeas(items, picked) : plan.shop
  const shopIdeas = picked.length ? picked : plan.ideas

  const filtered = useMemo(
    () =>
      applyRecipeFilters(all, {
        haveOnly: priority < 2 ? haveOnly : false,
        useSoon,
        cuisine: priority < 2 ? cuisine : "All",
        maxTime,
        hideZeroMatch: true,
      }),
    [all, haveOnly, useSoon, cuisine, maxTime, priority],
  )

  const ranked =
    priority < 2
      ? filtered
      : [
          ...plan.ideas,
          ...filtered.filter((row) => {
            if (plan.ideas.some((idea) => idea.recipe.id === row.recipe.id)) return false
            if (!favorites.length) return true
            return favorites.includes(row.recipe.cuisine)
          }),
        ]

  const active =
    (mealId ? ideasByIds([mealId], items, extras)[0] : undefined) ??
    (lastTonightId && !mealId ? ranked.find((row) => row.recipe.id === lastTonightId) : undefined) ??
    picked[0] ??
    (priority >= 2 ? plan.ideas[0] : undefined) ??
    ranked[0]
  const rest = ranked.filter((row) => row.recipe.id !== active?.recipe.id).slice(0, 3)
  const join = (names: string[]) => names.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ")
  const dish = active ? recipeText(locale, active.recipe) : null
  const isOutline = Boolean(active && isOutlineRecipe(active.recipe))
  const isSaved = Boolean(active && savedRecipes.includes(active.recipe.id))
  const used = active ? foodsForMeal(active.recipe, items) : []
  const historyRows = useMemo(() => {
    const ids = [...savedRecipes.slice(0, 4), ...cookedHistory.filter((id) => !savedRecipes.includes(id)).slice(0, 4)]
    return ideasByIds(ids, items, extras).filter((row) => !isOutlineRecipe(row.recipe))
  }, [savedRecipes, cookedHistory, items, extras])

  const pendingDishName = useMemo(() => {
    if (!pendingMealId) return ""
    const row = ideasByIds([pendingMealId], items, extras)[0] ?? all.find((item) => item.recipe.id === pendingMealId)
    return row ? recipeText(locale, row.recipe).name : ""
  }, [pendingMealId, items, extras, all, locale])

  function resetFilters() {
    setHaveOnly(false)
    setUseSoon(false)
    setMaxTime(null)
    setCuisine("All")
    setMealId(null)
  }

  function addSuggested() {
    const have = new Set(shop.map((row) => row.text.toLowerCase()))
    for (const row of shopRows) {
      const label = foodLabel(locale, row.name)
      if (!have.has(label.toLowerCase())) {
        addShop(label)
        have.add(label.toLowerCase())
      }
    }
    setNote(t("onList"))
  }

  function startCook(id: string) {
    const row = ideasByIds([id], items, extras)[0] ?? all.find((item) => item.recipe.id === id)
    if (row && isOutlineRecipe(row.recipe)) {
      setNote(t("recipeGuideOnly"))
      return
    }
    setMealId(id)
    setSettings({ lastTonightId: id, pendingMealId: id })
    setStepIndex(0)
    setTimerRunning(false)
    setTimerSeconds(0)
    setTimerFinished(false)
    setOutlineOpen(false)
    setNote("")
    setMode("cook")
    setPhase("prep")
  }

  function openPlateFor(row: NonNullable<typeof active>) {
    const mealFoods = foodsForMeal(row.recipe, items)
    setMealId(row.recipe.id)
    setChecked(mealFoods.map((item) => item.id))
    setRemaining(Object.fromEntries(mealFoods.map((item) => [item.id, ""])))
    setLeftovers(false)
    setOutlineOpen(false)
    setMode("cook")
    setPhase("plate")
  }

  function openPlate() {
    if (!active) return
    openPlateFor(active)
  }

  function resumePendingClear() {
    if (!pendingMealId) return
    const row = ideasByIds([pendingMealId], items, extras)[0] ?? all.find((item) => item.recipe.id === pendingMealId)
    if (!row || isOutlineRecipe(row.recipe)) {
      setSettings({ pendingMealId: "" })
      return
    }
    openPlateFor(row)
  }

  function resumePendingPrep() {
    if (!pendingMealId) return
    const row = ideasByIds([pendingMealId], items, extras)[0] ?? all.find((item) => item.recipe.id === pendingMealId)
    if (!row || isOutlineRecipe(row.recipe)) {
      setSettings({ pendingMealId: "" })
      return
    }
    setMealId(row.recipe.id)
    setOutlineOpen(false)
    setMode("cook")
    setPhase("prep")
  }

  function finishMeal() {
    if (!dish || !active) return
    if (!checked.length && !leftovers) {
      setNote(t("nothingUsed"))
      setSettings({ pendingMealId: "" })
      setPhase("pick")
      setOutlineOpen(false)
      setMealId(null)
      return
    }
    for (const id of checked) {
      const left = (remaining[id] ?? "").trim()
      if (!left || left === "0") removeItem(id)
      else updateItem(id, { qty: left })
    }
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
    markCooked(active.recipe.id)
    setSettings({ pendingMealId: "" })
    setNote(t("mealDone"))
    setPhase("pick")
    setOutlineOpen(false)
    setMealId(null)
  }

  function listMissing() {
    if (!active) return
    const have = new Set(shop.map((row) => row.text.toLowerCase()))
    for (const name of active.missing) {
      const label = foodLabel(locale, name)
      if (!have.has(label.toLowerCase())) {
        addShop(label)
        have.add(label.toLowerCase())
      }
    }
    setNote(t("onList"))
  }

  function startTimer(minutes: number) {
    const mins = Math.max(1, Math.min(180, Math.round(minutes)))
    setTimerFinished(false)
    setTimerSeconds(mins * 60)
    setTimerRunning(true)
  }

  if (mode === "browse" && phase === "pick") {
    return (
      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("cook")}
            className="h-11 rounded-card border border-line text-sm font-semibold"
          >
            {t("modeCook")}
          </button>
          <button type="button" className="h-11 rounded-card border border-mint bg-mint text-sm font-semibold text-mint-ink">
            {t("modeBrowse")}
          </button>
        </div>
        <button type="button" onClick={() => setWantOpen(true)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">
          {t("wantDish")}
        </button>
        <DishCatalog onCook={startCook} onAddFood={onAdd} onSample={onSample} />
        {wantOpen && (
          <Sheet title={t("wantDish")} onClose={() => setWantOpen(false)}>
            <p className="mb-3 text-sm text-muted">{t("wantDishLead")}</p>
            <DishSearch />
          </Sheet>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {phase === "pick" && items.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="h-11 rounded-card border border-mint bg-mint text-sm font-semibold text-mint-ink">
            {t("modeCook")}
          </button>
          <button
            type="button"
            onClick={() => setMode("browse")}
            className="h-11 rounded-card border border-line text-sm font-semibold"
          >
            {t("modeBrowse")}
          </button>
        </div>
      )}

      {phase === "pick" && items.length > 0 && active && <p className="text-base leading-relaxed text-muted">{t("modeCookLead")}</p>}

      {phase === "pick" && pendingMealId && pendingDishName && (
        <div className="rounded-card border border-mint/40 bg-surface px-4 py-3" role="status">
          <p className="font-medium">{t("stillMaking", { name: pendingDishName })}</p>
          <p className="mt-1 text-sm text-muted">{t("stillMakingBody")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={resumePendingClear} className="h-11 flex-1 rounded-card bg-mint text-sm font-semibold text-mint-ink">
              {t("clearFridgeCta")}
            </button>
            <button type="button" onClick={resumePendingPrep} className="h-11 rounded-card border border-line px-4 text-sm font-semibold">
              {t("resumePrep")}
            </button>
            <button type="button" onClick={() => setSettings({ pendingMealId: "" })} className="h-11 rounded-card border border-line px-4 text-sm text-muted">
              {t("dismissBanner")}
            </button>
          </div>
        </div>
      )}

      {active && dish && phase !== "pick" && (
        <ol className="grid grid-cols-3 gap-2 text-center text-sm">
          {(
            [
              ["pick", "flowChoose"],
              ["prep", "flowCook"],
              ["plate", "flowClear"],
            ] as const
          ).map(([id, key], index) => {
            const on = phase === id
            const done = (phase === "prep" && index === 0) || (phase === "plate" && index < 2)
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    if (id === "pick") {
                      setPhase("pick")
                      setOutlineOpen(false)
                    }
                    if (id === "prep" && phase === "plate") {
                      setPhase("prep")
                      setOutlineOpen(false)
                    }
                  }}
                  className={cn(
                    "min-h-11 w-full rounded-full border px-1 text-sm font-medium leading-tight",
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
          <p className="mt-2 text-base leading-relaxed text-muted">{t("emptyBody")}</p>
          <div className="mt-4 grid gap-3">
            <button type="button" onClick={onAdd} className="h-12 rounded-card bg-mint text-base font-semibold text-mint-ink">
              {t("addFood")}
            </button>
            <button type="button" onClick={onPhoto} className="h-12 rounded-card border border-line text-base font-semibold">
              {t("welcomePhoto")}
            </button>
            <button type="button" onClick={onSample} className="h-12 rounded-card border border-line text-base font-semibold">
              {t("welcomeSample")}
            </button>
          </div>
        </div>
      )}
      {phase === "pick" && taste && items.length > 0 && !active && <p className="text-sm text-muted">{t("surveyEmpty")}</p>}
      {items.length > 0 && !active && (
        <div className="space-y-3">
          <Empty title={t("filterTitle")} body={t("filterBody")} />
          <button type="button" onClick={resetFilters} className="h-11 w-full rounded-card border border-line text-sm font-semibold">
            {t("resetFilters")}
          </button>
        </div>
      )}
      {note && <p className="text-sm text-mint">{note}</p>}

      {phase === "pick" && items.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHaveOnly((v) => !v)}
              className={cn("min-h-11 rounded-full border px-3 text-sm", haveOnly ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg")}
            >
              {t("filterHave")}
            </button>
            <button
              type="button"
              onClick={() => setUseSoon((v) => !v)}
              className={cn("min-h-11 rounded-full border px-3 text-sm", useSoon ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg")}
            >
              {t("filterSoon")}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(
              [
                [null, "filterTimeAny"],
                [15, "filterTime15"],
                [25, "filterTime25"],
                [45, "filterTime45"],
              ] as const
            ).map(([mins, key]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMaxTime(mins)}
                className={cn(
                  "min-h-11 shrink-0 rounded-full border px-3 text-sm",
                  maxTime === mins ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
                )}
              >
                {t(key)}
              </button>
            ))}
          </div>
          {priority < 2 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CUISINES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCuisine(name)}
                  className={cn(
                    "min-h-11 shrink-0 rounded-full border px-3 py-2 text-sm",
                    cuisine === name ? "border-mint bg-mint text-mint-ink" : "border-line bg-raised text-fg",
                  )}
                >
                  {cuisineLabel(locale, name)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted">{t("priorityHidesFilters")}</p>
          )}
        </div>
      )}

      {phase === "pick" && items.length > 0 && (
        <button type="button" onClick={() => setWantOpen(true)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">
          {t("wantDish")}
        </button>
      )}

      {phase === "pick" && historyRows.length > 0 && (
        <article className="rounded-card border border-line bg-surface p-4">
          <h2 className="text-sm font-semibold">{t("savedSection")} · {t("cookedBefore")}</h2>
          <ul className="mt-2 space-y-2">
            {historyRows.slice(0, 4).map((row) => {
              const copy = recipeText(locale, row.recipe)
              return (
                <li key={row.recipe.id} className="flex items-center gap-2">
                  {row.recipe.image ? (
                    <img
                      src={row.recipe.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-10 shrink-0 rounded-card object-cover bg-raised"
                    />
                  ) : null}
                  <button type="button" onClick={() => setMealId(row.recipe.id)} className="min-w-0 flex-1 text-left text-sm font-medium">
                    {copy.name}
                    {lastTonightId === row.recipe.id ? <span className="ml-2 text-sm text-muted">{t("lastTonight")}</span> : null}
                  </button>
                  <button type="button" onClick={() => startCook(row.recipe.id)} className="min-h-11 shrink-0 rounded-card border border-line px-3 text-sm font-semibold">
                    {t("cookThis")}
                  </button>
                </li>
              )
            })}
          </ul>
        </article>
      )}

      {active && dish && phase === "pick" && (
        <article className="rounded-card border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium tracking-wide text-mint uppercase">{dish.cuisine}</p>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                isOutline ? "border-line text-muted" : "border-mint/40 text-mint",
              )}
            >
              {trustLevel(active.recipe) === "idea" ? t("badgeIdea") : t("badgeFull")}
            </span>
            {lastTonightId === active.recipe.id && <span className="text-xs font-medium text-muted">{t("lastTonight")}</span>}
          </div>
          <h2 className={cn("mt-1 font-display text-3xl", locale === "en" && "italic")}>{dish.name}</h2>
          <p className="mt-2 text-sm text-muted">
            {t("minutes", { n: active.recipe.time })} ·{" "}
            {active.recipe.servings === 1 ? t("serving") : t("servings", { n: active.recipe.servings })}
          </p>
          <RecipeSourceMedia recipe={active.recipe} dishName={dish.name} />
          {active.urgent.length > 0 && <p className="mt-3 text-sm text-clay">{t("usesSoon", { list: join(active.urgent) })}</p>}
          {isOutline && <p className="mt-3 text-sm leading-relaxed text-muted">{t("recipeGuideOnly")}</p>}
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">{t("youHave")}</p>
              <p className="mt-1 text-mint">{active.matched.length ? join(active.matched) : "—"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">{t("stillNeedLabel")}</p>
              <p className="mt-1 text-muted">{active.missing.length ? join(active.missing) : t("haveAll")}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {!isOutline ? (
              <button type="button" onClick={() => startCook(active.recipe.id)} className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink">
                {t("cookThis")}
              </button>
            ) : (
              <button type="button" disabled className="h-11 flex-1 rounded-card border border-line text-sm text-muted opacity-60">
                {t("cannotCookOutline")}
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleSavedRecipe(active.recipe.id)}
              className="h-11 rounded-card border border-line px-4 text-sm font-semibold"
              aria-pressed={isSaved}
            >
              {isSaved ? t("savedDish") : t("saveDishBtn")}
            </button>
            {rest[0] && (
              <button type="button" onClick={() => setMealId(rest[0].recipe.id)} className="h-11 rounded-card border border-line px-4 text-sm font-semibold">
                {t("another")}
              </button>
            )}
          </div>
        </article>
      )}

      {active && dish && phase === "prep" && !outlineOpen && (
        <article className="rounded-card border border-line bg-surface p-5">
          <button
            type="button"
            onClick={() => {
              setPhase("pick")
              setOutlineOpen(false)
            }}
            className="mb-3 h-11 self-start text-sm text-muted underline"
          >
            {t("exitCook")}
          </button>
          <p className="text-sm font-medium tracking-wide text-mint uppercase">{dish.cuisine}</p>
          <h2 className={cn("mt-1 font-display text-3xl", locale === "en" && "italic")}>{dish.name}</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">{t("prepLead")}</p>
          <RecipeSourceMedia recipe={active.recipe} dishName={dish.name} compact />
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">{t("pullThese")}</p>
              <p className="mt-1 text-mint">{active.matched.length ? join(active.matched) : "—"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">{t("stillNeedLabel")}</p>
              <p className="mt-1 text-muted">{active.missing.length ? join(active.missing) : t("haveAll")}</p>
            </div>
          </div>
          {active.missing.length > 0 && (
            <button type="button" onClick={listMissing} className="mt-4 h-11 w-full rounded-card border border-line text-sm font-semibold">
              {t("addMissing")}
            </button>
          )}
          <button type="button" onClick={openPlate} className="mt-3 h-11 w-full rounded-card bg-mint font-semibold text-mint-ink">
            {t("clearFridgeCta")}
          </button>
          <button type="button" onClick={() => { setOutlineOpen(true); setStepIndex(0) }} className="mt-2 h-11 w-full rounded-card border border-line text-sm font-semibold">
            {t("quickOutline")}
          </button>
        </article>
      )}

      {active && dish && phase === "prep" && outlineOpen && (
        <article className="flex min-h-[58dvh] flex-col rounded-card border border-line bg-surface p-5">
          <button type="button" onClick={() => setOutlineOpen(false)} className="mb-4 h-11 self-start text-sm text-muted underline">
            {t("hideOutline")}
          </button>
          <p className="text-sm font-medium tracking-wide text-mint">{dish.name}</p>
          <p className="mt-1 text-sm text-muted">{t("quickOutline")} · {t("stepOf", { n: stepIndex + 1, m: dish.steps.length })}</p>
          <ol className="mt-4 flex-1 space-y-4 text-lg leading-relaxed">
            {dish.steps.map((step, i) => (
              <li key={`${i}-${step}`} className={cn("flex gap-3", i !== stepIndex && "text-muted")}>
                <span className={cn("tabular-nums", i === stepIndex && "text-mint")}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-card border border-line p-3">
            <p className="text-sm font-semibold">
              {t("timer")}
              {timerSeconds > 0 ? ` · ${Math.floor(timerSeconds / 60)}:${String(timerSeconds % 60).padStart(2, "0")}` : ""}
            </p>
            {timerFinished && (
              <p role="alert" className="mt-1 text-sm font-semibold text-clay">
                {t("timerAlert")}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 10, 15].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => startTimer(minutes)}
                  className="h-10 rounded-full border border-line px-3 text-sm"
                >
                  {t("minutes", { n: minutes })}
                </button>
              ))}
              {timerSeconds > 0 && (
                <button type="button" onClick={() => setTimerRunning((running) => !running)} className="h-10 rounded-full border border-line px-3 text-sm">
                  {timerRunning ? t("pause") : t("resume")}
                </button>
              )}
            </div>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const mins = Number(customMinutes)
                if (!Number.isFinite(mins) || mins < 1) return
                startTimer(mins)
              }}
            >
              <label className="sr-only" htmlFor="timer-custom">
                {t("timerCustom")}
              </label>
              <input
                id="timer-custom"
                type="number"
                min={1}
                max={180}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder={t("timerCustom")}
                className="h-10 min-w-0 flex-1 rounded-full border border-line bg-raised px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
              />
              <button type="submit" className="h-10 shrink-0 rounded-full border border-line px-3 text-sm font-semibold">
                {t("timerStart")}
              </button>
            </form>
          </div>
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
              <button type="button" onClick={() => setStepIndex((n) => n + 1)} className="h-11 flex-1 rounded-card border border-line font-semibold">
                {t("next")}
              </button>
            ) : (
              <button type="button" onClick={openPlate} className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink">
                {t("clearFridgeCta")}
              </button>
            )}
          </div>
          <button type="button" onClick={openPlate} className="mt-3 h-11 w-full rounded-card bg-mint font-semibold text-mint-ink">
            {t("clearFridgeCta")}
          </button>
        </article>
      )}

      {active && dish && phase === "plate" && (
        <article className="rounded-card border border-line bg-surface p-5">
          <h2 className={cn("font-display text-3xl", locale === "en" && "italic")}>{dish.name}</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">{used.length ? t("plateLead") : t("nothingUsed")}</p>
          {used.length > 0 && (
            <ul className="mt-4 space-y-3">
              {used.map((item) => {
                const on = checked.includes(item.id)
                return (
                  <li key={item.id} className="rounded-card border border-line p-3">
                    <label className="flex min-h-11 items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) =>
                          setChecked((current) => (e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)))
                        }
                        className="size-5 accent-mint"
                      />
                      <span className="min-w-0 flex-1">
                        {foodLabel(locale, item.name)}
                        <span className="text-muted"> · {item.qty}</span>
                      </span>
                      <span className="text-sm text-muted">{on && !(remaining[item.id] ?? "").trim() ? t("usedUp") : null}</span>
                    </label>
                    {on && (
                      <label className="mt-2 block text-sm text-muted">
                        {t("remainingQty")}
                        <input
                          value={remaining[item.id] ?? ""}
                          onChange={(e) => setRemaining((current) => ({ ...current, [item.id]: e.target.value }))}
                          placeholder={t("usedUp")}
                          className="mt-1 h-10 w-full rounded-card border border-line bg-raised px-3 text-sm text-fg outline-none focus-visible:outline-2 focus-visible:outline-mint"
                        />
                      </label>
                    )}
                  </li>
                )
              })}
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
                    ·{" "}
                    {t("forList", {
                      list: join(row.recipeIds.map((id) => recipeText(locale, shopIdeas.find((idea) => idea.recipe.id === id)!.recipe).name)),
                    })}
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
            const outline = isOutlineRecipe(row.recipe)
            return (
              <li key={row.recipe.id} className="flex flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3">
                <div className="flex items-start gap-3">
                  {row.recipe.image ? (
                    <img
                      src={row.recipe.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-14 shrink-0 rounded-card object-cover bg-raised"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-medium leading-snug">{copy.name}</p>
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide", outline ? "border-line text-muted" : "border-mint/40 text-mint")}>
                        {outline ? t("badgeIdea") : t("badgeFull")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {copy.cuisine} · {t("minutes", { n: row.recipe.time })}
                      {row.missing.length ? ` · ${t("missing", { list: join(row.missing) })}` : ""}
                    </p>
                  </div>
                </div>
                {outline ? (
                  <p className="text-sm leading-snug text-muted">{t("cannotCookOutline")}</p>
                ) : (
                  <button type="button" onClick={() => startCook(row.recipe.id)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">
                    {t("cookThis")}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {phase === "pick" && items.length > 0 && (
        <div className="grid gap-2">
          <button type="button" onClick={() => setMode("browse")} className="h-11 w-full rounded-card border border-line text-sm font-semibold">
            {t("browseDishes")}
          </button>
          <button type="button" onClick={() => setPrefsOpen((open) => !open)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">
            {t("chooseHow")}
          </button>
        </div>
      )}
      {phase === "pick" && prefsOpen && (
        <section className="rounded-card border border-line bg-surface px-4 py-3">
          <p className="text-sm text-muted">{t("chooseHowBody")}</p>
          <SuggestControl />
          {priority >= 2 && <p className="mt-2 text-sm leading-relaxed text-muted">{t("priorityHidesFilters")}</p>}
        </section>
      )}
      {phase === "pick" && items.length > 0 && !taste && !surveyOpen && <TastePrompt onOpen={() => setSurveyOpen(true)} />}
      {phase === "pick" && surveyOpen && <SurveyPanel onDone={() => setSurveyOpen(false)} />}
      {phase === "pick" && taste && (
        <TasteProfile
          onEdit={() => {
            setSettings({ survey: { ...(useFridge.getState().settings.survey ?? emptySurvey), done: false } })
            setSurveyOpen(true)
          }}
        />
      )}
      {wantOpen && (
        <Sheet title={t("wantDish")} onClose={() => setWantOpen(false)}>
          <p className="mb-3 text-sm text-muted">{t("wantDishLead")}</p>
          <DishSearch />
        </Sheet>
      )}
    </section>
  )
}
