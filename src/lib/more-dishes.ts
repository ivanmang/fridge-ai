import type { Recipe } from "@/lib/recipes"

/** Tested, kitchen-sized recipes surfaced ahead of the imported catalogue. */
export const MORE: Recipe[] = [
  {
    id: "home-tomato-egg-rice", name: "Tomato & egg rice", cuisine: "Hong Kong", time: 20, servings: 2,
    need: ["Tomato", "Eggs", "Cooked rice"], optional: ["Spring onion", "Soy sauce"],
    steps: [
      "Beat 2 eggs with a pinch of salt. Cut 2 tomatoes into wedges and loosen 2 bowls of cooked rice.",
      "Scramble the eggs in a hot, lightly oiled pan until just set; transfer to a plate.",
      "Cook the tomatoes with a splash of water for 3–4 minutes until saucy. Fold the eggs back in and spoon over hot rice.",
    ],
    zh: { name: "番茄炒蛋飯", steps: ["打散兩隻蛋，加少許鹽。切開兩個番茄，準備兩碗熟飯。", "熱鑊下油炒蛋至剛凝固，先盛起。", "番茄加少許水煮 3 至 4 分鐘，拌入雞蛋，鋪在熱飯上。"] },
  },
  {
    id: "home-ginger-chicken-rice", name: "Ginger chicken rice", cuisine: "Cantonese", time: 30, servings: 2,
    need: ["Chicken breast", "Rice", "Ginger"], optional: ["Spring onion", "Soy sauce"],
    steps: [
      "Cook 1 cup of rice. Slice 300 g chicken thinly, and cut a thumb of ginger into matchsticks.",
      "Cook chicken and ginger in a lightly oiled pan over medium heat, turning until the chicken is fully cooked through (74°C / 165°F).",
      "Add a splash of water and soy sauce if you have it. Serve over the rice with sliced spring onion.",
    ],
    zh: { name: "薑香雞飯", steps: ["煮一杯米。將約 300 克雞肉切薄片，薑切絲。", "熱鑊下油，中火炒薑和雞肉，煮至雞肉完全熟透（中心達 74°C）。", "加少許水和生抽，淋在飯上，可撒蔥花。"] },
  },
  {
    id: "home-garlic-greens", name: "Garlic greens", cuisine: "Cantonese", time: 12, servings: 2,
    need: ["Choi sum", "Garlic"], optional: ["Soy sauce"],
    steps: [
      "Wash and drain a bunch of choi sum. Cut the stems and leaves into bite-sized pieces; mince 2 garlic cloves.",
      "Heat a little oil in a pan. Stir-fry the stems for 2 minutes, then add the leaves and garlic.",
      "Cook 2–3 more minutes until the greens are tender. Add a splash of soy sauce if you like.",
    ],
    zh: { name: "蒜蓉菜心", steps: ["洗淨一束菜心，瀝乾後切段；拍碎兩瓣蒜。", "熱鑊下少許油，先炒菜莖兩分鐘，再加入菜葉和蒜蓉。", "再炒兩三分鐘至菜熟，按喜好加少許生抽。"] },
  },
  {
    id: "home-tofu-tomato", name: "Tomato tofu skillet", cuisine: "Chinese", time: 18, servings: 2,
    need: ["Tofu", "Tomato"], optional: ["Garlic", "Spring onion"],
    steps: [
      "Drain a block of tofu and cut into cubes. Chop 2 tomatoes; mince garlic if using.",
      "Cook the tomato and garlic in a lightly oiled pan for 5 minutes, adding a little water to make a sauce.",
      "Add tofu and simmer gently for 5 minutes. Season and finish with spring onion.",
    ],
    zh: { name: "番茄豆腐", steps: ["豆腐瀝乾切件，兩個番茄切塊；有蒜頭可切碎。", "熱鑊下油，煮番茄和蒜約五分鐘，加少許水煮成醬。", "加入豆腐，小火再煮五分鐘，調味後撒蔥花。"] },
  },
  {
    id: "home-egg-fried-rice", name: "Spring onion egg fried rice", cuisine: "Hong Kong", time: 15, servings: 2,
    need: ["Cooked rice", "Eggs", "Spring onion"], optional: ["Soy sauce", "Garlic"],
    steps: [
      "Break up 2 bowls of cold cooked rice. Beat 2 eggs and slice a few spring onions.",
      "Scramble the eggs in a hot oiled pan, then add the rice and toss until steaming hot throughout.",
      "Stir in spring onion and a splash of soy sauce; cook for another minute and serve hot.",
    ],
    zh: { name: "蔥花蛋炒飯", steps: ["將兩碗已煮熟的冷飯弄散，打散兩隻蛋，切蔥花。", "熱鑊下油先炒蛋，再加飯炒至整體熱透。", "加入蔥花和少許生抽，再炒一分鐘即可。"] },
  },
  {
    id: "home-steamed-eggs", name: "Silky steamed eggs", cuisine: "Cantonese", time: 18, servings: 2,
    need: ["Eggs"], optional: ["Spring onion", "Soy sauce"],
    steps: [
      "Beat 2 eggs gently with 1 cup of warm water and a pinch of salt. Strain into a shallow heatproof dish.",
      "Cover the dish loosely. Steam over gently simmering water for 10–12 minutes, until the center is just set.",
      "Rest for 2 minutes. Add a little soy sauce and spring onion if you like.",
    ],
    zh: { name: "蒸水蛋", steps: ["輕輕打散兩隻蛋，加入一杯暖水和少許鹽，過篩倒入碟。", "蓋好碟，用微滾水蒸約 10 至 12 分鐘，至中間剛凝固。", "焗兩分鐘，按喜好加少許生抽和蔥花。"] },
  },
  {
    id: "home-chicken-tofu-soup", name: "Chicken & tofu soup", cuisine: "Cantonese", time: 25, servings: 2,
    need: ["Chicken breast", "Tofu", "Ginger"], optional: ["Spring onion", "Choi sum"],
    steps: [
      "Slice 200 g chicken breast, cube half a block of tofu and slice a thumb of ginger.",
      "Bring 3 cups of water to a simmer with the ginger. Add the chicken and simmer until fully cooked through (74°C / 165°F).",
      "Add tofu and any greens for the last 5 minutes. Season lightly and serve hot.",
    ],
    zh: { name: "薑香雞肉豆腐湯", steps: ["將約 200 克雞胸切片、半盒豆腐切件、薑切片。", "三杯水加薑煮滾，加入雞肉煮至完全熟透（中心達 74°C）。", "最後五分鐘加入豆腐和菜，調味後趁熱吃。"] },
  },
  {
    id: "home-mushroom-omelet", name: "Mushroom omelet", cuisine: "Breakfast", time: 15, servings: 2,
    need: ["Eggs", "Mushroom"], optional: ["Spring onion", "Cheddar"],
    steps: [
      "Slice a handful of mushrooms and beat 3 eggs with a pinch of salt.",
      "Sauté mushrooms in a little oil for 4 minutes. Pour in the eggs and cook over medium-low heat.",
      "When nearly set, fold the omelet. Cook until the eggs are fully set and serve.",
    ],
    zh: { name: "蘑菇奄列", steps: ["切一把蘑菇，打散三隻蛋，加少許鹽。", "蘑菇下油炒約四分鐘，倒入蛋液，轉中小火煮。", "蛋快凝固時對摺，煮至全熟即可。"] },
  },
]

export const MORE_ZH: Record<string, string> = {
  "char-siu": "叉燒", "wonton-noodle": "雲吞麵", "brisket-noodle": "牛腩麵", "claypot-rice": "煲仔飯",
  "sweet-sour-pork": "咕嚕肉", "steamed-egg": "蒸水蛋", "hainan-chicken": "海南雞飯", "pork-chop-rice": "豬扒飯",
  "tomato-beef": "番茄牛肉", "kung-pao": "宮保雞丁", "dan-dan": "擔擔麵", "curry-rice": "咖喱飯",
  "gyudon": "牛丼", bibimbap: "拌飯", "pad-thai": "泰式炒河", pho: "越南河粉", carbonara: "卡邦尼",
  bolognese: "肉醬意粉", shakshuka: "北非蛋", "fried-chicken": "炸雞", steak: "煎牛扒", dumplings: "煎餃",
  laksa: "喇沙", "french-toast": "西多士", "mac-cheese": "芝士通粉", ramen: "醬油拉麵",
  "udon-stir": "炒烏冬", "green-curry": "青咖喱",
}
