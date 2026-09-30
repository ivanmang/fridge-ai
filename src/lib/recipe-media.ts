import type { Recipe } from "@/lib/recipes"

/** Unsplash CDN photo URL (licensed for free use; hotlink these specific IDs). */
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`

/**
 * Stable category photos. Register a better per-id URL in RECIPE_IMAGES when you
 * want a closer match; new home-* recipes fall back via {@link inferRecipeImage}.
 */
export const IMG = {
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
  potato: u("1518977676601-b53f82aba655"),
} as const

export type ImageCategory = keyof typeof IMG

/**
 * Explicit id → image map for the cookable `home-*` book.
 * Additive only — do not put recipe text here. Wave/growth agents can keep
 * editing more-dishes*; register a photo with one line here (or rely on infer).
 */
export const RECIPE_IMAGES: Record<string, string> = {
  "home-avocado-toast": IMG.toast,
  "home-bacon-egg-rice": IMG.friedRice,
  "home-bacon-pasta": IMG.pasta,
  "home-baked-eggs-spinach": IMG.breakfast,
  "home-bean-sprout-stirfry": IMG.veg,
  "home-bean-tomato-stew": IMG.stew,
  "home-beef-broccoli": IMG.meat,
  "home-beef-snow-peas": IMG.meat,
  "home-beef-tomato-noodles": IMG.noodles,
  "home-bell-pepper-beef": IMG.meat,
  "home-braised-tofu-chicken": IMG.tofu,
  "home-cabbage-stirfry": IMG.veg,
  "home-carrot-egg-stirfry": IMG.egg,
  "home-cauliflower-stirfry": IMG.veg,
  "home-celery-pork": IMG.meat,
  "home-century-egg-congee": IMG.bowl,
  "home-century-egg-tofu": IMG.tofu,
  "home-cheese-omelette": IMG.egg,
  "home-chicken-broccoli": IMG.chicken,
  "home-chicken-carbonara": IMG.pasta,
  "home-chicken-corn-soup": IMG.soup,
  "home-chicken-mushroom": IMG.chicken,
  "home-chicken-mushroom-tofu": IMG.tofu,
  "home-chicken-salad": IMG.salad,
  "home-chicken-veg-soup": IMG.soup,
  "home-chinese-sausage-rice": IMG.friedRice,
  "home-chow-mein": IMG.noodles,
  "home-claypot-style-rice": IMG.rice,
  "home-congee": IMG.bowl,
  "home-corn-egg-scramble": IMG.egg,
  "home-cucumber-egg": IMG.egg,
  "home-egg-drop-soup": IMG.soup,
  "home-egg-foo-young": IMG.egg,
  "home-egg-fried-rice": IMG.friedRice,
  "home-egg-mayo-sandwich": IMG.toast,
  "home-french-toast": IMG.toast,
  "home-fu-yung-egg-lkk": IMG.egg,
  "home-garlic-broccoli": IMG.veg,
  "home-garlic-choi-sum": IMG.veg,
  "home-garlic-eggplant": IMG.veg,
  "home-garlic-pak-choi": IMG.veg,
  "home-garlic-shrimp": IMG.seafood,
  "home-garlic-spinach": IMG.veg,
  "home-ginger-chicken": IMG.chicken,
  "home-ginger-fried-rice": IMG.friedRice,
  "home-grilled-cheese": IMG.toast,
  "home-ham-cheese-toastie": IMG.toast,
  "home-hk-macaroni-soup": IMG.soup,
  "home-honey-garlic-chicken": IMG.chicken,
  "home-hot-sour-soup": IMG.soup,
  "home-instant-noodles-egg": IMG.noodles,
  "home-jacket-potato-tuna": IMG.potato,
  "home-kimchi-fried-rice": IMG.friedRice,
  "home-leftover-fried-rice": IMG.friedRice,
  "home-lemon-chicken": IMG.chicken,
  "home-lo-mein": IMG.noodles,
  "home-luncheon-fried-rice": IMG.friedRice,
  "home-mapo-tofu": IMG.tofu,
  "home-mushroom-egg-rice": IMG.friedRice,
  "home-mushroom-pasta": IMG.pasta,
  "home-omelette-rice": IMG.friedRice,
  "home-orange-chicken": IMG.chicken,
  "home-oyster-gai-lan": IMG.veg,
  "home-oyster-lettuce": IMG.veg,
  "home-oyster-tofu": IMG.tofu,
  "home-pan-fried-rice-noodles": IMG.noodles,
  "home-pancakes-simple": IMG.breakfast,
  "home-pork-cabbage": IMG.meat,
  "home-pork-chop-onion": IMG.meat,
  "home-pork-mince-noodles": IMG.noodles,
  "home-potato-chicken": IMG.chicken,
  "home-potato-stirfry": IMG.veg,
  "home-salmon-broccoli-pasta": IMG.pasta,
  "home-salmon-rice-bowl": IMG.fish,
  "home-salt-pepper-tofu": IMG.tofu,
  "home-sausage-egg-noodles": IMG.noodles,
  "home-sausage-pasta": IMG.pasta,
  "home-scallion-noodles": IMG.noodles,
  "home-scrambled-egg-toast": IMG.toast,
  "home-sesame-garlic-chicken-pasta": IMG.pasta,
  "home-shrimp-broccoli": IMG.seafood,
  "home-shrimp-egg": IMG.seafood,
  "home-shrimp-noodle-soup": IMG.soup,
  "home-shrimp-pasta": IMG.pasta,
  "home-singapore-noodles": IMG.noodles,
  "home-slippery-egg-chicken": IMG.chicken,
  "home-smashed-cucumber": IMG.salad,
  "home-soy-chicken": IMG.chicken,
  "home-soy-steamed-fish": IMG.fish,
  "home-spinach-tofu-soup": IMG.soup,
  "home-steamed-egg-pork": IMG.egg,
  "home-steamed-eggs": IMG.egg,
  "home-steamed-fish": IMG.fish,
  "home-steamed-pork-patty": IMG.meat,
  "home-steamed-tofu-pork": IMG.tofu,
  "home-stir-fried-bok-choy": IMG.veg,
  "home-sweet-potato-rice": IMG.rice,
  "home-tofu-shrimp": IMG.tofu,
  "home-tomato-beef": IMG.meat,
  "home-tomato-egg": IMG.egg,
  "home-tomato-egg-noodles": IMG.noodles,
  "home-tomato-egg-rice": IMG.egg,
  "home-tomato-soup": IMG.soup,
  "home-tomato-tofu": IMG.tofu,
  "home-tomato-tofu-soup": IMG.soup,
  "home-tuna-fried-rice": IMG.friedRice,
  "home-tuna-pasta": IMG.pasta,
  "home-west-lake-beef-soup": IMG.soup,
  "home-yogurt-berry-bowl": IMG.breakfast,
  "home-zucchini-egg": IMG.egg,
}

/** Keyword → category for unmapped / newly added home recipes (500+ scale). */
const INFER_RULES: { re: RegExp; key: ImageCategory }[] = [
  { re: /eggplant|aubergine/, key: "veg" },
  { re: /tofu|mapo|豆腐/, key: "tofu" },
  { re: /congee|porridge|粥/, key: "bowl" },
  { re: /soup|stew|broth|汤|湯/, key: "soup" },
  { re: /noodle|mein|pasta|macaroni|udon|ramen|麵|面/, key: "noodles" },
  { re: /fried.?rice|炒飯|炒饭/, key: "friedRice" },
  { re: /toast|sandwich|toastie/, key: "toast" },
  { re: /pancake|yogurt|granola|breakfast/, key: "breakfast" },
  { re: /salad|cucumber|生菜/, key: "salad" },
  { re: /fish|salmon|鳕|魚|鱼/, key: "fish" },
  { re: /shrimp|prawn|scallop|海鮮|海鲜/, key: "seafood" },
  { re: /chicken|雞|鸡/, key: "chicken" },
  { re: /beef|pork|bacon|sausage|ham|肉|豬|牛/, key: "meat" },
  { re: /potato|jacket/, key: "potato" },
  { re: /egg|omelette|煎蛋|蒸蛋/, key: "egg" },
  { re: /broccoli|cabbage|spinach|lettuce|choi|bok|gai.?lan|greens|vegetable|菜/, key: "veg" },
  { re: /rice|飯|饭/, key: "rice" },
]

/** Infer a category photo from dish name / id / ingredients. */
export function inferRecipeImage(recipe: Pick<Recipe, "id" | "name" | "need" | "zh">): string {
  const hay = [recipe.id, recipe.name, recipe.zh?.name ?? "", ...(recipe.need ?? [])]
    .join(" ")
    .toLowerCase()
  for (const { re, key } of INFER_RULES) {
    if (re.test(hay)) return IMG[key]
  }
  return IMG.platter
}

/** Resolve the display image for a recipe (inline → map → infer). */
export function recipeImage(recipe: Recipe): string {
  if (recipe.image?.startsWith("https://") || recipe.image?.startsWith("/")) {
    return recipe.image
  }
  return RECIPE_IMAGES[recipe.id] ?? inferRecipeImage(recipe)
}

/** Merge a stored/inferred photo onto a recipe without clobbering inline fields. */
export function enrichRecipe(recipe: Recipe): Recipe {
  if (recipe.image) return recipe
  const image = RECIPE_IMAGES[recipe.id] ?? (recipe.id.startsWith("home-") ? inferRecipeImage(recipe) : undefined)
  if (!image) return recipe
  return { ...recipe, image }
}

export function hasRecipeImage(recipe: Recipe): boolean {
  return Boolean(recipe.image || RECIPE_IMAGES[recipe.id] || recipe.id.startsWith("home-"))
}
