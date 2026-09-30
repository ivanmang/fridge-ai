import { useEffect, useState } from "react"
import { ExternalLink, Search } from "lucide-react"
import { useI18n } from "@/components/fridge/shared"
import { lookupDish, recipeGuideUrl, recipeSearchUrl, type DishLookup } from "@/lib/recipe-lookup"
import { recipeImage } from "@/lib/recipe-media"
import type { Recipe } from "@/lib/recipes"
import { cn } from "@/lib/utils"

/**
 * Deterministic dish-specific photo + verified recipe page when sourceUrl is set.
 * Never send users to Google/site-search when we have a direct recipe URL.
 */
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
  const image = recipeImage(recipe)
  const guideUrl = recipeGuideUrl(recipe)
  const [lookup, setLookup] = useState<DishLookup | null>(
    guideUrl ? { aboutUrl: guideUrl, aboutName: recipe.sourceName, image } : null,
  )

  useEffect(() => {
    let cancelled = false
    if (guideUrl) {
      setLookup({ aboutUrl: guideUrl, aboutName: recipe.sourceName, image })
      return () => {
        cancelled = true
      }
    }
    setLookup(null)
    void lookupDish(recipe, locale).then((hit) => {
      if (!cancelled) setLookup(hit)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id, recipe.name, recipe.zh?.name, recipe.sourceUrl, recipe.sourceName, locale, image, guideUrl])

  return (
    <div className={cn(compact ? "mt-3 space-y-2" : "mt-3 space-y-3")}>
      {image ? (
        <img
          src={image}
          alt={t("recipePhotoAlt", { name: dishName })}
          loading="lazy"
          decoding="async"
          className={cn("w-full object-cover bg-raised", compact ? "h-28 rounded-card" : "aspect-[16/10] rounded-card")}
        />
      ) : null}
      {guideUrl ? (
        <a
          href={guideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-card bg-mint px-4 text-sm font-semibold text-mint-ink"
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          <span className="text-center leading-snug">
            {recipe.sourceName
              ? t("aboutDishNamed", { name: recipe.sourceName })
              : t("aboutDish")}
          </span>
        </a>
      ) : (
        <a
          href={recipeSearchUrl(recipe, locale)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-card bg-mint px-4 text-sm font-semibold text-mint-ink"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="text-center leading-snug">{t("findRecipesOnline")}</span>
        </a>
      )}
      {!guideUrl && lookup?.aboutUrl && (
        <a
          href={lookup.aboutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-card border border-line px-4 text-sm font-semibold text-mint"
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          <span className="text-center leading-snug">
            {lookup.aboutName ? t("aboutDishNamed", { name: lookup.aboutName }) : t("aboutDish")}
          </span>
        </a>
      )}
    </div>
  )
}
