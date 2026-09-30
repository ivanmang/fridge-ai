import { useMemo, useState } from "react"
import { useI18n } from "@/components/fridge/shared"
import {
  applyRecipeFilters,
  dishSource,
  ideasByIds,
  isOutlineRecipe,
  listRecipes,
  searchRecipes,
  trustLevel,
  type FoodItem,
  type RankedRecipe,
} from "@/lib/logic"
import { foodLabel, recipeText } from "@/lib/i18n"
import { recipeSearchUrl } from "@/lib/recipe-lookup"
import { useFridge } from "@/lib/store"
import { surveyReady } from "@/lib/survey"
import { cn } from "@/lib/utils"

function rankList(recipes: ReturnType<typeof listRecipes>, items: FoodItem[]): RankedRecipe[] {
  const ids = recipes.map((recipe) => recipe.id)
  const ranked = ideasByIds(ids, items)
  const byId = new Map(ranked.map((row) => [row.recipe.id, row]))
  return recipes.map(
    (recipe) =>
      byId.get(recipe.id) ?? {
        recipe,
        score: 0,
        matched: [],
        missing: [...recipe.need],
        urgent: [],
      },
  )
}

export function DishCatalog({
  onCook,
  onAddFood,
  onSample,
}: {
  onCook: (id: string) => void
  onAddFood?: () => void
  onSample?: () => void
}) {
  const { locale, t } = useI18n()
  const items = useFridge((s) => s.items)
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const taste = useFridge((s) => (surveyReady(s.settings.survey) ? s.settings.survey : null))
  const includeOutlines = useFridge((s) => s.settings.includeOutlines ?? false)
  const setSettings = useFridge((s) => s.setSettings)
  const savedRecipes = useFridge((s) => s.settings.savedRecipes ?? [])
  const cookedHistory = useFridge((s) => s.settings.cookedHistory ?? [])
  const toggleSavedRecipe = useFridge((s) => s.toggleSavedRecipe)
  const [source, setSource] = useState<"all" | "home" | "lkk" | "knorr" | "guardian">("all")
  const [query, setQuery] = useState("")
  const [shown, setShown] = useState(12)
  const [haveOnly, setHaveOnly] = useState(false)
  const [useSoon, setUseSoon] = useState(false)
  const [maxTime, setMaxTime] = useState<number | null>(null)
  const [savedOnly, setSavedOnly] = useState(false)
  const [cookedOnly, setCookedOnly] = useState(false)

  const q = query.trim()
  const typeahead = useMemo(
    () => (q.length >= 1 ? searchRecipes(q, items, vegetarian, taste, { includeOutlines, limit: 8 }) : []),
    [q, items, vegetarian, taste, includeOutlines],
  )

  const dishes = useMemo(() => {
    if (q) {
      return searchRecipes(q, items, vegetarian, taste, { includeOutlines, limit: 48 })
    }
    const list = listRecipes(vegetarian, taste, {
      includeOutlines: includeOutlines && source !== "home",
    }).filter((recipe) => {
      if (source !== "all" && dishSource(recipe.id) !== source) return false
      if (!includeOutlines && isOutlineRecipe(recipe)) return false
      if (source === "all" && !includeOutlines) {
        return dishSource(recipe.id) === "home"
      }
      return true
    })
    return rankList(list, items)
  }, [q, items, vegetarian, taste, includeOutlines, source])

  const filtered = useMemo(
    () =>
      applyRecipeFilters(dishes, {
        haveOnly,
        useSoon,
        maxTime,
        hideZeroMatch: items.length > 0 && !includeOutlines && !q,
        savedOnly,
        cookedOnly,
        savedIds: savedRecipes,
        cookedIds: cookedHistory,
      }),
    [dishes, haveOnly, useSoon, maxTime, includeOutlines, q, savedOnly, cookedOnly, savedRecipes, cookedHistory, items.length],
  )
  const page = filtered.slice(0, shown)
  const emptyFridge = items.length === 0

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">{t("allDishes")}</h2>
        <p className="text-sm text-muted">{t("dishCount", { n: filtered.length })}</p>
      </div>
      <p className="text-base leading-relaxed text-muted">{t("modeBrowseLead")}</p>

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={includeOutlines}
          onChange={(e) => setSettings({ includeOutlines: e.target.checked })}
          className="size-5 accent-mint"
        />
        <span>
          {t("includeIdeas")}
          <span className="mt-0.5 block text-sm leading-relaxed text-muted">{includeOutlines ? t("includeIdeasOn") : t("includeIdeasOff")}</span>
        </span>
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["all", "sourceAll"],
            ["home", "sourceHome"],
            ...(includeOutlines
              ? ([["lkk", "sourceLkk"], ["knorr", "sourceKnorr"], ["guardian", "sourceGuardian"]] as const)
              : []),
          ] as const
        ).map(([id, key]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSource(id)
              setShown(12)
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

      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShown(12)
          }}
          placeholder={t("searchDish")}
          className="h-12 w-full rounded-card border border-line bg-surface px-3 text-base outline-none focus-visible:outline-2 focus-visible:outline-mint"
          aria-autocomplete="list"
          aria-controls="dish-typeahead"
        />
        {q.length >= 1 && typeahead.length > 0 && (
          <ul id="dish-typeahead" className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-card border border-line bg-raised shadow-lg">
            {typeahead.map((row) => {
              const copy = recipeText(locale, row.recipe)
              return (
                <li key={row.recipe.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-base hover:bg-surface"
                    onClick={() => {
                      setQuery(copy.name)
                      setShown(12)
                    }}
                  >
                    <span className="truncate font-medium">{copy.name}</span>
                    <span className="shrink-0 text-sm text-muted">
                      {trustLevel(row.recipe) === "idea" ? t("badgeIdea") : t("badgeFull")}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            [haveOnly, () => setHaveOnly((v) => !v), "filterHave"],
            [useSoon, () => setUseSoon((v) => !v), "filterSoon"],
            [savedOnly, () => setSavedOnly((v) => !v), "savedSection"],
            [cookedOnly, () => setCookedOnly((v) => !v), "cookedBefore"],
          ] as const
        ).map(([on, toggle, key]) => (
          <button
            key={key}
            type="button"
            onClick={toggle}
            className={cn("min-h-11 rounded-full border px-3 text-sm", on ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg")}
          >
            {t(key)}
          </button>
        ))}
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

      {emptyFridge && !q && (
        <div className="rounded-card border border-line bg-surface p-4">
          <h3 className="font-display text-xl">{t("searchEmptyTitle")}</h3>
          <p className="mt-1 text-sm text-muted">{t("searchEmptyBody")}</p>
          <div className="mt-3 grid gap-2">
            {onAddFood && (
              <button type="button" onClick={onAddFood} className="h-11 rounded-card bg-mint font-semibold text-mint-ink">
                {t("addFood")}
              </button>
            )}
            {onSample && (
              <button type="button" onClick={onSample} className="h-11 rounded-card border border-line font-semibold">
                {t("welcomeSample")}
              </button>
            )}
          </div>
        </div>
      )}

      {!emptyFridge && filtered.length === 0 && (
        <p className="text-sm text-muted">{q ? t("searchNoHits") : t("filterBody")}</p>
      )}

      <ul className="space-y-2">
        {page.map((row) => {
          const recipe = row.recipe
          const copy = recipeText(locale, recipe)
          const from = dishSource(recipe.id)
          const outline = isOutlineRecipe(recipe)
          const saved = savedRecipes.includes(recipe.id)
          const sourceLabel =
            from === "home" ? t("sourceHome") : from === "knorr" ? t("sourceKnorr") : from === "guardian" ? t("sourceGuardian") : t("sourceLkk")
          return (
            <li key={recipe.id} className="flex flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3">
              <div className="flex items-start gap-3">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-14 shrink-0 rounded-card object-cover bg-raised"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-medium leading-snug">{copy.name}</p>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                        outline ? "border-line text-muted" : "border-mint/40 text-mint",
                      )}
                    >
                      {outline ? t("badgeIdea") : t("badgeFull")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {sourceLabel} · {copy.cuisine} · {t("minutes", { n: recipe.time })}
                    {row.missing.length
                      ? ` · ${t("missing", { list: row.missing.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ") })}`
                      : ""}
                  </p>
                  {!outline && (
                    <a
                      href={recipeSearchUrl(recipe, locale)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-mint"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("findRecipesOnline")}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleSavedRecipe(recipe.id)}
                  className="h-11 min-w-0 flex-1 rounded-card border border-line px-3 text-sm font-semibold"
                  aria-pressed={saved}
                >
                  {saved ? t("savedDish") : t("saveDishBtn")}
                </button>
                {outline ? (
                  <p className="flex min-h-11 flex-1 items-center justify-center text-center text-sm leading-snug text-muted">{t("cannotCookOutline")}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => onCook(recipe.id)}
                    className="h-11 min-w-0 flex-1 rounded-card border border-line px-3 text-sm font-semibold"
                  >
                    {t("cookThis")}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {shown < filtered.length && (
        <button type="button" onClick={() => setShown((n) => n + 24)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">
          {t("showMoreDishes")}
        </button>
      )}
    </section>
  )
}
