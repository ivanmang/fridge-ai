import { useEffect, useMemo, useState } from "react"
import { DishCatalog } from "@/components/fridge/dish-catalog"
import { CUISINES, Empty, SuggestControl, TastePrompt, useI18n } from "@/components/fridge/shared"
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

export function Tonight({ items, onAdd, onPhoto, onSample }: { items: FoodItem[]; onAdd: () => void; onPhoto: () => void; onSample: () => void }) {
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
  const toggleSavedRecipe = useFridge((s) => s.toggleSavedRecipe)
  const markCooked = useFridge((s) => s.markCooked)
  const addItem = useFridge((s) => s.addItem)
  const addShop = useFridge((s) => s.addShop)
  const removeMany = useFridge((s) => s.removeMany)
  const shop = useFridge((s) => s.shop)
  const [mode, setMode] = useState<"cook" | "browse">("cook")
  const [cuisine, setCuisine] = useState("All")
  const [haveOnly, setHaveOnly] = useState(true)
  const [useSoon, setUseSoon] = useState(false)
  const [maxTime, setMaxTime] = useState<number | null>(null)
  const [phase, setPhase] = useState<"pick" | "cook" | "plate">("pick")
  const [mealId, setMealId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [checked, setChecked] = useState<string[]>([])
  const [leftovers, setLeftovers] = useState(false)
  const [note, setNote] = useState("")
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerFinished, setTimerFinished] = useState(false)

  useEffect(() => {
    if (phase !== "cook") return
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
  }, [phase])

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return
    const id = window.setInterval(() => setTimerSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearInterval(id)
  }, [timerRunning, timerSeconds])

  useEffect(() => {
    if (timerRunning && timerSeconds === 0) {
      setTimerRunning(false)
      setTimerFinished(true)
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
    setSettings({ lastTonightId: id })
    setStepIndex(0)
    setTimerRunning(false)
    setTimerSeconds(0)
    setTimerFinished(false)
    setNote("")
    setMode("cook")
    setPhase("cook")
  }

  function openPlate() {
    if (!active) return
    setChecked(foodsForMeal(active.recipe, items).map((item) => item.id))
    setLeftovers(false)
    setPhase("plate")
  }

  function finishMeal() {
    if (!dish || !active) return
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
    markCooked(active.recipe.id)
    setNote(t("mealDone"))
    setPhase("pick")
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
        <DishCatalog onCook={startCook} onAddFood={onAdd} onSample={onSample} />
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

      {phase === "pick" && items.length > 0 && active && <p className="text-sm text-muted">{t("modeCookLead")}</p>}
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
            <button type="button" onClick={onAdd} className="h-11 rounded-card bg-mint font-semibold text-mint-ink">
              {t("addFood")}
            </button>
            <button type="button" onClick={onPhoto} className="h-11 rounded-card border border-line font-semibold">
              {t("welcomePhoto")}
            </button>
            <button type="button" onClick={onSample} className="h-11 rounded-card border border-line font-semibold">
              {t("welcomeSample")}
            </button>
          </div>
        </div>
      )}
      {phase === "pick" && taste && items.length > 0 && !active && <p className="text-sm text-muted">{t("surveyEmpty")}</p>}
      {items.length > 0 && !active && <Empty title={t("filterTitle")} body={t("filterBody")} />}
      {note && <p className="text-sm text-mint">{note}</p>}

      {phase === "pick" && items.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHaveOnly((v) => !v)}
              className={cn("h-10 rounded-full border px-3 text-sm", haveOnly ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg")}
            >
              {t("filterHave")}
            </button>
            <button
              type="button"
              onClick={() => setUseSoon((v) => !v)}
              className={cn("h-10 rounded-full border px-3 text-sm", useSoon ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg")}
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
                  "h-10 shrink-0 rounded-full border px-3 text-sm",
                  maxTime === mins ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
                )}
              >
                {t(key)}
              </button>
            ))}
          </div>
          {priority < 2 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CUISINES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCuisine(name)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-2 text-sm",
                    cuisine === name ? "border-mint bg-mint text-mint-ink" : "border-line bg-raised text-fg",
                  )}
                >
                  {cuisineLabel(locale, name)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === "pick" && historyRows.length > 0 && (
        <article className="rounded-card border border-line bg-surface p-4">
          <h2 className="text-sm font-semibold">{t("savedSection")} · {t("cookedBefore")}</h2>
          <ul className="mt-2 space-y-2">
            {historyRows.slice(0, 4).map((row) => {
              const copy = recipeText(locale, row.recipe)
              return (
                <li key={row.recipe.id} className="flex items-center gap-2">
                  <button type="button" onClick={() => setMealId(row.recipe.id)} className="min-w-0 flex-1 text-left text-sm font-medium">
                    {copy.name}
                    {lastTonightId === row.recipe.id ? <span className="ml-2 text-xs text-muted">{t("lastTonight")}</span> : null}
                  </button>
                  <button type="button" onClick={() => startCook(row.recipe.id)} className="h-10 shrink-0 rounded-card border border-line px-3 text-xs font-semibold">
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
            <p className="text-xs font-medium tracking-wide text-mint uppercase">{dish.cuisine}</p>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                isOutline ? "border-line text-muted" : "border-mint/40 text-mint",
              )}
            >
              {trustLevel(active.recipe) === "idea" ? t("badgeIdea") : t("badgeFull")}
            </span>
            {lastTonightId === active.recipe.id && <span className="text-[10px] text-muted uppercase">{t("lastTonight")}</span>}
          </div>
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

      {active && dish && phase === "cook" && (
        <article className="flex min-h-[58dvh] flex-col rounded-card border border-line bg-surface p-5">
          <button type="button" onClick={() => setPhase("pick")} className="mb-4 h-11 self-start text-sm text-muted underline">
            {t("exitCook")}
          </button>
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
            <p className="text-sm font-semibold">
              {t("timer")}
              {timerSeconds > 0 ? ` · ${Math.floor(timerSeconds / 60)}:${String(timerSeconds % 60).padStart(2, "0")}` : ""}
            </p>
            {timerFinished && (
              <p role="status" className="mt-1 text-sm text-mint">
                {t("timerDone")}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 10, 15].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => {
                    setTimerFinished(false)
                    setTimerSeconds(minutes * 60)
                    setTimerRunning(true)
                  }}
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
              <button type="button" onClick={() => setStepIndex((n) => n + 1)} className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink">
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
                        setChecked((current) => (e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)))
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
              <li key={row.recipe.id} className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{copy.name}</p>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", outline ? "border-line text-muted" : "border-mint/40 text-mint")}>
                      {outline ? t("badgeIdea") : t("badgeFull")}
                    </span>
                  </div>
                  <p className="text-sm text-muted">
                    {copy.cuisine} · {t("minutes", { n: row.recipe.time })}
                    {row.missing.length ? ` · ${t("missing", { list: join(row.missing) })}` : ""}
                  </p>
                </div>
                {outline ? (
                  <span className="shrink-0 text-xs text-muted">{t("cannotCookOutline")}</span>
                ) : (
                  <button type="button" onClick={() => startCook(row.recipe.id)} className="h-11 shrink-0 rounded-card border border-line px-3 text-sm font-semibold">
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
    </section>
  )
}
