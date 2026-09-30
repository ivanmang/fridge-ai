import type { Recipe } from "@/lib/recipes"

/** Auto-built cookable classics — original outlines, searchable names. */
export const MORE_W2G: Recipe[] = [
  {
    id: "home-kimchi-jjigae",
    name: "Kimchi jjigae",
    cuisine: "Korean",
    time: 30,
    servings: 2,
    need: ["Kimchi", "Pork chops", "Tofu"],
    optional: ["Garlic", "Ginger", "Gochujang", "Spring onion", "Onion"],
    steps: [
      "Sauté chopped kimchi with sliced pork until pork is cooked through (74°C / 165°F).",
      "Add water to cover, optional gochujang and garlic; simmer 10 minutes.",
      "Add tofu slabs; simmer 5 more minutes. Finish with spring onion.",
    ],
    zh: {
      name: "泡菜鍋",
      steps: [
        "泡菜切段與豬片同炒至肉全熟（74°C）。",
        "加水蓋過，可加韓式辣椒醬和蒜，炆 10 分鐘。",
        "下豆腐塊再炆 5 分鐘，撒蔥。",
      ],
    },
  },
  {
    id: "home-doenjang-jjigae",
    name: "Doenjang jjigae (home)",
    cuisine: "Korean",
    time: 25,
    servings: 2,
    need: ["Doenjang", "Tofu", "Zucchini"],
    optional: ["Mushroom", "Garlic", "Onion", "Spring onion", "Chili oil"],
    steps: [
      "Dissolve 1–2 tbsp doenjang in 3 cups simmering water.",
      "Add zucchini, mushroom, onion, and tofu; simmer 8–10 minutes.",
      "Finish with garlic and spring onion.",
    ],
    zh: {
      name: "大醬湯",
      steps: [
        "1 至 2 湯匙大醬化入 3 杯熱水。",
        "下翠玉瓜、蘑菇、洋蔥和豆腐，炆 8 至 10 分鐘。",
        "加蒜蓉和蔥花。",
      ],
    },
  },
  {
    id: "home-bulgogi-beef",
    name: "Bulgogi beef (pan)",
    cuisine: "Korean",
    time: 25,
    servings: 2,
    need: ["Beef steak", "Onion", "Kimchi", "Bread"],
    optional: ["Soy sauce", "Sugar", "Garlic", "Sesame oil", "Spring onion", "Sesame seeds", "Ginger", "White pepper", "Cooking oil"],
    steps: [
      "Slice beef thin; marinate 10 minutes in 2 tbsp soy sauce, 1 tsp sugar, garlic, and sesame oil.",
      "Stir-fry onion, then beef on high until just cooked, 3–5 minutes.",
      "Finish with spring onion and sesame seeds.",
    ],
    zh: {
      name: "韓式烤肉",
      steps: [
        "牛肉切薄片，用 2 湯匙生抽、1 茶匙糖、蒜和麻油醃 10 分鐘。",
        "先炒洋蔥，再大火炒牛肉 3 至 5 分鐘至刚熟。",
        "撒蔥和芝麻。",
      ],
    },
  },
  {
    id: "home-spicy-pork-bulgogi",
    name: "Spicy pork bulgogi",
    cuisine: "Korean",
    time: 25,
    servings: 2,
    need: ["Pork chops", "Onion", "Gochujang"],
    optional: ["Soy sauce", "Sugar", "Garlic", "Sesame oil", "Spring onion", "Bell pepper"],
    steps: [
      "Slice pork; toss with 1 tbsp gochujang, 1 tbsp soy sauce, garlic, and a pinch of sugar.",
      "Stir-fry until cooked through (74°C / 165°F), about 6–8 minutes.",
      "Add onion/pepper strips; finish with sesame oil and spring onion.",
    ],
    zh: {
      name: "辣炒豬肉",
      steps: [
        "豬片加 1 湯匙韓式辣椒醬、1 湯匙生抽、蒜和少許糖拌匀。",
        "炒至全熟（74°C），約 6 至 8 分鐘。",
        "下洋蔥／燈籠椒絲，淋麻油撒蔥。",
      ],
    },
  },
  {
    id: "home-korean-egg-roll",
    name: "Korean egg roll",
    cuisine: "Korean",
    time: 15,
    servings: 2,
    need: ["Eggs", "Carrots", "Chicken breast"],
    optional: ["Spring onion", "Salt", "Ham", "Cooking oil", "Garlic", "Sugar", "Five-spice powder", "White pepper", "Hoisin sauce", "Soy sauce", "Sesame oil", "Sesame seeds"],
    steps: [
      "Beat 3 eggs with a pinch of salt; add finely diced carrot and spring onion (ham optional).",
      "Pour a thin layer into an oiled pan; roll as it sets, adding more egg in stages.",
      "Slice into bite-size pieces.",
    ],
    zh: {
      name: "韓式蛋卷",
      steps: [
        "3 隻蛋加少許鹽打散，拌紅蘿蔔粒和蔥花（可加火腿）。",
        "薄油鑊倒入一層蛋液，邊凝固邊捲，分次倒蛋。",
        "切段上碟。",
      ],
    },
  },
  {
    id: "home-seaweed-soup",
    name: "Seaweed soup",
    cuisine: "Korean",
    time: 20,
    servings: 2,
    need: ["Nori", "Beef steak", "Shrimp", "Eggs", "Cabbage", "Pork chops"],
    optional: ["Garlic", "Soy sauce", "Sesame oil", "Spring onion", "Salt", "Cornstarch", "Cooking oil", "Chicken stock"],
    steps: [
      "Soak nori briefly if needed; sauté sliced beef with sesame oil and garlic until browned.",
      "Add 3 cups water and nori; simmer 10 minutes.",
      "Season with soy sauce; finish with spring onion. Beef should be cooked through.",
    ],
    zh: {
      name: "海帶湯",
      steps: [
        "紫菜如需要先略浸；牛肉片加麻油蒜蓉炒香。",
        "加 3 杯水和紫菜炆 10 分鐘。",
        "生抽調味，撒蔥；牛肉須全熟。",
      ],
    },
  },
  {
    id: "home-bibimbap",
    name: "Bibimbap (home bowl)",
    cuisine: "Korean",
    time: 30,
    servings: 2,
    need: ["Cooked rice", "Eggs", "Spinach", "Carrots", "Ground beef", "Bread"],
    optional: ["Bean sprouts", "Soy sauce", "Sesame oil", "Gochujang", "Garlic", "Zucchini", "Salt", "Cooking oil"],
    steps: [
      "Sauté spinach, carrot matchsticks, and bean sprouts separately with garlic and a drop of sesame oil.",
      "Fry an egg sunny-side up. Arrange veg over hot rice.",
      "Top with egg, sesame oil, and gochujang to taste; mix before eating.",
    ],
    zh: {
      name: "拌飯",
      steps: [
        "菠菜、紅蘿蔔絲、芽菜分別加蒜和少許麻油炒熟。",
        "煎太陽蛋。熱飯上擺蔬菜。",
        "放蛋、麻油和適量韓式辣椒醬，食前拌匀。",
      ],
    },
  },
  {
    id: "home-tteokbokki",
    name: "Tteokbokki (home)",
    cuisine: "Korean",
    time: 25,
    servings: 2,
    need: ["Rice cakes", "Gochujang"],
    optional: ["Cabbage", "Soy sauce", "Sugar", "Garlic", "Spring onion", "Eggs"],
    steps: [
      "Soak rice cakes in warm water 5–10 minutes if hard.",
      "Simmer 1½ cups water with 1–2 tbsp gochujang, 1 tsp soy sauce, and 1 tsp sugar.",
      "Add rice cakes (and cabbage strips); cook until soft and sauce thick, 6–8 minutes. Optional boiled egg.",
    ],
    zh: {
      name: "辣炒年糕",
      steps: [
        "年糕如硬先浸溫水 5 至 10 分鐘。",
        "1½ 杯水加 1 至 2 湯匙韓式辣椒醬、1 茶匙生抽和糖煮開。",
        "下年糕（可加椰菜絲）煮 6 至 8 分鐘至軟醬稠，可加鹵蛋。",
      ],
    },
  },
  {
    id: "home-kongnamul-muchim",
    name: "Kongnamul muchim",
    cuisine: "Korean",
    time: 12,
    servings: 2,
    need: ["Bean sprouts", "Garlic"],
    optional: ["Sesame oil", "Sesame seeds", "Salt", "Spring onion", "Soy sauce"],
    steps: [
      "Blanch bean sprouts 1–2 minutes; drain and cool.",
      "Toss with minced garlic, sesame oil, a pinch of salt or soy sauce, and sesame seeds.",
      "Finish with spring onion.",
    ],
    zh: {
      name: "豆芽涼拌",
      steps: [
        "豆芽焯 1 至 2 分鐘，瀝乾放涼。",
        "拌蒜蓉、麻油、少許鹽或生抽和芝麻。",
        "撒蔥花。",
      ],
    },
  },
  {
    id: "home-korean-cucumber-salad",
    name: "Korean cucumber salad",
    cuisine: "Korean",
    time: 10,
    servings: 2,
    need: ["Cucumber", "Garlic", "Bread", "Carrots"],
    optional: ["Gochujang", "Soy sauce", "Vinegar", "Sugar", "Sesame oil", "Sesame seeds", "Onion", "Salt", "Spring onion"],
    steps: [
      "Smash and slice cucumber; salt 5 minutes and drain.",
      "Mix garlic, 1 tsp gochujang or chili, vinegar, soy sauce, and sugar.",
      "Toss with sesame oil and sesame seeds.",
    ],
    zh: {
      name: "韓式拍青瓜",
      steps: [
        "拍開青瓜切片，醃鹽 5 分鐘瀝乾。",
        "調蒜蓉、1 茶匙韓式辣椒醬或辣椒、醋、生抽和糖。",
        "拌麻油和芝麻。",
      ],
    },
  },
  {
    id: "home-sundubu-jjigae",
    name: "Soft tofu stew (sundubu)",
    cuisine: "Korean",
    time: 25,
    servings: 2,
    need: ["Silken tofu", "Eggs", "Gochujang"],
    optional: ["Ground pork", "Garlic", "Kimchi", "Spring onion", "Soy sauce"],
    steps: [
      "Sauté optional ground pork and kimchi until pork is cooked through (74°C / 165°F).",
      "Add water, gochujang, and garlic; bring to a simmer. Add silken tofu in chunks.",
      "Crack an egg on top; cook until white sets. Finish with spring onion.",
    ],
    zh: {
      name: "嫩豆腐鍋",
      steps: [
        "可先炒免治豬肉和泡菜至肉全熟（74°C）。",
        "加水、韓式辣椒醬和蒜煮滾，下嫩豆腐塊。",
        "打入一隻蛋至蛋白凝固，撒蔥。",
      ],
    },
  },
  {
    id: "home-soy-garlic-fried-chicken",
    name: "Soy garlic fried chicken (pan)",
    cuisine: "Korean",
    time: 30,
    servings: 2,
    need: ["Chicken thighs", "Garlic", "Soy sauce", "Bread", "Gochujang"],
    optional: ["Honey", "Sugar", "Sesame oil", "Sesame seeds", "Cornstarch", "Ginger", "Cooking oil", "Shallot", "Vinegar", "Spring onion"],
    steps: [
      "Coat chicken pieces lightly in cornstarch; pan-fry until golden and 74°C / 165°F inside.",
      "In a small pan, simmer 2 tbsp soy sauce, minced garlic, and 1 tsp honey until glossy.",
      "Toss chicken in glaze; finish with sesame seeds.",
    ],
    zh: {
      name: "蒜香炸雞風",
      steps: [
        "雞件薄沾生粉，煎至金黃、中心 74°C。",
        "小鍋煮 2 湯匙生抽、蒜蓉和 1 茶匙蜜糖至亮澤。",
        "雞件拌汁，撒芝麻。",
      ],
    },
  },
]
