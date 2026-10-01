import type { Recipe } from "@/lib/recipes"

/** Leftover clearers — Theme C. */
export const MORE_W1C: Recipe[] = [
  {
    id: "home-leftover-noodle-toss",
    name: "Leftover veg noodle toss",
    cuisine: "Hong Kong",
    time: 15,
    servings: 2,
    need: ["Cooked leftovers", "Noodles"],
    optional: ["Soy sauce", "Garlic", "Cooking oil", "Onion", "Spring onion", "Sesame oil"],
    steps: [
      "Cook 200 g noodles until just tender; drain. Dice about 2 cups of cooked leftovers into bite-sized pieces.",
      "Warm 1 tbsp oil in a pan; add minced garlic if using, then the leftovers. Stir until steaming hot throughout—any leftover meat must reach 74°C / 165°F.",
      "Toss with the noodles, 1–2 tbsp soy sauce, a drop of sesame oil, and spring onion. Serve at once.",
    ],
    zh: {
      name: "隔夜菜拌麵",
      steps: [
        "煮約 200 克麵至剛好熟，瀝乾。約兩杯隔夜菜切成小件。",
        "熱鑊下約 1 湯匙油，可下蒜蓉，再下隔夜菜炒至冒煙熱透——有肉須達 74°C。",
        "拌入麵條、1 至 2 湯匙生抽、少許麻油和蔥花，即食。",
      ],
    },
  },
  {
    id: "home-clearout-egg-drop",
    name: "Clear-out egg drop soup",
    cuisine: "Chinese",
    time: 15,
    servings: 2,
    need: ["Cooked leftovers", "Eggs"],
    optional: ["Cooking oil", "Onion", "Spring onion", "Sesame oil", "Ginger", "Soy sauce", "White pepper", "Cornstarch", "Chicken stock", "Salt", "Sugar"],
    steps: [
      "Bring 4 cups of water to a simmer with a few ginger slices if using. Dice 1½ cups of cooked leftovers.",
      "Add leftovers and simmer 3–5 minutes until steaming hot; any leftover meat must reach 74°C / 165°F. Beat 2 eggs.",
      "Stir the pot in a circle and slowly pour in the eggs to make ribbons. Season lightly; finish with spring onion and a drop of sesame oil.",
    ],
    zh: {
      name: "清櫃蛋花湯",
      steps: [
        "煮滾約 4 杯水，可加幾片薑。約 1½ 杯隔夜菜切粒。",
        "下隔夜菜煮 3 至 5 分鐘至熱透，有肉須達 74°C。打散兩隻蛋。",
        "湯水轉圈攪動，慢慢倒下蛋液成蛋花；調味，加蔥花和少許麻油。",
      ],
    },
  },
  {
    id: "home-leftover-chicken-congee",
    name: "Leftover chicken congee",
    cuisine: "Cantonese",
    time: 45,
    servings: 2,
    need: ["Rice", "Chicken breast", "Onion", "Cilantro"],
    optional: ["Sand ginger", "Cornstarch", "Oyster sauce", "Chicken stock", "Cooking oil", "Salt"],
    steps: [
      "Rinse ½ cup raw rice. Slice 4–5 thin pieces of ginger. Shred about 1 cup of cooked leftovers (chicken or other).",
      "Simmer rice with 5–6 cups water and ginger 30–35 minutes, stirring often, until creamy.",
      "Stir in leftovers and cook until steaming hot—meat must reach 74°C / 165°F. Season with white pepper, soy sauce, spring onion, and sesame oil.",
    ],
    zh: {
      name: "隔夜雞粥",
      steps: [
        "洗淨半杯米。薑切 4 至 5 薄片。約 1 杯隔夜菜（雞肉等）撕絲。",
        "米加 5 至 6 杯水和薑煮 30 至 35 分鐘，不時攪拌至綿滑。",
        "拌入隔夜菜煮至熱透，肉須達 74°C。加白胡椒、生抽、蔥花和麻油。",
      ],
    },
  },
  {
    id: "home-fridge-fried-noodles",
    name: "Fridge fried noodles",
    cuisine: "Hong Kong",
    time: 18,
    servings: 2,
    need: ["Noodles", "Onion", "Carrots", "Cabbage", "Bean sprouts", "Chicken thighs"],
    optional: ["Cooking oil", "Oyster sauce", "Cornstarch", "White pepper", "Soy sauce", "Sugar", "Chicken stock", "Sesame oil"],
    steps: [
      "Parboil 250 g noodles; drain well. Dice 2 cups of cooked leftovers; mince 2 garlic cloves if using.",
      "Heat a wok with 1–2 tbsp oil. Stir-fry leftovers and garlic until piping hot—leftover meat must hit 74°C / 165°F.",
      "Add noodles, 1–2 tbsp soy sauce (and oyster sauce if you like), toss until glossy and steaming. Finish with spring onion or bean sprouts.",
    ],
    zh: {
      name: "隔夜菜炒麵",
      steps: [
        "約 250 克麵略煮瀝乾。約兩杯隔夜菜切粒；有蒜可拍碎兩瓣。",
        "熱鑊下 1 至 2 湯匙油，炒隔夜菜和蒜至熱透，有肉須達 74°C。",
        "下麵、1 至 2 湯匙生抽（可加蠔油）炒至亮油冒煙，撒蔥花或芽菜。",
      ],
    },
  },
  {
    id: "home-leftover-steam-rice",
    name: "Rice cooker leftover steam plate",
    cuisine: "Hong Kong",
    time: 35,
    servings: 2,
    need: ["Cooked leftovers", "Cooked rice"],
    optional: ["Soy sauce", "Cooking oil", "Onion", "Spring onion", "Sesame oil", "Ginger"],
    steps: [
      "Rinse 1 cup rice and add water as usual in the rice cooker. Dice 1½–2 cups of cooked leftovers; slice a little ginger if using.",
      "When the rice is mid-cook (or after the cook cycle starts), nestle leftovers and ginger on top in a thin layer so steam can circulate.",
      "Finish the cycle until leftovers are steaming hot—any meat must reach 74°C / 165°F. Drizzle soy sauce and sesame oil; scatter spring onion.",
    ],
    zh: {
      name: "隔夜菜蒸飯",
      steps: [
        "洗 1 杯米，按常規加水放入飯煲。約 1½ 至 2 杯隔夜菜切粒，可加薑片。",
        "飯煮至中段（或開始煮後）把隔夜菜和薑薄薄鋪在米面，方便蒸氣流通。",
        "煮至隔夜菜熱透，有肉須達 74°C。淋生抽麻油，撒蔥花。",
      ],
    },
  },
  {
    id: "home-leftover-wrap",
    name: "Tortilla leftover wrap",
    cuisine: "Hong Kong",
    time: 12,
    servings: 2,
    need: ["Cooked leftovers", "Tortilla"],
    optional: ["Soy sauce", "Lettuce", "Mayonnaise", "Spring onion"],
    steps: [
      "Warm 2 tortillas in a dry pan 20–30 seconds each side. Dice about 1½ cups of cooked leftovers.",
      "Reheat leftovers in a lightly oiled pan until steaming hot—any leftover meat must reach 74°C / 165°F. Season with a splash of soy sauce if needed.",
      "Spread a thin layer of mayonnaise if using, add lettuce and leftovers, roll tightly, and slice in half.",
    ],
    zh: {
      name: "隔夜菜卷餅",
      steps: [
        "兩張墨西哥薄餅乾鑊各烙 20 至 30 秒。約 1½ 杯隔夜菜切粒。",
        "少許油把隔夜菜炒至熱透，有肉須達 74°C；可加少許生抽調味。",
        "可薄塗蛋黃醬，鋪生菜和隔夜菜，捲緊切半。",
      ],
    },
  },
  {
    id: "home-kimchi-leftover-stew",
    name: "Kimchi leftover stew",
    cuisine: "Korean",
    time: 25,
    servings: 2,
    need: ["Onion", "Garlic", "Pork chops", "Kimchi", "Gochugaru", "Gochujang", "Tofu", "Spring onion"],
    optional: ["Cooking oil", "Salt", "Sugar", "Chicken stock", "Sesame oil"],
    steps: [
      "Chop 1½ cups kimchi and 1½ cups cooked leftovers. Mince 2 garlic cloves if using; cube half a block of tofu if using.",
      "Simmer kimchi with 3 cups water (and garlic) 8–10 minutes. Add leftovers and tofu; cook until everything is steaming hot—meat must reach 74°C / 165°F.",
      "Season with a little soy sauce if needed. Crack in an egg to poach if you like; finish with spring onion.",
    ],
    zh: {
      name: "泡菜隔夜湯",
      steps: [
        "約 1½ 杯泡菜和 1½ 杯隔夜菜切件。有蒜可拍碎兩瓣；有豆腐可切半磚丁。",
        "泡菜加約 3 杯水（及蒜）煮 8 至 10 分鐘。下隔夜菜和豆腐煮至熱透，有肉須達 74°C。",
        "可加少許生抽；喜好可打入一隻蛋略煮，撒蔥花。",
      ],
    },
  },  {
    id: "home-soy-greens-rice",
    name: "Soy sauce leftover greens rice",
    cuisine: "Hong Kong",
    time: 12,
    servings: 2,
    need: ["Cooked leftovers", "Cooked rice", "Soy sauce"],
    optional: ["Eggs", "Garlic", "Cooking oil", "Onion", "Spring onion", "Sesame oil"],
    steps: [
      "Break up 2 bowls of cooked rice. Chop leafy or veggie leftovers into 2 cups of bite-sized pieces; mince garlic if using.",
      "Stir-fry leftovers (and garlic) until steaming hot—any leftover meat must reach 74°C / 165°F.",
      "Add rice and 1–2 tbsp soy sauce; toss until every grain is hot. Finish with sesame oil and spring onion; a fried egg on top is optional.",
    ],
    zh: {
      name: "醬油青菜飯",
      steps: [
        "兩碗熟飯搓散。隔夜菜約兩杯切小件；有蒜可切碎。",
        "炒隔夜菜（及蒜）至熱透，有肉須達 74°C。",
        "下飯和 1 至 2 湯匙生抽炒至全熱，加麻油蔥花；可另煎蛋蓋面。",
      ],
    },
  },]
