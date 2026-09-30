import { useMemo, useState } from "react"
import { useI18n } from "@/components/fridge/shared"
import { dishSource, isOutlineRecipe, listRecipes } from "@/lib/logic"
import { recipeText } from "@/lib/i18n"
import { useFridge } from "@/lib/store"
import { surveyReady } from "@/lib/survey"
import { cn } from "@/lib/utils"

export function DishCatalog({ onCook }: { onCook: (id: string) => void }) {
  const { locale, t } = useI18n()
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const taste = useFridge((s) => (surveyReady(s.settings.survey) ? s.settings.survey : null))
  const [source, setSource] = useState<"all" | "home" | "lkk" | "knorr" | "guardian">("all")
  const [query, setQuery] = useState("")
  const [shown, setShown] = useState(12)
  const [showAll, setShowAll] = useState(false)
  const dishes = useMemo(
    () => listRecipes(vegetarian, taste, { includeOutlines: showAll || source !== "all" || Boolean(query.trim()) }),
    [vegetarian, taste, showAll, source, query],
  )
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return dishes.filter((recipe) => {
      if (source !== "all" && dishSource(recipe.id) !== source) return false
      if (!q && source === "all" && !showAll) return recipe.id.startsWith("home-") || dishSource(recipe.id) === "home"
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
      <p className="text-xs text-muted">{t("catalogueHint")}</p>
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
          const outline = isOutlineRecipe(recipe)
          const sourceLabel = from === "home" ? t("sourceHome") : from === "knorr" ? t("sourceKnorr") : from === "guardian" ? t("sourceGuardian") : t("sourceLkk")
          return (
            <li key={recipe.id} className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{copy.name}</p>
                <p className="text-sm text-muted">
                  {sourceLabel} · {copy.cuisine} · {t("minutes", { n: recipe.time })}
                  {outline ? ` · ${t("outlineTag")}` : ""}
                </p>
              </div>
              {outline ? (
                <span className="shrink-0 text-xs text-muted">{t("outlineTag")}</span>
              ) : (
                <button type="button" onClick={() => onCook(recipe.id)} className="h-11 shrink-0 rounded-card border border-line px-3 text-sm font-semibold">
                  {t("cookThis")}
                </button>
              )}
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

