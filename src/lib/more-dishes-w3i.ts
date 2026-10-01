import type { Recipe } from "@/lib/recipes"

/**
 * Cantonese / home classics batch W3I — cookable searchable outlines only.
 * Shelf stand-ins noted in comments where specialty items are missing.
 */
export const MORE_W3I: Recipe[] = [
  {
    id: "home-pumpkin-spare-ribs",
    name: "Steamed spare ribs with pumpkin",
    cuisine: "Cantonese",
    time: 40,
    servings: 3,
    need: ["Fermented black beans", "Orange", "Spare ribs", "Spring onion", "Garlic"],
    optional: ["Cornstarch", "White pepper", "Cooking oil", "Salt", "Sugar", "Soy sauce", "Oyster sauce", "Shaoxing wine", "Sand ginger", "Sesame oil"],
    steps: [
      "Cut 500 g spare ribs into bite-size pieces; cube 400 g pumpkin. Toss ribs with 1 tbsp soy sauce, minced garlic/ginger, a pinch of sugar, and cornstarch if using.",
      "Layer pumpkin in a shallow heatproof dish; arrange ribs on top. Optional: scatter rinsed fermented black beans.",
      "Steam over high heat 25–30 minutes until ribs are cooked through and pumpkin is soft. Rest 2 minutes before serving.",
    ],
    zh: {
      name: "南瓜蒸排骨",
      steps: [
        "排骨約 500 克切件，南瓜約 400 克切塊。排骨加一湯匙生抽、蒜薑蓉、少許糖，可拍生粉拌匀。",
        "碟底鋪南瓜，排骨放上面；可撒洗淨豆豉。",
        "大火蒸 25 至 30 分鐘至排骨熟透南瓜軟，靜置 2 分鐘即可。",
      ],
    },
  },
  {
    id: "home-bitter-melon-beef",
    name: "Bitter melon beef",
    cuisine: "Cantonese",
    time: 25,
    servings: 2,
    need: ["Beef steak", "Bitter melon", "Garlic", "Beans"],
    optional: ["Salt", "Baking soda", "Cooking oil", "Shaoxing wine", "Sugar", "Soy sauce", "Sesame oil", "White pepper", "Cornstarch", "Oyster sauce"],
    steps: [
      "Slice 250 g beef steak thinly; toss with soy sauce and a little cornstarch. Halve bitter melon, scrape seeds, and slice; blanch 1 minute in salted boiling water, drain.",
      "Stir-fry beef on high heat 1–2 minutes until just browned; remove. Soften garlic/ginger, then toss bitter melon 2–3 minutes.",
      "Return beef with oyster sauce, a pinch of sugar, and a splash of water; toss 30 seconds and serve.",
    ],
    zh: {
      name: "涼瓜炒牛肉",
      steps: [
        "牛扒約 250 克切薄片，加生抽和少許生粉。涼瓜剖開去瓤切片，鹽水焯 1 分鐘瀝乾。",
        "大火快炒牛肉 1 至 2 分鐘盛起；爆香蒜薑，炒涼瓜 2 至 3 分鐘。",
        "回牛肉加蠔油、少許糖和少許水，快炒 30 秒上碟。",
      ],
    },
  },
  {
    id: "home-salted-fish-pork-patty",
    name: "Salted fish steamed pork (home)",
    cuisine: "Cantonese",
    time: 30,
    servings: 2,
    // Stand-in: Canned tuna for salted fish
    need: ["Ground pork", "Spring onion", "Water chestnuts", "Ginger"],
    optional: ["Sesame oil", "Salt", "White pepper", "Baking soda", "Shaoxing wine", "Cornstarch", "Sand ginger"],
    steps: [
      "Mix 300 g ground pork with drained flaked canned tuna (salted-fish stand-in), minced ginger, 1 tsp soy sauce, cornstarch, and a pinch of sugar and white pepper.",
      "Press into a flat patty in a heatproof dish; make a shallow well in the center.",
      "Steam 15–18 minutes until pork is cooked through (no pink). Finish with spring onion.",
    ],
    zh: {
      name: "鹹魚蒸肉餅",
      steps: [
        "免治豬肉約 300 克加瀝乾吞拿魚碎（代替鹹魚）、薑蓉、一茶匙生抽、生粉、少許糖和白胡椒拌匀。",
        "壓成扁圓餅放入碟，中間略按凹。",
        "蒸 15 至 18 分鐘至豬肉全熟無粉紅，撒蔥花。",
      ],
    },
  },
  {
    id: "home-ginger-scallion-shrimp",
    name: "Ginger scallion shrimp",
    cuisine: "Cantonese",
    time: 20,
    servings: 2,
    need: ["Shrimp", "Spring onion", "Ginger"],
    optional: ["White pepper", "Cooking oil", "Salt", "Shaoxing wine", "Soy sauce"],
    steps: [
      "Peel and devein 350 g shrimp; toss with a pinch of salt and cornstarch. Slice ginger and cut spring onion into sections.",
      "Stir-fry ginger (and garlic if using) in hot oil until fragrant. Add shrimp; cook 2–3 minutes until pink and opaque.",
      "Add spring onion, a splash of Shaoxing wine or soy sauce, and toss 30 seconds. Optional sesame oil to finish.",
    ],
    zh: {
      name: "薑葱炒蝦",
      steps: [
        "中蝦約 350 克去殼開背，加少許鹽和生粉。薑切片，葱切段。",
        "熱油爆香薑片（可加蒜），下蝦炒 2 至 3 分鐘至變色熟透。",
        "下葱段，濺少許料酒或生抽快炒 30 秒，可滴麻油。",
      ],
    },
  },
  {
    id: "home-claypot-tofu",
    name: "Claypot tofu",
    cuisine: "Cantonese",
    time: 30,
    servings: 2,
    need: ["Tofu", "Mushroom"],
    optional: ["Soy sauce", "Cornstarch", "Garlic", "Onion", "Spring onion", "Oyster sauce", "Ginger", "Sugar", "Pork chops"],
    steps: [
      "Pat dry and cube 1 block tofu; slice mushrooms. Optional: thinly slice a little pork and brown first.",
      "Pan-fry tofu until golden on a few sides. Soften garlic/ginger and mushrooms in the same pan.",
      "Add oyster sauce, soy sauce, a pinch of sugar, and 1/2 cup water; simmer 8–10 minutes. Thicken with cornstarch slurry if desired; finish with spring onion.",
    ],
    zh: {
      name: "豆腐煲",
      steps: [
        "豆腐抹乾切塊，蘑菇切片；可先炒香少許豬片。",
        "豆腐煎至幾面金黃；同鑊爆香蒜薑和蘑菇。",
        "加蠔油、生抽、少許糖和半杯水炆 8 至 10 分鐘，可勾芡，撒葱花。",
      ],
    },
  },
  {
    id: "home-scallop-style-congee",
    name: "Dried scallop-style congee",
    cuisine: "Cantonese",
    time: 55,
    servings: 3,
    // Stand-in: Dried mushrooms + Rice for dried scallop aroma
    need: ["Cooked rice", "Dried mushrooms"],
    optional: ["White pepper", "Mushroom", "Onion", "Spring onion", "Salt", "Ginger", "Century egg", "Pork chops"],
    steps: [
      "Rinse 1 cup rice. Soak dried mushrooms until soft; squeeze and slice (scallop-style stand-in). Thinly slice ginger.",
      "Simmer rice with about 6 cups water and mushrooms 40–45 minutes, stirring often, until creamy and porridge-like.",
      "Season with salt and white pepper. Optional: stir in century egg wedges or thin pork until cooked. Finish with spring onion.",
    ],
    zh: {
      name: "瑤柱風味粥",
      steps: [
        "米約一杯洗净。冬菇浸軟擠乾切片（代替瑤柱風味），薑切絲。",
        "米加水約六杯連冬菇煮 40 至 45 分鐘，不時攪拌至綿稠。",
        "加鹽和白胡椒；可下皮蛋或薄豬片煮熟，撒葱花。",
      ],
    },
  },
  {
    id: "home-fish-tofu-soup",
    name: "Fish tofu soup",
    cuisine: "Cantonese",
    time: 25,
    servings: 2,
    need: ["Salmon", "Ginger", "Mushroom", "Dried chili", "Bean sprouts", "Napa cabbage", "Tofu", "Spring onion", "Cilantro"],
    optional: ["Cornstarch", "Soy sauce", "Shaoxing wine", "Sesame oil", "Salt", "White pepper", "Cooking oil", "Chicken stock"],
    steps: [
      "Cut white fish into bite-size pieces; lightly dust with cornstarch if using. Cube tofu; slice ginger.",
      "Bring 4 cups water to a simmer with ginger and tomato if using. Add tofu; cook 3 minutes.",
      "Slip in fish pieces; simmer gently 4–5 minutes until opaque. Season with salt and white pepper; finish with spring onion.",
    ],
    zh: {
      name: "魚豆腐湯",
      steps: [
        "白魚切件，可拍少許生粉。豆腐切塊，薑切片。",
        "水約四杯加薑（可加番茄）煮滾，下豆腐煮 3 分鐘。",
        "下魚件慢滾 4 至 5 分鐘至熟白，加鹽白胡椒，撒葱花。",
      ],
    },
  },
  {
    id: "home-lemon-spare-ribs",
    name: "Lemon spare ribs",
    cuisine: "Hong Kong",
    time: 45,
    servings: 3,
    need: ["Spare ribs", "Lemon"],
    optional: ["Soy sauce", "Cornstarch", "Garlic", "Orange juice", "Salt", "Ketchup", "Honey", "Sugar", "Spring onion", "Cooking oil", "Oyster sauce", "Shaoxing wine", "Ginger", "Sesame oil"],
    steps: [
      "Cut 600 g spare ribs into pieces; marinate with salt, soy sauce, and cornstarch 10 minutes. Pan-fry or bake until browned.",
      "Mix juice of 1 lemon with 2 tbsp sugar or honey, optional ketchup, and minced garlic into a tangy sauce.",
      "Return ribs to pan with sauce and a splash of water; simmer covered 15–20 minutes until tender and glossy.",
    ],
    zh: {
      name: "檸檬排骨",
      steps: [
        "排骨約 600 克切件，加鹽、生抽和生粉醃 10 分鐘；煎或烤至上色。",
        "一個檸檬汁加兩湯匙糖或蜜糖，可加茄汁和蒜蓉拌成醬。",
        "排骨回鑊加醬汁和少許水，加蓋炆 15 至 20 分鐘至軟亮。",
      ],
    },
  },
  {
    id: "home-sausage-sticky-rice",
    name: "Sticky rice Chinese sausage",
    cuisine: "Cantonese",
    time: 45,
    servings: 3,
    need: ["Rice", "Shrimp", "Onion", "Mushroom", "Chinese sausage", "Spring onion", "Cilantro"],
    optional: ["Oyster sauce", "Soy sauce", "Sesame oil", "Chicken stock", "Salt", "Cooking oil", "Shaoxing wine", "White pepper"],
    steps: [
      "Rinse 1½ cups rice and soak 20 minutes. Slice Chinese sausage; soak and dice dried mushrooms if using.",
      "Drain rice into a heatproof bowl; mix with sausage, mushrooms, soy sauce, ginger, and a pinch of salt. Add water to just cover the rice.",
      "Steam 30–35 minutes until rice is tender. Fluff, drizzle sesame oil, and finish with spring onion.",
    ],
    zh: {
      name: "臘味糯米飯風",
      steps: [
        "米約一杯半洗净浸 20 分鐘。臘腸切片；冬菇可浸軟切粒。",
        "米瀝乾放碗，拌臘腸、冬菇、生抽、薑和少許鹽，加水剛蓋過米。",
        "蒸 30 至 35 分鐘至熟，拌鬆滴麻油，撒葱花。",
      ],
    },
  },
  {
    id: "home-pan-radish-cake-style",
    name: "Pan-fried turnip cake style",
    cuisine: "Cantonese",
    time: 50,
    servings: 3,
    // Home approximation: Rice + Carrots + Egg
    need: ["Flour", "Shrimp", "Chinese sausage", "Garlic", "Onion"],
    optional: ["Salt", "Cooking oil", "Sesame oil", "Chicken stock", "White pepper"],
    steps: [
      "Cook 1 cup rice until soft and slightly overdone; mash lightly. Grate 1 large carrot; dice Chinese sausage if using. Beat 1 egg.",
      "Mix mashed rice with carrot, sausage, egg, salt, white pepper, and a spoon of cornstarch into a thick batter. Press into a greased pan or dish.",
      "Steam 15 minutes until set, cool slightly, then slice and pan-fry both sides until golden. Serve with soy sauce.",
    ],
    zh: {
      name: "煎蘿蔔糕風",
      steps: [
        "米約一杯煮至偏軟略压爛。紅蘿蔔一條擦絲；可切臘腸粒。打散一隻蛋。",
        "米泥拌紅蘿蔔、臘腸、蛋、鹽、白胡椒和一匙生粉成稠糊，壓入抹油盤。",
        "蒸 15 分鐘至定型，稍涼切片，兩面煎至金黄，伴生抽。",
      ],
    },
  },
  {
    id: "home-steamed-egg-shrimp",
    name: "Steamed egg with shrimp",
    cuisine: "Cantonese",
    time: 20,
    servings: 2,
    need: ["Onion", "Bean sprouts", "Eggs", "Spring onion", "Flour", "Garlic", "Shallot"],
    optional: ["Salt", "Sugar", "Cornstarch", "Cooking oil", "Sesame oil", "Turmeric", "Paprika", "Chicken stock", "Oyster sauce", "Soy sauce", "White pepper"],
    steps: [
      "Beat 3 eggs with equal volume warm water (about 3 eggs' worth) and a pinch of salt until smooth; strain if possible.",
      "Peel shrimp; scatter in a shallow dish. Pour egg mixture over; cover loosely.",
      "Steam on gentle heat 10–12 minutes until just set. Finish with soy sauce, sesame oil, and spring onion.",
    ],
    zh: {
      name: "蝦仁蒸蛋",
      steps: [
        "三隻蛋加等量温水、少許鹽打匀，可過篩。",
        "蝦去殼放淺碟，倒入蛋液，略蓋。",
        "中小火蒸 10 至 12 分鐘至刚凝固，淋生抽麻油，撒葱花。",
      ],
    },
  },
  {
    id: "home-oyster-beef",
    name: "Beef with oyster sauce",
    cuisine: "Cantonese",
    time: 20,
    servings: 2,
    need: ["Beef steak", "Snow peas", "Celery", "Mushroom", "Carrots", "Onion", "Garlic"],
    optional: ["Sand ginger", "Cooking oil", "Shaoxing wine", "Soy sauce", "Sesame oil", "Oyster sauce", "Cornstarch", "White pepper", "Baking soda", "Sugar"],
    steps: [
      "Slice 300 g beef thinly; toss with 1 tsp soy sauce and cornstarch. Slice onion if using.",
      "Stir-fry beef on high heat 1–2 minutes until just browned; remove. Soften garlic, ginger, and onion.",
      "Return beef with 2 tbsp oyster sauce, a pinch of sugar, and a splash of water; toss 30–60 seconds. Finish with spring onion or sesame oil.",
    ],
    zh: {
      name: "蠔油牛肉",
      steps: [
        "牛扒約 300 克切薄片，加一茶匙生抽和生粉。有洋蔥可切片。",
        "大火快炒牛肉 1 至 2 分鐘盛起；炒软蒜薑洋蔥。",
        "回牛肉加兩湯匙蠔油、少許糖和少許水，快炒 30 至 60 秒，可加葱或麻油。",
      ],
    },
  },
  {
    id: "home-garlic-spare-ribs",
    name: "Garlic spare ribs",
    cuisine: "Cantonese",
    time: 40,
    servings: 3,
    need: ["Spare ribs", "Bell pepper", "Spring onion", "Garlic"],
    optional: ["Soy sauce", "White pepper", "Shaoxing wine", "Cornstarch", "Olive oil"],
    steps: [
      "Cut 600 g spare ribs; marinate with salt, soy sauce, cornstarch, and half the minced garlic 15 minutes.",
      "Brown ribs in a pan 4–5 minutes. Add remaining garlic and ginger; cook until fragrant.",
      "Add 1 tbsp sugar or honey and 1/2 cup water; cover and simmer 20–25 minutes until tender. Optional sesame oil finish.",
    ],
    zh: {
      name: "蒜香排骨",
      steps: [
        "排骨約 600 克切件，加鹽、生抽、生粉和一半蒜蓉醃 15 分鐘。",
        "排骨煎香約 4 至 5 分鐘；下餘下蒜蓉和薑炒香。",
        "加一湯匙糖或蜜糖和半杯水，加蓋炆 20 至 25 分鐘至軟，可滴麻油。",
      ],
    },
  },
  {
    id: "home-tomato-pork-chops",
    name: "Tomato pork chops",
    cuisine: "Hong Kong",
    time: 35,
    servings: 2,
    need: ["Pork chops", "Onion", "Garlic"],
    optional: ["Sand ginger", "Cornstarch", "Cooking oil", "Salt", "Shaoxing wine", "Oyster sauce", "Soy sauce", "Sugar", "White pepper"],
    steps: [
      "Pound 2 pork chops lightly; season with salt and soy sauce. Pan-fry 3–4 minutes per side until cooked through; remove.",
      "Cook chopped tomato and onion with ketchup, a pinch of sugar, and garlic if using until saucy (8–10 minutes).",
      "Return chops to the sauce; simmer 3–5 minutes so the meat absorbs the tomato gravy.",
    ],
    zh: {
      name: "番茄豬扒",
      steps: [
        "兩件豬扒略拍鬆，加鹽生抽；每面煎 3 至 4 分鐘至全熟盛起。",
        "番茄洋蔥加茄汁、少許糖（可加蒜）煮 8 至 10 分鐘成汁。",
        "豬扒回汁炆 3 至 5 分鐘入味。",
      ],
    },
  },  {
    id: "home-red-braised-pork",
    name: "Braised pork belly-style (chops)",
    cuisine: "Cantonese",
    time: 50,
    servings: 3,
    // Stand-in: Pork chops for pork belly
    need: ["Fermented tofu", "Pork chops", "Green beans", "Flour"],
    optional: ["Sugar", "Oyster sauce", "White pepper", "Cooking oil", "Cornstarch", "Baking soda"],
    steps: [
      "Cut 500 g pork chops into large cubes. Blanch briefly; rinse. Slice ginger and smash garlic.",
      "Brown pork in a little oil. Add sugar and cook until lightly caramelized, then soy sauce, ginger, garlic, and Shaoxing wine if using.",
      "Add water to nearly cover; simmer covered 30–35 minutes until tender and sauce is reduced and glossy. Finish with spring onion.",
    ],
    zh: {
      name: "紅燒肉風",
      steps: [
        "豬扒約 500 克切大件，焯水洗净。薑切片，拍蒜。",
        "少油煎香豬肉；下糖略炒至焦糖色，加生抽、薑蒜，可濺料酒。",
        "加水近蓋過，加蓋炆 30 至 35 分鐘至軟汁濃，撒葱。",
      ],
    },
  },
  {
    id: "home-soy-sauce-eggs",
    name: "Soy sauce eggs",
    cuisine: "Cantonese",
    time: 25,
    servings: 4,
    need: ["Spring onion", "Eggs", "Cooked rice"],
    optional: ["Cooking oil", "Soy sauce", "Sugar", "Shaoxing wine"],
    steps: [
      "Hard-boil 4–6 eggs 8–9 minutes; cool in cold water and peel.",
      "Simmer 1/2 cup soy sauce with 1 cup water, 1–2 tsp sugar, ginger, and spring onion 5 minutes.",
      "Add peeled eggs; simmer gently 5–8 minutes, turning so they color evenly. Cool in the liquid for deeper flavor if time allows.",
    ],
    zh: {
      name: "滷水蛋",
      steps: [
        "四至六隻蛋煮 8 至 9 分鐘，過冷水剝殼。",
        "半杯生抽加一杯水、1 至 2 茶匙糖、薑和葱煮 5 分鐘。",
        "下蛋慢煮 5 至 8 分鐘並翻轉上色；有時間可浸涼入味。",
      ],
    },
  },
  {
    id: "home-salt-pepper-ribs",
    name: "Pepper salt spare ribs",
    cuisine: "Cantonese",
    time: 35,
    servings: 2,
    need: ["Spare ribs", "White pepper", "Salt"],
    optional: ["Cornstarch", "Garlic", "Cooking oil", "Onion", "Spring onion", "Chili oil", "Sugar", "Soy sauce", "Oyster sauce", "Shaoxing wine", "Ginger", "Sesame oil"],
    steps: [
      "Cut 500 g spare ribs; toss with salt, white pepper, cornstarch, and optional beaten egg white. Rest 10 minutes.",
      "Pan-fry or shallow-fry ribs until browned and cooked through, about 8–10 minutes total; drain excess oil.",
      "Toss hot ribs with more white pepper, salt, minced garlic, and chili oil if using. Finish with spring onion.",
    ],
    zh: {
      name: "椒鹽排骨",
      steps: [
        "排骨約 500 克切件，加鹽、白胡椒、生粉，可加蛋白醃 10 分鐘。",
        "煎或浅炸約 8 至 10 分鐘至金黃熟透，沥去多餘油。",
        "趁熱拌更多白胡椒、鹽、蒜蓉，可加辣椒油，撒葱花。",
      ],
    },
  },
  {
    id: "home-lettuce-fish",
    name: "Lettuce fish stir-fry",
    cuisine: "Cantonese",
    time: 20,
    servings: 2,
    need: ["White fish", "Lettuce"],
    optional: ["Soy sauce", "Cornstarch", "Garlic", "Cooking oil", "Salt", "Sesame oil", "Ginger"],
    steps: [
      "Cut white fish into slices; toss with salt and cornstarch. Separate lettuce leaves.",
      "Stir-fry garlic/ginger briefly; add fish and cook 2–3 minutes until just opaque.",
      "Add lettuce and toss 30–60 seconds until wilted but still crisp. Season with soy sauce; optional sesame oil.",
    ],
    zh: {
      name: "生菜魚片",
      steps: [
        "白魚切片，加鹽和生粉。生菜掰开洗净。",
        "爆香蒜薑，下魚片炒 2 至 3 分鐘至刚熟。",
        "下生菜快炒 30 至 60 秒至软但仍爽，加生抽，可滴麻油。",
      ],
    },
  },
  {
    id: "home-broccoli-pork",
    name: "Broccoli pork",
    cuisine: "Cantonese",
    time: 25,
    servings: 2,
    need: ["Pork chops", "Broccoli"],
    optional: ["Soy sauce", "Cornstarch", "Garlic", "Oyster sauce", "Ginger", "Sugar", "Salt"],
    steps: [
      "Slice pork thinly; toss with soy sauce and cornstarch. Cut broccoli into florets; blanch 1–2 minutes, drain.",
      "Stir-fry pork until cooked through, about 3–4 minutes; remove. Soften garlic/ginger.",
      "Return pork with broccoli, oyster sauce, a pinch of sugar, and a splash of water; toss 1 minute.",
    ],
    zh: {
      name: "西蘭花炒豬肉",
      steps: [
        "豬扒切絲加生抽生粉。西蘭花切小朵焯 1 至 2 分鐘瀝乾。",
        "炒豬肉約 3 至 4 分鐘至熟盛起；爆香蒜薑。",
        "回肉和西蘭花，加蠔油、少許糖和少許水，炒 1 分鐘。",
      ],
    },
  },
  {
    id: "home-eggplant-tofu-claypot",
    name: "Eggplant tofu claypot",
    cuisine: "Cantonese",
    time: 35,
    servings: 3,
    need: ["Eggplant", "Tofu"],
    optional: ["Soy sauce", "Garlic", "Cooking oil", "Onion", "Spring onion", "Oyster sauce", "Chili oil", "Ginger", "Sugar", "Cornstarch"],
    steps: [
      "Cut eggplant into batons and tofu into cubes. Pan-fry both until lightly golden; set aside.",
      "Soft garlic and ginger; add oyster sauce, soy sauce, a pinch of sugar, and 3/4 cup water.",
      "Return eggplant and tofu; simmer 10–12 minutes until saucy. Thicken if desired; finish with spring onion or chili oil.",
    ],
    zh: {
      name: "茄子豆腐煲",
      steps: [
        "茄子切條，豆腐切塊，分別煎至微黄盛起。",
        "爆香蒜薑，加蠔油、生抽、少許糖和四分三杯水。",
        "回茄子豆腐炆 10 至 12 分鐘至入味，可勾芡，撒葱或辣椒油。",
      ],
    },
  },
  {
    id: "home-corn-rib-soup",
    name: "Corn pork ribs soup",
    cuisine: "Cantonese",
    time: 55,
    servings: 3,
    need: ["Spare ribs", "Corn"],
    optional: ["Mushroom", "Dried mushrooms", "Salt", "Carrots", "Ginger", "Cooking oil", "White pepper", "Spring onion"],
    steps: [
      "Blanch 500 g spare ribs; rinse. Cut corn into chunks; optional carrot and soaked dried mushrooms.",
      "Simmer ribs with ginger and corn in about 1.5 L water for 40–45 minutes.",
      "Add carrot if using for the last 15 minutes. Season with salt.",
    ],
    zh: {
      name: "粟米排骨湯",
      steps: [
        "排骨約 500 克焯水洗净。粟米切段；可加紅蘿蔔和浸軟冬菇。",
        "排骨連薑和粟米加水約 1.5 升炆 40 至 45 分鐘。",
        "有紅蘿蔔可於最後 15 分鐘下，加鹽調味。",
      ],
    },
  },
  {
    id: "home-steamed-beef-patty",
    name: "Steamed minced beef",
    cuisine: "Cantonese",
    time: 25,
    servings: 2,
    need: ["Cooked rice", "Ground beef", "Onion", "Eggs"],
    optional: ["Cooking oil", "Shaoxing wine", "Sesame oil", "Soy sauce", "Cornstarch", "Oyster sauce", "White pepper", "Chicken stock"],
    steps: [
      "Mix 300 g ground beef with minced ginger, 1 tsp soy sauce, cornstarch, a pinch of sugar, salt, and white pepper until sticky.",
      "Press into a flat patty in a heatproof dish; optional water spinach stems under the meat.",
      "Steam 12–15 minutes until cooked through (no pink). Finish with spring onion.",
    ],
    zh: {
      name: "蒸牛肉餅",
      steps: [
        "免治牛肉約 300 克加薑蓉、一茶匙生抽、生粉、少許糖鹽白胡椒拌至起膠。",
        "壓成扁餅；可墊通菜莖在肉下。",
        "蒸 12 至 15 分鐘至全熟無粉紅，撒葱花。",
      ],
    },
  },
  {
    id: "home-choi-sum-fish",
    name: "Choi sum fish",
    cuisine: "Cantonese",
    time: 20,
    servings: 2,
    need: ["White fish", "Choi sum"],
    optional: ["Cornstarch", "Garlic", "Cooking oil", "Oyster sauce", "Salt", "Sesame oil", "Ginger", "Soy sauce"],
    steps: [
      "Slice white fish; toss with salt and cornstarch. Trim choi sum; blanch 45–60 seconds, drain.",
      "Stir-fry garlic/ginger; add fish and cook until just opaque, 2–3 minutes.",
      "Add choi sum with soy or oyster sauce and a splash of water; toss briefly. Optional sesame oil.",
    ],
    zh: {
      name: "菜心魚片",
      steps: [
        "白魚切片加鹽生粉。菜心洗净焯 45 至 60 秒瀝乾。",
        "爆香蒜薑，下魚片炒 2 至 3 分鐘至刚熟。",
        "下菜心加生抽或蠔油和少許水快炒，可滴麻油。",
      ],
    },
  },
  {
    id: "home-black-bean-ribs-claypot",
    name: "Black bean ribs claypot",
    cuisine: "Cantonese",
    time: 40,
    servings: 3,
    need: ["Spare ribs", "Garlic", "Fermented black beans", "Bell pepper", "Onion", "Spring onion"],
    optional: ["Salt", "Cooking oil", "Sand ginger", "Shaoxing wine", "Sugar", "White pepper", "Sesame oil", "Soy sauce", "Cornstarch"],
    steps: [
      "Cut 500 g spare ribs; rinse fermented black beans and mash lightly with garlic. Toss ribs with beans, soy sauce, cornstarch, and a pinch of sugar.",
      "Brown ribs in a claypot or deep pan 4–5 minutes. Add ginger, chili oil if using, and 1/2 cup water.",
      "Cover and simmer 20–25 minutes until tender. Optional bell pepper strips for the last 5 minutes; finish with spring onion.",
    ],
    zh: {
      name: "豉汁排骨煲",
      steps: [
        "排骨約 500 克切件；豆豉洗净略壓碎拌蒜蓉。排骨加豆豉、生抽、生粉和少許糖拌匀。",
        "煲或厚鑊煎香排骨約 4 至 5 分鐘；下薑、辣椒油和半杯水。",
        "加蓋炆 20 至 25 分鐘至軟；最後 5 分鐘可加燈籠椒絲，撒葱花。",
      ],
    },
  },
]
