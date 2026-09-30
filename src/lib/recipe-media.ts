import type { Recipe } from "@/lib/recipes"

export type RecipeMedia = {
  image: string
  sourceUrl: string
  sourceName: string
}

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`

/** Stable food photos (Unsplash) used as dish thumbnails. */
const IMG = {
  rice: u("1512058564366-18510be2db19"),
  egg: u("1525351484163-7529414344d8"),
  soup: u("1547592166-23ac45744acd"),
  veg: u("1540420773420-3366772f4999"),
  chicken: u("1604908176997-125f25cc6f3d"),
  bowl: u("1546069901-ba9599a7e63c"),
  seafood: u("1559339352-11d035aa65de"),
  tofu: u("1626082927389-6cd097cdc6ec"),
  salad: u("1512621776951-a57141f2eefd"),
  fish: u("1467003909585-2f8a72700288"),
  platter: u("1504674900247-0877df9cc836"),
  breakfast: u("1533089860892-a7c6f0a88666"),
  pasta: u("1563379926898-05f4575a45d8"),
  friedRice: u("1603133872878-684f208fb84b"),
  noodles: u("1562967914-608f82629710"),
  stew: u("1574484284002-952d92456975"),
  toast: u("1551218808-94e220e084d2"),
  meat: u("1544025162-d76694265947"),
} as const

/**
 * Photos + external full-recipe guides for the cookable `home-*` book.
 * Guides are classic online references for the same dish (not scrape provenance).
 */
export const RECIPE_MEDIA: Record<string, RecipeMedia> = {
  "home-tomato-egg-rice": { image: IMG.egg, sourceUrl: "https://thewoksoflife.com/tomato-egg-stir-fry/", sourceName: "The Woks of Life" },
  "home-ginger-chicken-rice": { image: IMG.chicken, sourceUrl: "https://thewoksoflife.com/ginger-scallion-chicken/", sourceName: "The Woks of Life" },
  "home-garlic-greens": { image: IMG.veg, sourceUrl: "https://thewoksoflife.com/garlic-chinese-broccoli/", sourceName: "The Woks of Life" },
  "home-tofu-tomato": { image: IMG.tofu, sourceUrl: "https://thewoksoflife.com/tomato-egg-drop-soup/", sourceName: "The Woks of Life" },
  "home-egg-fried-rice": { image: IMG.friedRice, sourceUrl: "https://thewoksoflife.com/egg-fried-rice/", sourceName: "The Woks of Life" },
  "home-steamed-eggs": { image: IMG.egg, sourceUrl: "https://thewoksoflife.com/chinese-steamed-eggs/", sourceName: "The Woks of Life" },
  "home-chicken-tofu-soup": { image: IMG.soup, sourceUrl: "https://thewoksoflife.com/chicken-tofu-soup/", sourceName: "The Woks of Life" },
  "home-mushroom-omelet": { image: IMG.egg, sourceUrl: "https://www.bbcgoodfood.com/recipes/mushroom-omelette", sourceName: "BBC Good Food" },
  "home-soy-eggs-rice": { image: IMG.egg, sourceUrl: "https://thewoksoflife.com/soy-sauce-eggs/", sourceName: "The Woks of Life" },
  "home-garlic-pak-choi": { image: IMG.veg, sourceUrl: "https://thewoksoflife.com/garlic-bok-choy/", sourceName: "The Woks of Life" },
  "home-egg-drop-soup": { image: IMG.soup, sourceUrl: "https://thewoksoflife.com/egg-drop-soup/", sourceName: "The Woks of Life" },
  "home-congee-ginger": { image: IMG.bowl, sourceUrl: "https://thewoksoflife.com/rice-congee/", sourceName: "The Woks of Life" },
  "home-tofu-scramble": { image: IMG.tofu, sourceUrl: "https://thewoksoflife.com/silken-tofu-with-century-egg/", sourceName: "The Woks of Life" },
  "home-chicken-veg-stirfry": { image: IMG.chicken, sourceUrl: "https://thewoksoflife.com/chicken-broccoli-stir-fry/", sourceName: "The Woks of Life" },
  "home-tomato-egg-soup": { image: IMG.soup, sourceUrl: "https://thewoksoflife.com/tomato-egg-drop-soup/", sourceName: "The Woks of Life" },
  "home-milk-french-toast": { image: IMG.breakfast, sourceUrl: "https://www.bbcgoodfood.com/recipes/easy-french-toast", sourceName: "BBC Good Food" },
  "home-cheese-toast": { image: IMG.toast, sourceUrl: "https://www.bbcgoodfood.com/recipes/cheese-toastie", sourceName: "BBC Good Food" },
  "home-luncheon-fried-rice": { image: IMG.friedRice, sourceUrl: "https://thewoksoflife.com/spam-fried-rice/", sourceName: "The Woks of Life" },
  "home-spam-eggs": { image: IMG.egg, sourceUrl: "https://thewoksoflife.com/spam-musubi/", sourceName: "The Woks of Life" },
  "home-shrimp-egg": { image: IMG.seafood, sourceUrl: "https://thewoksoflife.com/shrimp-and-eggs/", sourceName: "The Woks of Life" },
  "home-garlic-shrimp": { image: IMG.seafood, sourceUrl: "https://thewoksoflife.com/shrimp-with-lobster-sauce/", sourceName: "The Woks of Life" },
  "home-tuna-mayo-rice": { image: IMG.bowl, sourceUrl: "https://www.bbcgoodfood.com/recipes/tuna-mayonnaise", sourceName: "BBC Good Food" },
  "home-mapo-tofu-simple": { image: IMG.tofu, sourceUrl: "https://thewoksoflife.com/mapo-tofu/", sourceName: "The Woks of Life" },
  "home-pork-mince-noodles": { image: IMG.noodles, sourceUrl: "https://thewoksoflife.com/zhajiangmian/", sourceName: "The Woks of Life" },
  "home-oyster-gai-lan": { image: IMG.veg, sourceUrl: "https://thewoksoflife.com/chinese-broccoli-with-oyster-sauce/", sourceName: "The Woks of Life" },
  "home-broccoli-garlic": { image: IMG.veg, sourceUrl: "https://thewoksoflife.com/garlic-broccoli/", sourceName: "The Woks of Life" },
  "home-cabbage-stirfry": { image: IMG.veg, sourceUrl: "https://thewoksoflife.com/stir-fried-cabbage/", sourceName: "The Woks of Life" },
  "home-potato-stirfry": { image: IMG.veg, sourceUrl: "https://thewoksoflife.com/suan-la-tu-dou-si/", sourceName: "The Woks of Life" },
  "home-egg-noodles-veg": { image: IMG.noodles, sourceUrl: "https://thewoksoflife.com/vegetable-lo-mein/", sourceName: "The Woks of Life" },
  "home-beef-tomato": { image: IMG.meat, sourceUrl: "https://thewoksoflife.com/tomato-beef-stir-fry/", sourceName: "The Woks of Life" },
  "home-pork-chop-rice": { image: IMG.meat, sourceUrl: "https://thewoksoflife.com/chinese-pork-chops/", sourceName: "The Woks of Life" },
  "home-bacon-egg-rice": { image: IMG.breakfast, sourceUrl: "https://www.bbcgoodfood.com/recipes/bacon-egg-fried-rice", sourceName: "BBC Good Food" },
  "home-kimchi-fried-rice": { image: IMG.friedRice, sourceUrl: "https://www.bbcgoodfood.com/recipes/kimchi-fried-rice", sourceName: "BBC Good Food" },
  "home-spinach-garlic": { image: IMG.veg, sourceUrl: "https://thewoksoflife.com/garlic-spinach/", sourceName: "The Woks of Life" },
  "home-mushroom-rice": { image: IMG.rice, sourceUrl: "https://thewoksoflife.com/mushroom-fried-rice/", sourceName: "The Woks of Life" },
  "home-cucumber-salad": { image: IMG.salad, sourceUrl: "https://thewoksoflife.com/smashed-cucumber-salad/", sourceName: "The Woks of Life" },
  "home-carrot-egg": { image: IMG.egg, sourceUrl: "https://thewoksoflife.com/tomato-egg-stir-fry/", sourceName: "The Woks of Life" },
  "home-sweet-potato-boil": { image: IMG.bowl, sourceUrl: "https://www.bbcgoodfood.com/recipes/collection/sweet-potato-recipes", sourceName: "BBC Good Food" },
  "home-avocado-toast": { image: IMG.toast, sourceUrl: "https://www.bbcgoodfood.com/recipes/smashed-avocado-toast", sourceName: "BBC Good Food" },
  "home-yogurt-bowl": { image: IMG.breakfast, sourceUrl: "https://www.bbcgoodfood.com/recipes/breakfast-smoothie-bowl", sourceName: "BBC Good Food" },
  "home-onion-egg": { image: IMG.egg, sourceUrl: "https://thewoksoflife.com/tomato-egg-stir-fry/", sourceName: "The Woks of Life" },
  "home-bell-pepper-egg": { image: IMG.egg, sourceUrl: "https://thewoksoflife.com/stir-fried-peppers/", sourceName: "The Woks of Life" },
  "home-leftover-fried-rice": { image: IMG.friedRice, sourceUrl: "https://thewoksoflife.com/egg-fried-rice/", sourceName: "The Woks of Life" },
  "home-salmon-ginger": { image: IMG.fish, sourceUrl: "https://thewoksoflife.com/steamed-fish/", sourceName: "The Woks of Life" },
  "home-white-fish-soy": { image: IMG.fish, sourceUrl: "https://thewoksoflife.com/chinese-steamed-fish/", sourceName: "The Woks of Life" },
  "home-beans-tomato": { image: IMG.stew, sourceUrl: "https://www.bbcgoodfood.com/recipes/tomato-bean-soup", sourceName: "BBC Good Food" },
  "home-hk-macaroni": { image: IMG.pasta, sourceUrl: "https://thewoksoflife.com/hong-kong-style-macaroni-soup/", sourceName: "The Woks of Life" },
  "home-spring-onion-noodles": { image: IMG.noodles, sourceUrl: "https://thewoksoflife.com/scallion-oil-noodles/", sourceName: "The Woks of Life" },
  "home-cold-soy-tofu": { image: IMG.tofu, sourceUrl: "https://thewoksoflife.com/silken-tofu-with-century-egg/", sourceName: "The Woks of Life" },
  "home-tomato-egg-noodles": { image: IMG.noodles, sourceUrl: "https://thewoksoflife.com/tomato-egg-noodles/", sourceName: "The Woks of Life" },
  "home-chinese-sausage-rice": { image: IMG.rice, sourceUrl: "https://thewoksoflife.com/lap-cheong-rice/", sourceName: "The Woks of Life" },
  "home-egg-mayo-toast": { image: IMG.toast, sourceUrl: "https://www.bbcgoodfood.com/recipes/egg-mayonnaise", sourceName: "BBC Good Food" },
  "home-soy-chicken-thigh": { image: IMG.chicken, sourceUrl: "https://thewoksoflife.com/soy-sauce-chicken/", sourceName: "The Woks of Life" },
  "home-silken-tofu-savory": { image: IMG.tofu, sourceUrl: "https://thewoksoflife.com/silken-tofu-with-century-egg/", sourceName: "The Woks of Life" },
  "home-bean-sprout-stirfry": { image: IMG.veg, sourceUrl: "https://thewoksoflife.com/stir-fried-bean-sprouts/", sourceName: "The Woks of Life" },
  "home-milk-egg-custard": { image: IMG.egg, sourceUrl: "https://thewoksoflife.com/chinese-steamed-eggs/", sourceName: "The Woks of Life" },
  "home-slippery-egg-chicken": { image: IMG.chicken, sourceUrl: "https://thewoksoflife.com/slippery-egg-beef/", sourceName: "The Woks of Life" },
  "home-tofu-choi-braise": { image: IMG.tofu, sourceUrl: "https://thewoksoflife.com/braised-tofu/", sourceName: "The Woks of Life" },
  "home-chicken-tomato-skillet": { image: IMG.chicken, sourceUrl: "https://thewoksoflife.com/tomato-chicken/", sourceName: "The Woks of Life" },
  "home-instant-noodles-spam-egg": { image: IMG.noodles, sourceUrl: "https://thewoksoflife.com/instant-ramen-hacks/", sourceName: "The Woks of Life" },
  "home-spam-egg-toast": { image: IMG.toast, sourceUrl: "https://thewoksoflife.com/spam-musubi/", sourceName: "The Woks of Life" },
  "home-century-egg-pork-congee": { image: IMG.bowl, sourceUrl: "https://thewoksoflife.com/century-egg-pork-congee/", sourceName: "The Woks of Life" },
  "home-vermicelli-veg-soup": { image: IMG.soup, sourceUrl: "https://thewoksoflife.com/rice-noodle-soup/", sourceName: "The Woks of Life" },
  "home-sausage-egg-skillet-rice": { image: IMG.friedRice, sourceUrl: "https://thewoksoflife.com/lap-cheong-fried-rice/", sourceName: "The Woks of Life" },
  "home-pork-cabbage-stirfry": { image: IMG.meat, sourceUrl: "https://thewoksoflife.com/pork-cabbage-stir-fry/", sourceName: "The Woks of Life" },
  "home-chicken-bean-sprout": { image: IMG.chicken, sourceUrl: "https://thewoksoflife.com/chicken-bean-sprouts/", sourceName: "The Woks of Life" },
  "home-chicken-broccoli-stirfry": { image: IMG.chicken, sourceUrl: "https://thewoksoflife.com/chicken-broccoli-stir-fry/", sourceName: "The Woks of Life" },
  "home-pork-choi-sum": { image: IMG.meat, sourceUrl: "https://thewoksoflife.com/pork-stir-fry/", sourceName: "The Woks of Life" },
  "home-tofu-pak-choi": { image: IMG.tofu, sourceUrl: "https://thewoksoflife.com/tofu-bok-choy/", sourceName: "The Woks of Life" },
  "home-eggplant-garlic-soy": { image: IMG.veg, sourceUrl: "https://thewoksoflife.com/chinese-eggplant-garlic-sauce/", sourceName: "The Woks of Life" },
  "home-snow-pea-garlic": { image: IMG.veg, sourceUrl: "https://thewoksoflife.com/garlic-snow-pea-shoots/", sourceName: "The Woks of Life" },
  "home-zucchini-egg-scramble": { image: IMG.egg, sourceUrl: "https://www.bbcgoodfood.com/recipes/courgette-frittata", sourceName: "BBC Good Food" },
  "home-celery-pork-stirfry": { image: IMG.meat, sourceUrl: "https://thewoksoflife.com/celery-and-meatball-stir-fry/", sourceName: "The Woks of Life" },
  "home-sweet-corn-egg-soup": { image: IMG.soup, sourceUrl: "https://thewoksoflife.com/chinese-corn-soup/", sourceName: "The Woks of Life" },
  "home-mushroom-tofu-soup": { image: IMG.soup, sourceUrl: "https://thewoksoflife.com/hot-and-sour-soup/", sourceName: "The Woks of Life" },
  "home-leftover-noodle-toss": { image: IMG.noodles, sourceUrl: "https://thewoksoflife.com/lo-mein/", sourceName: "The Woks of Life" },
  "home-tomato-macaroni-soup": { image: IMG.pasta, sourceUrl: "https://thewoksoflife.com/hong-kong-style-macaroni-soup/", sourceName: "The Woks of Life" },
  "home-oyster-chicken-greens": { image: IMG.chicken, sourceUrl: "https://thewoksoflife.com/oyster-sauce-chicken/", sourceName: "The Woks of Life" },
  "home-stirfried-rice-vermicelli": { image: IMG.noodles, sourceUrl: "https://thewoksoflife.com/singapore-noodles/", sourceName: "The Woks of Life" },
  "home-egg-lettuce-rice": { image: IMG.bowl, sourceUrl: "https://thewoksoflife.com/egg-fried-rice/", sourceName: "The Woks of Life" },
}

/** Merge media onto a recipe when the authoring object omitted it. */
export function enrichRecipe(recipe: Recipe): Recipe {
  const media = RECIPE_MEDIA[recipe.id]
  if (!media) return recipe
  return {
    ...recipe,
    image: recipe.image || media.image,
    sourceUrl: recipe.sourceUrl || media.sourceUrl,
    sourceName: recipe.sourceName || media.sourceName,
  }
}

export function hasRecipeSource(recipe: Recipe) {
  return Boolean(recipe.sourceUrl)
}
