import { ExternalLink } from "lucide-react"
import { useI18n } from "@/components/fridge/shared"
import { recipeGuideUrl } from "@/lib/recipe-lookup"
import { recipeImage } from "@/lib/recipe-media"
import type { Recipe } from "@/lib/recipes"
import { cn } from "@/lib/utils"

/**
 * Dish-specific photo + direct origin recipe page when verified.
 * Never links to Google / site-search — omit the CTA if no direct page exists.
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
  const { t } = useI18n()
  const image = recipeImage(recipe)
  const guideUrl = recipeGuideUrl(recipe)

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
          <span className="truncate text-center leading-snug">
            {recipe.sourceName ? t("viewFullRecipeNamed", { name: recipe.sourceName }) : t("viewFullRecipe")}
          </span>
        </a>
      ) : null}
    </div>
  )
}
