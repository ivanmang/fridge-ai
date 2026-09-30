import { useEffect, useState } from "react"
import { ExternalLink, Search } from "lucide-react"
import { useI18n } from "@/components/fridge/shared"
import { lookupDish, recipeSearchUrl, type DishLookup } from "@/lib/recipe-lookup"
import type { Recipe } from "@/lib/recipes"
import { cn } from "@/lib/utils"

/** Live dish photo (Wikipedia when matched) + always-valid recipe web search. */
export function RecipeSourceMedia({
  recipe,
  dishName,
  compact = false,
}: {
  recipe: Recipe
  dishName: string
  compact?: boolean
}) {
  const { locale, t } = useI18n()
  const [lookup, setLookup] = useState<DishLookup | null>(null)
  const [loading, setLoading] = useState(true)
  const searchUrl = recipeSearchUrl(recipe, locale)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLookup(null)
    void lookupDish(recipe, locale).then((hit) => {
      if (!cancelled) {
        setLookup(hit)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id, recipe.name, recipe.zh?.name, recipe.image, recipe.sourceUrl, locale])

  return (
    <div className={cn(compact ? "mt-3 space-y-2" : "mt-3 space-y-3")}>
      {loading && (
        <div
          className={cn("w-full animate-pulse bg-raised", compact ? "h-28 rounded-card" : "aspect-[16/10] rounded-card")}
          aria-hidden
        />
      )}
      {!loading && lookup?.image && (
        <img
          src={lookup.image}
          alt={t("recipePhotoAlt", { name: dishName })}
          loading="lazy"
          decoding="async"
          className={cn("w-full object-cover bg-raised", compact ? "h-28 rounded-card" : "aspect-[16/10] rounded-card")}
        />
      )}
      <a
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-card bg-mint px-4 text-sm font-semibold text-mint-ink"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t("findRecipesOnline")}</span>
      </a>
      {lookup?.aboutUrl && (
        <a
          href={lookup.aboutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-card border border-line px-4 text-sm font-semibold text-mint"
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          <span className="truncate">
            {lookup.aboutName ? t("aboutDishNamed", { name: lookup.aboutName }) : t("aboutDish")}
          </span>
        </a>
      )}
    </div>
  )
}
