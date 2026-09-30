import { useEffect, useState } from "react"
import { ExternalLink, Search } from "lucide-react"
import { useI18n } from "@/components/fridge/shared"
import { lookupDish, recipeSearchUrl, type DishLookup } from "@/lib/recipe-lookup"
import { recipeImage } from "@/lib/recipe-media"
import type { Recipe } from "@/lib/recipes"
import { cn } from "@/lib/utils"

/**
 * Deterministic dish-specific photo (stored media map) + always-valid recipe web search.
 * Optional Wikipedia / source "about" link loads in the background — never for the photo.
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
  const [lookup, setLookup] = useState<DishLookup | null>(
    recipe.sourceUrl
      ? { aboutUrl: recipe.sourceUrl, aboutName: recipe.sourceName, image }
      : null,
  )
  const searchUrl = recipeSearchUrl(recipe, locale)

  useEffect(() => {
    let cancelled = false
    // About / guide link only — photo is already deterministic from the media map.
    if (recipe.sourceUrl) {
      setLookup({ aboutUrl: recipe.sourceUrl, aboutName: recipe.sourceName, image })
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
  }, [recipe.id, recipe.name, recipe.zh?.name, recipe.sourceUrl, recipe.sourceName, locale, image])

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
      <a
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-card bg-mint px-4 text-sm font-semibold text-mint-ink"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="text-center leading-snug">{t("findRecipesOnline")}</span>
      </a>
      {lookup?.aboutUrl && (
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
