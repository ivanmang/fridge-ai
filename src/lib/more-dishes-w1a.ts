import type { Recipe } from "@/lib/recipes"

/**
 * HK café classics batch W1A — cookable home outlines only.
 * Shelf stand-ins noted in comments where specialty items are missing.
 */
export const MORE_W1A: Recipe[] = [
  {
    id: "home-hk-borscht",
    name: "HK-style borscht",
    cuisine: "Hong Kong",
    time: 55,
    servings: 4,
    need: ["Beef steak", "Tomato", "Cabbage", "Carrots", "Potato"],
    optional: ["Onion", "Celery", "Garlic", "Sugar", "Salt", "Ketchup"],
    steps: [
      "Cut 300 g beef steak into cubes. Roughly chop 2 tomatoes, 1/4 cabbage, 1 carrot, 1 potato, and onion if using.",
      "Brown the beef in a little oil 3–4 minutes. Add tomato, onion, and garlic; cook until saucy, then cover with about 1.2 L water.",
      "Simmer 35–40 minutes. Add cabbage, carrot, and potato; cook 15 more minutes until tender. Season with salt, a pinch of sugar, and ketchup if you like.",
    ],
    zh: {
      name: "港式羅宋湯",
      steps: [
        "牛扒約 300 克切件。切開兩個番茄、四分一椰菜、一條紅蘿蔔、一個薯仔，有洋蔥亦可切件。",
        "少油將牛肉煎香約 3 至 4 分鐘。下番茄、洋蔥、蒜炒至出汁，加水約 1.2 升。",
        "煮約 35 至 40 分鐘。下椰菜、紅蘿蔔、薯仔再煮 15 分鐘至軟，加鹽、少許糖，可加茄汁調味。",
      ],
    },
  },
  {
    id: "home-satay-beef-noodles",
    name: "Satay beef noodle soup",
    cuisine: "Hong Kong",
    time: 30,
    servings: 2,
    need: ["Beef steak", "Noodles", "Peanut butter"],
    optional: ["Onion", "Garlic", "Soy sauce", "Chili oil", "Spring onion", "Bean sprouts", "Tomato", "Salt", "White pepper", "Sesame oil", "Vinegar", "Shrimp", "Cooking oil", "Eggs"],
    steps: [
      "Slice 250 g beef steak thinly. Mix 2 tbsp peanut butter with 1 tbsp soy sauce, a splash of water, and chili oil if using into a satay paste.",
      "Boil noodles until tender; drain. Soften onion/garlic in a pot, add 3 cups water and the satay paste; simmer 5 minutes.",
      "Add beef slices and cook 1–2 minutes until just browned through. Pour over noodles; top with spring onion or bean sprouts.",
    ],
    zh: {
      name: "沙爹牛肉麵",
      steps: [
        "牛扒約 250 克切薄片。兩湯匙花生醬加一湯匙生抽、少許水和辣椒油拌成沙爹醬。",
        "麵煮至軟瀝乾。鑊中炒軟洋蔥蒜蓉，加水約三杯和沙爹醬煮 5 分鐘。",
        "下牛肉片煮 1 至 2 分鐘至熟，淋在麵上，可加蔥花或芽菜。",
      ],
    },
  },
  {
    id: "home-baked-pork-chop-rice",
    name: "Baked pork chop rice",
    cuisine: "Hong Kong",
    time: 45,
    servings: 2,
    need: ["Pork chops", "Cooked rice", "Eggs", "Tomato", "Cheddar", "Butter"],
    optional: ["Onion", "Ketchup", "Sugar", "Flour", "Salt", "Cornstarch", "White pepper", "Five-spice powder", "Oyster sauce", "Shaoxing wine", "Soy sauce", "Cooking oil", "Garlic", "Sesame oil"],
    steps: [
      "Pound 2 pork chops lightly; season with salt. Dust with flour if using. Beat 1 egg and dip chops, then pan-fry 3–4 minutes per side until cooked through (74°C / 165°F).",
      "Cook chopped tomato and onion with ketchup and a pinch of sugar into a thick sauce (8–10 minutes). Loosen 2 bowls of cooked rice in a baking dish.",
      "Lay pork on rice, cover with tomato sauce and grated cheddar. Bake at 200°C / 400°F for 10–12 minutes until cheese melts and bubbles.",
    ],
    zh: {
      name: "焗豬扒飯",
      steps: [
        "兩件豬扒略拍鬆，撒鹽；可拍生粉。沾蛋液後每面煎 3 至 4 分鐘至全熟（74°C）。",
        "番茄洋蔥加茄汁和少許糖煮 8 至 10 分鐘成濃汁。兩碗熟飯鋪入焗盤。",
        "豬扒放飯上，淋茄汁撒切達芝士，200°C 焗 10 至 12 分鐘至芝士溶化起泡。",
      ],
    },
  },
  {
    id: "home-swiss-chicken-wings",
    name: "Swiss chicken wings",
    cuisine: "Hong Kong",
    time: 40,
    servings: 2,
    // Stand-in: Chicken thighs for wings; Honey + Soy sauce + Sugar for café "Swiss" sauce
    need: ["Chicken thighs", "Soy sauce", "Honey", "Sugar"],
    optional: ["Garlic", "Ginger", "Spring onion", "Sesame oil", "Cornstarch"],
    steps: [
      "Cut 500 g chicken thighs into wing-sized pieces. Mix 3 tbsp soy sauce, 2 tbsp honey, 1 tbsp sugar, and minced garlic/ginger if using.",
      "Marinate chicken 15 minutes. Pan-fry or bake until browned, then add remaining marinade and a splash of water.",
      "Simmer covered 12–15 minutes until chicken reaches 74°C / 165°F and sauce turns glossy. Optional: thicken with a cornstarch slurry; finish with spring onion.",
    ],
    zh: {
      name: "瑞士雞翼",
      steps: [
        "雞脾約 500 克切成翼件大小。三湯匙生抽、兩湯匙蜜糖、一湯匙糖拌勻，可加蒜薑蓉。",
        "醃約 15 分鐘。煎或烤至上色，倒入餘下醬汁和少許水。",
        "加蓋炆 12 至 15 分鐘至雞全熟（74°C）汁濃；可勾芡，撒蔥花。",
      ],
    },
  },
  {
    id: "home-hk-curry-chicken",
    name: "HK curry chicken",
    cuisine: "Hong Kong",
    time: 45,
    servings: 3,
    // Stand-in: Coconut milk + Soy sauce for curry base (curry powder mentioned in steps only)
    need: ["Chicken thighs", "Potato", "Onion", "Coconut milk", "Chicken wings", "Curry powder"],
    optional: ["Garlic", "Carrots", "Soy sauce", "Sugar", "Cooked rice", "Salt", "Spring onion", "Ginger", "Cooking oil", "Shaoxing wine", "Oyster sauce", "Cornstarch", "Sesame oil"],
    steps: [
      "Cut 500 g chicken thighs into chunks; peel and cube 2 potatoes and 1 onion. Marinate chicken briefly with soy sauce if using.",
      "Brown chicken in oil 4–5 minutes; remove. Soften onion and garlic, then stir in 1–2 tsp curry powder (pantry spice) until fragrant.",
      "Return chicken with potato, carrot if using, and 1 cup coconut milk plus 1/2 cup water. Simmer 20–25 minutes until chicken is 74°C / 165°F and potato is soft. Serve over rice.",
    ],
    zh: {
      name: "咖哩雞飯",
      steps: [
        "雞脾約 500 克切件；兩個薯仔和一個洋蔥切塊。雞可用生抽略醃。",
        "雞件煎香約 4 至 5 分鐘盛起。炒軟洋蔥蒜蓉，下 1 至 2 茶匙咖喱粉炒香。",
        "回雞，加薯仔（可加紅蘿蔔）、一杯椰漿和半杯水，炆 20 至 25 分鐘至雞全熟（74°C）薯軟，伴飯。",
      ],
    },
  },
  {
    id: "home-hk-curry-brisket",
    name: "HK curry beef brisket",
    cuisine: "Hong Kong",
    time: 70,
    servings: 3,
    // Stand-in: Beef steak for brisket; Coconut milk for curry base
    need: ["Beef steak", "Potato", "Onion", "Coconut milk"],
    optional: ["Carrots", "Garlic", "Soy sauce", "Sugar", "Salt", "Cooking oil", "Shallot", "Chicken stock"],
    steps: [
      "Cut 400 g beef steak into large cubes (stand-in for brisket). Cube 2 potatoes and 1 onion.",
      "Brown beef well on all sides (5–6 minutes). Soften onion and garlic; add 1–2 tsp curry powder and toast 30 seconds.",
      "Add coconut milk, 1 cup water, potato, and carrot if using. Simmer covered 45–55 minutes until beef is tender. Season with soy sauce, sugar, and salt.",
    ],
    zh: {
      name: "咖哩牛腩",
      steps: [
        "牛扒約 400 克切大件（代替牛腩）。兩個薯仔和一個洋蔥切塊。",
        "牛肉四面煎香約 5 至 6 分鐘。炒軟洋蔥蒜蓉，下 1 至 2 茶匙咖喱粉炒 30 秒。",
        "加椰漿、一杯水、薯仔（可加紅蘿蔔），加蓋炆 45 至 55 分鐘至軟，用生抽、糖、鹽調味。",
      ],
    },
  },
  {
    id: "home-luncheon-egg-noodles",
    name: "Luncheon meat egg noodles",
    cuisine: "Hong Kong",
    time: 15,
    servings: 1,
    need: ["Noodles", "Luncheon meat", "Eggs"],
    optional: ["Spring onion", "Soy sauce", "Sesame oil", "Chili oil"],
    steps: [
      "Boil noodles until tender; drain and place in a bowl. Slice luncheon meat; fry until edges crisp.",
      "Fry 1–2 eggs sunny-side or over-easy until whites are fully set.",
      "Top noodles with luncheon meat and egg. Season with soy sauce, sesame oil, or chili oil; add spring onion.",
    ],
    zh: {
      name: "餐蛋麵",
      steps: [
        "麵煮至軟瀝乾放入碗。午餐肉切片煎至邊脆。",
        "煎一至兩隻蛋至蛋白全熟。",
        "午餐肉和蛋鋪麵上，加生抽、麻油或辣椒油，可撒蔥花。",
      ],
    },
  },
  {
    id: "home-corned-beef-macaroni",
    name: "Corned beef macaroni",
    cuisine: "Hong Kong",
    time: 20,
    servings: 2,
    // Stand-in: Luncheon meat for corned beef; Pasta for macaroni
    need: ["Pasta", "Luncheon meat", "Eggs"],
    optional: ["Onion", "Soy sauce", "Butter", "Spring onion", "Salt"],
    steps: [
      "Boil pasta (elbows or short tubes) in salted water until soft; drain, reserve a little cooking water.",
      "Dice luncheon meat and fry with onion if using until hot and lightly browned. Soft-scramble 2 eggs separately until just set.",
      "Toss pasta with butter or a splash of cooking water, fold in luncheon meat and eggs. Season lightly; finish with spring onion.",
    ],
    zh: {
      name: "鹹牛肉通粉",
      steps: [
        "通粉（或短通心粉）加鹽水煮軟瀝乾，留少許煮粉水。",
        "午餐肉切丁，可連洋蔥炒熱微香。另炒兩隻蛋至剛好凝固。",
        "通粉拌牛油或煮粉水，加入午餐肉和蛋，調味後撒蔥花。",
      ],
    },
  },
  {
    id: "home-hk-spaghetti",
    name: "HK-style spaghetti",
    cuisine: "Hong Kong",
    time: 25,
    servings: 2,
    need: ["Pasta", "Ham", "Tomato", "Ketchup"],
    optional: ["Onion", "Garlic", "Sugar", "Butter", "Cheddar", "Salt"],
    steps: [
      "Boil spaghetti until al dente; drain. Dice ham; chop tomato and onion.",
      "Melt a little butter; soften onion and garlic, then add ham and tomato. Stir in 3–4 tbsp ketchup and a pinch of sugar; cook 5–6 minutes until saucy.",
      "Toss pasta with the sauce. Optional: top with grated cheddar and melt briefly under a hot grill.",
    ],
    zh: {
      name: "港式意粉",
      steps: [
        "意粉煮至彈牙瀝乾。火腿切粒；番茄洋蔥切碎。",
        "融化少許牛油，炒軟洋蔥蒜蓉，下火腿和番茄。加 3 至 4 湯匙茄汁和少許糖煮 5 至 6 分鐘。",
        "拌入意粉。可撒切達芝士用焗爐或面火稍焗至溶。",
      ],
    },
  },
  {
    id: "home-chicken-steak-rice",
    name: "Chicken steak rice",
    cuisine: "Hong Kong",
    time: 30,
    servings: 2,
    need: ["Chicken breast", "Cooked rice", "Eggs"],
    optional: ["Flour", "Soy sauce", "Ketchup", "Butter", "Onion", "Salt", "Cornstarch", "Cooking oil", "Oyster sauce", "Ginger", "Garlic", "White pepper", "Sugar", "Bean sprouts", "Spring onion", "Shaoxing wine"],
    steps: [
      "Pound 2 chicken breasts flat; season with salt and soy sauce. Dust with flour if using, dip in beaten egg, and pan-fry 4–5 minutes per side until 74°C / 165°F.",
      "Optional gravy: soften onion in butter, add ketchup and a splash of water; simmer 3 minutes.",
      "Serve chicken over hot cooked rice; spoon gravy on top.",
    ],
    zh: {
      name: "雞扒飯",
      steps: [
        "兩塊雞胸拍扁，用鹽和生抽調味。可拍粉沾蛋液，每面煎 4 至 5 分鐘至全熟（74°C）。",
        "可另用牛油炒軟洋蔥，加茄汁和少許水煮 3 分鐘成汁。",
        "雞扒鋪熱飯上，淋汁即可。",
      ],
    },
  },
  {
    id: "home-pork-chop-noodles",
    name: "Pork chop egg noodles",
    cuisine: "Hong Kong",
    time: 30,
    servings: 2,
    need: ["Pork chops", "Noodles", "Eggs"],
    optional: ["Flour", "Soy sauce", "Onion", "Garlic", "Spring onion", "Salt", "Cornstarch", "Cooking oil", "Shaoxing wine", "Oyster sauce", "Chicken stock", "Sesame oil", "Sugar", "White pepper", "Carrots"],
    steps: [
      "Pound 2 pork chops; season with salt and soy sauce. Dust with flour, dip in beaten egg, and pan-fry 3–4 minutes per side until cooked through (74°C / 165°F).",
      "Boil noodles until tender; drain into bowls with a little hot water or light soy broth.",
      "Rest pork 2 minutes, slice if thick, and place on noodles. Soften onion/garlic for a quick pan sauce if you like; finish with spring onion.",
    ],
    zh: {
      name: "豬扒麵",
      steps: [
        "兩件豬扒拍鬆，加鹽生抽。拍粉沾蛋液，每面煎 3 至 4 分鐘至全熟（74°C）。",
        "麵煮軟瀝乾入碗，可加少許熱水或淡豉油湯。",
        "豬扒靜置兩分鐘，可切片鋪麵上；可炒洋蔥蒜蓉作汁，撒蔥花。",
      ],
    },
  },
  {
    id: "home-hk-egg-sandwich",
    name: "Scrambled egg sandwich (HK)",
    cuisine: "Hong Kong",
    time: 12,
    servings: 1,
    need: ["Eggs", "Bread", "Butter"],
    optional: ["Milk", "Ham", "Salt", "Spring onion"],
    steps: [
      "Butter 2 slices of bread (toast lightly if you like). Softly beat 2 eggs with a splash of milk and a pinch of salt.",
      "Melt butter on low–medium heat; scramble eggs until just set with no raw white (2–3 minutes).",
      "Pile eggs between bread; add a slice of ham if using. Cut in half and serve.",
    ],
    zh: {
      name: "炒蛋三文治",
      steps: [
        "兩片麵包塗牛油，可略烤。打散兩隻蛋，加少許牛奶和鹽。",
        "小至中火融化牛油，慢炒蛋 2 至 3 分鐘至剛好凝固、蛋白全熟。",
        "炒蛋夾入麵包，可加一片火腿，對半切開即食。",
      ],
    },
  },
  {
    id: "home-condensed-milk-toast",
    name: "Condensed milk toast",
    cuisine: "Hong Kong",
    time: 8,
    servings: 1,
    // Stand-in: Milk + Sugar for condensed milk
    need: ["Bread", "Butter", "Milk", "Sugar"],
    optional: ["Salt"],
    steps: [
      "Toast 1–2 thick slices of bread until golden. Warm 2 tbsp milk with 1–1½ tbsp sugar until dissolved (home condensed-milk stand-in).",
      "Spread butter generously on hot toast so it melts into the crumb.",
      "Drizzle the sweet milk over the buttered toast and serve immediately.",
    ],
    zh: {
      name: "煉奶多士",
      steps: [
        "烤香一至兩片厚麵包。兩湯匙牛奶加 1 至 1½ 湯匙糖加熱搅溶（代替煉奶）。",
        "趁熱厚塗牛油讓其滲入麵包。",
        "淋上甜奶汁即食。",
      ],
    },
  },
  {
    id: "home-baked-seafood-rice",
    name: "Baked seafood rice",
    cuisine: "Hong Kong",
    time: 40,
    servings: 2,
    need: ["Shrimp", "White fish", "Cooked rice", "Cheddar", "Milk"],
    optional: ["Butter", "Flour", "Onion", "Garlic", "Salt", "Cornstarch", "Pork chops", "Sugar", "White pepper", "Five-spice powder", "Oyster sauce", "Shaoxing wine", "Soy sauce", "Eggs", "Cooking oil", "Ketchup", "Sesame oil"],
    steps: [
      "Cut white fish into bite-size pieces; peel shrimp. Poach or pan-cook seafood 3–4 minutes until shrimp are opaque and fish flakes (fully cooked).",
      "Make a quick white sauce: melt butter, stir in 1 tbsp flour, whisk in 1 cup milk until thick (5 minutes). Season; fold in seafood.",
      "Spread cooked rice in a baking dish, top with seafood sauce and grated cheddar. Bake at 200°C / 400°F for 12–15 minutes until bubbling.",
    ],
    zh: {
      name: "焗海鮮飯",
      steps: [
        "白魚切件，蝦去殼。浸煮或快煎 3 至 4 分鐘至蝦轉色、魚肉熟透可散。",
        "融化牛油炒一湯匙麵粉，倒入一杯牛奶搅至稠（約 5 分鐘），調味後拌入海鮮。",
        "熟飯鋪焗盤，淋海鮮白汁撒切達芝士，200°C 焗 12 至 15 分鐘至起泡。",
      ],
    },
  },
  {
    id: "home-tomato-soup-macaroni",
    name: "Tomato soup macaroni",
    cuisine: "Hong Kong",
    time: 25,
    servings: 2,
    need: ["Pasta", "Tomato", "Onion"],
    optional: ["Carrots", "Celery", "Ketchup", "Sugar", "Salt", "Ham", "Butter"],
    steps: [
      "Chop 2–3 tomatoes and 1/2 onion (carrot/celery if using). Soften onion in a little butter or oil.",
      "Add tomato and cook 5 minutes until soft; add 3 cups water, ketchup, and a pinch of sugar. Simmer 8–10 minutes.",
      "Add pasta and cook in the soup until tender (8–10 minutes). Dice ham if using and warm through; season with salt.",
    ],
    zh: {
      name: "茄湯通粉",
      steps: [
        "切開兩至三個番茄和半個洋蔥（可加紅蘿蔔、西芹）。少油或牛油炒軟洋蔥。",
        "下番茄炒 5 分鐘，加水約三杯、茄汁和少許糖，煮 8 至 10 分鐘。",
        "下通粉在湯中煮 8 至 10 分鐘至軟；可加火腿粒焯熱，加鹽調味。",
      ],
    },
  },
  {
    id: "home-satay-beef-rice",
    name: "Beef satay on rice",
    cuisine: "Hong Kong",
    time: 25,
    servings: 2,
    need: ["Beef steak", "Cooked rice", "Peanut butter"],
    optional: ["Onion", "Garlic", "Soy sauce", "Chili oil", "Spring onion", "Sugar", "Ginger", "Eggs", "Oyster sauce", "White pepper", "Shaoxing wine", "Cornstarch", "Sesame oil"],
    steps: [
      "Slice 250 g beef steak thinly. Mix 2 tbsp peanut butter with soy sauce, a pinch of sugar, chili oil, and water into a pourable satay sauce.",
      "Stir-fry onion and garlic, then beef on high heat 2–3 minutes until just cooked through and browned.",
      "Pour in satay sauce; toss 1 minute until glossy. Spoon over hot cooked rice; finish with spring onion.",
    ],
    zh: {
      name: "沙爹牛肉飯",
      steps: [
        "牛扒約 250 克切薄片。兩湯匙花生醬加生抽、少許糖、辣椒油和水拌成沙爹汁。",
        "大火炒洋蔥蒜蓉，下牛肉炒 2 至 3 分鐘至熟上色。",
        "倒入沙爹汁炒約一分鐘至亮澤，鋪熱飯上，撒蔥花。",
      ],
    },
  },
  {
    id: "home-creamed-corn-soup",
    name: "Creamed corn soup",
    cuisine: "Hong Kong",
    time: 20,
    servings: 2,
    // Stand-in: Corn + Milk for creamed corn
    need: ["Corn", "Milk", "Eggs"],
    optional: ["Butter", "Cornstarch", "Sugar", "Salt", "Spring onion", "Chicken breast", "Carrots", "White pepper", "Sesame oil", "Cilantro"],
    steps: [
      "Strip kernels from 2 cobs (or use about 1½ cups corn). Simmer corn with 2 cups water and a knob of butter 8–10 minutes until soft.",
      "Stir in 1 cup milk; season with salt and a pinch of sugar. Thicken with a cornstarch slurry if you want it creamier.",
      "Beat 1–2 eggs; drizzle into the gently simmering soup while stirring to make ribbons. Fully set the egg; garnish with spring onion.",
    ],
    zh: {
      name: "粟米蓉湯",
      steps: [
        "兩條粟米刨粒（或約一杯半粟米）。加水兩杯和少許牛油煮 8 至 10 分鐘至軟。",
        "倒入一杯牛奶，加鹽和少許糖；可勾芡令湯更濃。",
        "打散一至兩隻蛋，邊攪邊倒下成蛋花至全熟，可撒蔥花。",
      ],
    },
  },
  {
    id: "home-ham-macaroni-soup",
    name: "Ham macaroni soup",
    cuisine: "Hong Kong",
    time: 20,
    servings: 2,
    need: ["Pasta", "Ham"],
    optional: ["Onion", "Carrots", "Celery", "Salt", "Butter", "Spring onion"],
    steps: [
      "Dice ham. Soften a little onion, carrot, or celery in butter if using.",
      "Add about 4 cups water or light stock and bring to a boil. Add pasta and cook until tender (8–10 minutes).",
      "Stir in ham and warm 1–2 minutes (no egg). Season with salt; finish with spring onion.",
    ],
    zh: {
      name: "火腿通粉湯",
      steps: [
        "火腿切粒。可先用牛油炒軟少許洋蔥、紅蘿蔔或西芹。",
        "加水或清湯約四杯煮滾，下通粉煮 8 至 10 分鐘至軟。",
        "加入火腿焯熱 1 至 2 分鐘（不加蛋），加鹽調味，可撒蔥花。",
      ],
    },
  },
  {
    id: "home-beef-fried-noodles",
    name: "Fried noodle with beef",
    cuisine: "Hong Kong",
    time: 25,
    servings: 2,
    need: ["Noodles", "Beef steak", "Bean sprouts"],
    optional: ["Onion", "Spring onion", "Soy sauce", "Oyster sauce", "Garlic", "Cabbage", "White pepper", "Ginger", "Cooking oil", "Shaoxing wine", "Salt"],
    steps: [
      "Slice 200 g beef thinly; toss with soy sauce. Boil or rinse noodles until just loose; drain well.",
      "Stir-fry beef on high heat 1–2 minutes until browned; remove. Stir-fry onion, garlic, and cabbage if using.",
      "Add noodles with oyster sauce and soy sauce; toss until hot. Return beef and bean sprouts; cook 1 more minute.",
    ],
    zh: {
      name: "牛肉炒麵",
      steps: [
        "牛肉約 200 克切絲加生抽略醃。麵煮或過水至鬆散瀝乾。",
        "大火快炒牛肉 1 至 2 分鐘至上色盛起；炒洋蔥蒜蓉（可加椰菜）。",
        "下面加蠔油生抽炒熱，回牛肉和芽菜再炒一分鐘。",
      ],
    },
  },
  {
    id: "home-pineapple-chicken",
    name: "Pineapple chicken",
    cuisine: "Hong Kong",
    time: 30,
    servings: 2,
    // Stand-in: Orange juice + Ketchup + Sugar + Vinegar for café sweet-sour; Orange as fruit chunks
    need: ["Chicken thighs", "Orange juice", "Ketchup", "Sugar"],
    optional: ["Orange", "Bell pepper", "Onion", "Vinegar", "Cornstarch", "Soy sauce", "Garlic", "Salt"],
    steps: [
      "Cut 400 g chicken thighs into bite-size pieces; toss with salt, soy sauce, and a little cornstarch. Pan-fry until golden and cooked through (74°C / 165°F); remove.",
      "Stir-fry onion and bell pepper if using. Mix 1/2 cup orange juice, 3 tbsp ketchup, 1–2 tbsp sugar, and 1 tbsp vinegar into a sweet-sour sauce (pineapple stand-in).",
      "Pour sauce into the pan; simmer 2–3 minutes until glossy. Return chicken; add orange segments if using. Toss until coated and hot.",
    ],
    zh: {
      name: "菠蘿雞",
      steps: [
        "雞脾約 400 克切件，加鹽、生抽和少許生粉。煎至金黃全熟（74°C）盛起。",
        "可炒洋蔥彩椒。半杯橙汁、三湯匙茄汁、1 至 2 湯匙糖和一湯匙醋拌成酸甜汁（代替菠蘿汁）。",
        "倒入鑊煮 2 至 3 分鐘至亮澤，回雞，可加橙肉拌勻炒熱。",
      ],
    },
  },
]
