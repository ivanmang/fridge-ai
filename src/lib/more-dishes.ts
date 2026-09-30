import type { Recipe } from "@/lib/recipes"

/** Tested, kitchen-sized recipes — the cookable core for Tonight. */
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
  {
    id: "home-soy-eggs-rice", name: "Soy sauce eggs on rice", cuisine: "Hong Kong", time: 12, servings: 1,
    need: ["Eggs", "Cooked rice", "Soy sauce"], optional: ["Spring onion", "Sesame oil"],
    steps: [
      "Warm a bowl of cooked rice. Beat 2 eggs with a pinch of salt.",
      "Scramble the eggs in a lightly oiled pan until softly set.",
      "Spoon over rice, drizzle soy sauce and a drop of sesame oil, and top with spring onion.",
    ],
    zh: { name: "豉油蛋飯", steps: ["熱好一碗飯。打散兩隻蛋，加少許鹽。", "熱鑊下少許油炒蛋至嫩滑。", "鋪在飯上，淋生抽和少許麻油，可撒蔥花。"] },
  },
  {
    id: "home-garlic-pak-choi", name: "Garlic pak choi", cuisine: "Cantonese", time: 10, servings: 2,
    need: ["Pak choi", "Garlic"], optional: ["Oyster sauce"],
    steps: [
      "Halve or quarter pak choi lengthwise and rinse well. Mince 2 garlic cloves.",
      "Stir-fry garlic in a little oil for 20 seconds, then add pak choi and a splash of water.",
      "Cover for 2–3 minutes until stems are tender. Finish with oyster sauce if you like.",
    ],
    zh: { name: "蒜蓉白菜", steps: ["白菜切開洗淨，拍碎兩瓣蒜。", "熱油爆香蒜蓉，下白菜和少許水。", "蓋煮兩三分鐘至菜莖變軟，可加蠔油。"] },
  },
  {
    id: "home-egg-drop-soup", name: "Egg drop soup", cuisine: "Chinese", time: 12, servings: 2,
    need: ["Eggs", "Spring onion"], optional: ["Corn", "Sesame oil"],
    steps: [
      "Bring 3 cups of water or light stock to a gentle simmer. Beat 2 eggs.",
      "Stir the pot in a circle and slowly pour in the eggs to make ribbons.",
      "Season lightly, add spring onion and a drop of sesame oil, and serve.",
    ],
    zh: { name: "蛋花湯", steps: ["三杯水或清湯煮至微滾，打散兩隻蛋。", "邊攪湯邊慢慢倒入蛋液成蛋花。", "調味，加蔥花和少許麻油即可。"] },
  },
  {
    id: "home-congee-ginger", name: "Ginger rice congee", cuisine: "Cantonese", time: 45, servings: 2,
    need: ["Rice", "Ginger"], optional: ["Spring onion", "Century egg"],
    steps: [
      "Rinse 1/2 cup rice. Slice a thumb of ginger.",
      "Simmer rice with 5 cups water and ginger, stirring now and then, until thick and creamy (35–40 minutes).",
      "Season lightly. Serve with spring onion, and century egg if you have it.",
    ],
    zh: { name: "薑絲白粥", steps: ["洗半杯米，薑切片。", "米加水約五杯和薑，小火煮 35 至 40 分鐘至稠滑，不時攪拌。", "調味後撒蔥花，有皮蛋可加。"] },
  },
  {
    id: "home-tofu-scramble", name: "Soft tofu scramble", cuisine: "Chinese", time: 15, servings: 2,
    need: ["Tofu", "Eggs", "Spring onion"], optional: ["Soy sauce", "Garlic"],
    steps: [
      "Drain soft tofu and roughly break it up. Beat 2 eggs; slice spring onion.",
      "Cook garlic if using, then add tofu and eggs. Stir gently over medium heat until eggs are set.",
      "Season with soy sauce and finish with spring onion.",
    ],
    zh: { name: "豆腐炒蛋", steps: ["軟豆腐瀝乾用手略略弄散，打散兩隻蛋，切蔥花。", "有蒜可先爆香，再下豆腐和蛋，中火輕輕炒至蛋凝固。", "加生抽調味，撒蔥花。"] },
  },
  {
    id: "home-chicken-veg-stirfry", name: "Chicken & greens stir-fry", cuisine: "Cantonese", time: 25, servings: 2,
    need: ["Chicken breast", "Choi sum", "Garlic"], optional: ["Ginger", "Soy sauce"],
    steps: [
      "Slice 250 g chicken and a bunch of choi sum. Mince garlic; slice ginger if using.",
      "Stir-fry chicken until opaque and cooked through (74°C / 165°F); set aside.",
      "Stir-fry greens and aromatics 3 minutes, return chicken, splash soy sauce, and toss.",
    ],
    zh: { name: "雞片炒菜心", steps: ["雞胸約 250 克切片，菜心切段，蒜蓉，有薑可切片。", "先炒雞肉至全熟（中心達 74°C），盛起。", "再炒菜和香料約三分鐘，回鍋雞肉，加生抽拌勻。"] },
  },
  {
    id: "home-tomato-egg-soup", name: "Tomato egg soup", cuisine: "Chinese", time: 15, servings: 2,
    need: ["Tomato", "Eggs"], optional: ["Spring onion", "Corn"],
    steps: [
      "Cut 2 tomatoes into wedges. Beat 2 eggs.",
      "Cook tomatoes in a little oil until soft, then add 3 cups water and simmer 5 minutes.",
      "Stir in the eggs to make ribbons. Season and top with spring onion.",
    ],
    zh: { name: "番茄蛋花湯", steps: ["兩個番茄切角，打散兩隻蛋。", "少許油炒軟番茄，加水三杯煮五分鐘。", "倒入蛋液成蛋花，調味後撒蔥花。"] },
  },
  {
    id: "home-milk-french-toast", name: "Milk French toast", cuisine: "Breakfast", time: 15, servings: 2,
    need: ["Bread", "Eggs", "Milk"], optional: ["Butter", "Honey"],
    steps: [
      "Beat 2 eggs with 1/2 cup milk and a pinch of salt. Soak 4 bread slices briefly.",
      "Cook in a lightly buttered pan over medium heat until both sides are golden and the center is set.",
      "Serve hot with honey if you like.",
    ],
    zh: { name: "牛奶西多士", steps: ["兩隻蛋加半杯牛奶和少許鹽打勻，四片包略浸。", "牛油鑊中火兩面煎至金黃，中間熟透。", "趁熱吃，可加蜜糖。"] },
  },
  {
    id: "home-cheese-toast", name: "Cheese toast", cuisine: "Breakfast", time: 10, servings: 1,
    need: ["Bread", "Cheddar"], optional: ["Butter", "Tomato"],
    steps: [
      "Heat the grill or a covered pan. Butter bread if you like and top with cheddar slices.",
      "Toast until the cheese melts. Add tomato slices for the last minute if using.",
      "Serve immediately while the cheese is gooey.",
    ],
    zh: { name: "芝士多士", steps: ["預熱焗爐或有蓋鑊。包可塗牛油，鋪芝士片。", "焗至芝士融化，有番茄可最後一分鐘加上。", "趁熱吃。"] },
  },
  {
    id: "home-luncheon-fried-rice", name: "Luncheon meat fried rice", cuisine: "Hong Kong", time: 18, servings: 2,
    need: ["Cooked rice", "Luncheon meat", "Eggs"], optional: ["Spring onion", "Soy sauce"],
    steps: [
      "Dice luncheon meat and break up 2 bowls of cold rice. Beat 2 eggs.",
      "Brown the meat in a little oil, scramble in the eggs, then add rice and toss until hot.",
      "Season with soy sauce and spring onion.",
    ],
    zh: { name: "餐肉炒飯", steps: ["餐肉切粒，兩碗冷飯弄散，打散兩隻蛋。", "少許油先煎香餐肉，炒入蛋，再加飯炒熱。", "加生抽和蔥花即可。"] },
  },
  {
    id: "home-spam-eggs", name: "Luncheon meat & eggs", cuisine: "Hong Kong", time: 12, servings: 1,
    need: ["Luncheon meat", "Eggs", "Cooked rice"], optional: ["Soy sauce"],
    steps: [
      "Slice luncheon meat. Warm rice in a bowl.",
      "Pan-fry the meat until browned, then fry 1–2 eggs to your liking.",
      "Serve over rice with a splash of soy sauce.",
    ],
    zh: { name: "餐肉蛋飯", steps: ["餐肉切片，熱好一碗飯。", "煎香餐肉，再煎蛋至喜歡的熟度。", "鋪在飯上，可淋少許生抽。"] },
  },
  {
    id: "home-shrimp-egg", name: "Shrimp & scrambled egg", cuisine: "Cantonese", time: 15, servings: 2,
    need: ["Shrimp", "Eggs"], optional: ["Spring onion", "Sesame oil"],
    steps: [
      "Pat shrimp dry and season lightly. Beat 3 eggs.",
      "Quickly cook shrimp in a hot oiled pan until just pink and opaque; set aside.",
      "Scramble eggs softly, fold shrimp back in with spring onion, and finish with sesame oil.",
    ],
    zh: { name: "蝦仁炒蛋", steps: ["蝦抹乾略調味，打散三隻蛋。", "熱油快炒蝦至變色全熟，盛起。", "炒嫩蛋，拌回蝦和蔥花，可加少許麻油。"] },
  },
  {
    id: "home-garlic-shrimp", name: "Garlic shrimp", cuisine: "Cantonese", time: 15, servings: 2,
    need: ["Shrimp", "Garlic"], optional: ["Spring onion", "Soy sauce"],
    steps: [
      "Pat shrimp dry. Mince 3 garlic cloves.",
      "Sauté garlic in oil until fragrant, then add shrimp and cook until opaque throughout.",
      "Splash soy sauce if using, toss with spring onion, and serve.",
    ],
    zh: { name: "蒜蓉蝦", steps: ["蝦抹乾，拍碎三瓣蒜。", "熱油爆香蒜蓉，下蝦炒至全熟變色。", "可加生抽，撒蔥花拌勻。"] },
  },
  {
    id: "home-tuna-mayo-rice", name: "Tuna mayo rice bowl", cuisine: "Japanese", time: 10, servings: 1,
    need: ["Canned tuna", "Cooked rice", "Mayonnaise"], optional: ["Spring onion", "Soy sauce"],
    steps: [
      "Drain tuna and mix with mayonnaise and a dash of soy sauce if you like.",
      "Warm a bowl of rice and spoon the tuna on top.",
      "Finish with spring onion.",
    ],
    zh: { name: "吞拿魚飯", steps: ["吞拿魚瀝乾，拌蛋黃醬，可加少許生抽。", "熱一碗飯，鋪上吞拿魚。", "撒蔥花即可。"] },
  },
  {
    id: "home-mapo-tofu-simple", name: "Simple mapo-style tofu", cuisine: "Sichuan", time: 25, servings: 2,
    need: ["Tofu", "Ground pork", "Garlic"], optional: ["Ginger", "Chili oil", "Spring onion"],
    steps: [
      "Cube tofu; mince garlic and ginger. Brown 150 g ground pork in a little oil.",
      "Add aromatics, then a splash of water and chili oil if using. Nestle in tofu and simmer 5–7 minutes.",
      "Season and top with spring onion. Serve with rice.",
    ],
    zh: { name: "簡易麻婆豆腐", steps: ["豆腐切件，蒜薑切碎。約 150 克免治豬肉下油炒香。", "加香料，再加水及可加辣油，放入豆腐煮 5 至 7 分鐘。", "調味撒蔥花，配飯吃。"] },
  },
  {
    id: "home-pork-mince-noodles", name: "Pork mince noodles", cuisine: "Chinese", time: 20, servings: 2,
    need: ["Ground pork", "Noodles", "Garlic"], optional: ["Spring onion", "Soy sauce", "Chili oil"],
    steps: [
      "Cook noodles per pack; drain. Brown ground pork with garlic.",
      "Add soy sauce and a splash of water to make a light sauce.",
      "Toss with noodles and spring onion; add chili oil if you like heat.",
    ],
    zh: { name: "免治肉拌麵", steps: ["麵煮熟瀝乾。免治肉加蒜炒香。", "加生抽和少許水成醬。", "拌入麵和蔥花，可加辣油。"] },
  },
  {
    id: "home-oyster-gai-lan", name: "Oyster sauce gai lan", cuisine: "Cantonese", time: 12, servings: 2,
    need: ["Gai lan", "Garlic", "Oyster sauce"], optional: ["Ginger"],
    steps: [
      "Trim gai lan and cut into lengths. Blanch or steam 2–3 minutes until stems soften.",
      "Quickly fry garlic (and ginger) in oil, then add oyster sauce and a splash of water.",
      "Pour the sauce over the greens and serve.",
    ],
    zh: { name: "蠔油芥蘭", steps: ["芥蘭切段，焯或蒸兩三分鐘至菜莖軟。", "蒜（和薑）爆香，加蠔油和少許水。", "淋在菜上即可。"] },
  },
  {
    id: "home-broccoli-garlic", name: "Garlic broccoli", cuisine: "Chinese", time: 15, servings: 2,
    need: ["Broccoli", "Garlic"], optional: ["Soy sauce", "Sesame oil"],
    steps: [
      "Cut broccoli into florets. Blanch 2 minutes and drain.",
      "Stir-fry garlic in oil, add broccoli and a splash of water; cover briefly.",
      "Season with soy sauce and a drop of sesame oil.",
    ],
    zh: { name: "蒜蓉西蘭花", steps: ["西蘭花切小朵，焯兩分鐘瀝乾。", "熱油爆蒜，下西蘭花加少許水略蓋煮。", "加生抽和少許麻油。"] },
  },
  {
    id: "home-cabbage-stirfry", name: "Garlic cabbage stir-fry", cuisine: "Chinese", time: 12, servings: 2,
    need: ["Cabbage", "Garlic"], optional: ["Carrots", "Soy sauce"],
    steps: [
      "Shred cabbage (and carrot if using). Mince garlic.",
      "Stir-fry garlic, then cabbage over high heat with a splash of water until just tender.",
      "Season with soy sauce.",
    ],
    zh: { name: "蒜蓉炒椰菜", steps: ["椰菜切絲，有紅蘿蔔也可切絲，拍蒜。", "爆香蒜蓉，大火炒椰菜，加少許水至剛軟。", "生抽調味。"] },
  },
  {
    id: "home-potato-stirfry", name: "Shredded potato stir-fry", cuisine: "Chinese", time: 20, servings: 2,
    need: ["Potato", "Garlic"], optional: ["Vinegar", "Chili oil", "Spring onion"],
    steps: [
      "Peel and julienne 2 potatoes; rinse and pat dry. Mince garlic.",
      "Stir-fry garlic, then potato over medium-high heat until tender-crisp (6–8 minutes).",
      "Splash vinegar if using, season, and finish with chili oil or spring onion.",
    ],
    zh: { name: "醋溜土豆絲", steps: ["兩隻薯仔去皮切絲，沖水抹乾，拍蒜。", "爆香蒜蓉，中大火炒薯絲 6 至 8 分鐘至爽口。", "可加少許醋、辣油或蔥花。"] },
  },
  {
    id: "home-egg-noodles-veg", name: "Veggie egg noodles", cuisine: "Hong Kong", time: 18, servings: 2,
    need: ["Noodles", "Eggs", "Choi sum"], optional: ["Garlic", "Soy sauce"],
    steps: [
      "Cook noodles; drain. Beat 2 eggs; cut choi sum into pieces.",
      "Scramble eggs, stir-fry greens with garlic, then toss everything with soy sauce.",
      "Serve hot.",
    ],
    zh: { name: "菜心蛋炒麵", steps: ["麵煮熟瀝乾，打散兩隻蛋，菜心切段。", "先炒蛋，再炒菜和蒜，全部加生抽拌勻。", "趁熱吃。"] },
  },
  {
    id: "home-beef-tomato", name: "Tomato beef skillet", cuisine: "Hong Kong", time: 30, servings: 2,
    need: ["Beef steak", "Tomato", "Onion"], optional: ["Garlic", "Soy sauce", "Sugar"],
    steps: [
      "Slice 250 g beef thinly against the grain. Cut tomatoes and onion.",
      "Sear beef quickly until just browned; set aside. Cook onion and tomato until saucy.",
      "Return beef, season with soy sauce and a pinch of sugar, and simmer 1–2 minutes. Do not overcook.",
    ],
    zh: { name: "番茄牛肉", steps: ["約 250 克牛扒逆紋切片，番茄和洋蔥切件。", "大火快炒牛肉至剛變色盛起，再煮洋蔥番茄成醬。", "回鍋牛肉，加生抽和少許糖煮一兩分鐘，勿過老。"] },
  },
  {
    id: "home-pork-chop-rice", name: "Pan-fried pork with rice", cuisine: "Hong Kong", time: 30, servings: 2,
    need: ["Pork chops", "Eggs", "Cooked rice"], optional: ["Onion", "Soy sauce"],
    steps: [
      "Pound pork chops lightly and season. Beat an egg for coating if you like.",
      "Pan-fry pork over medium heat until cooked through (63°C / 145°F, then rest).",
      "Serve over rice with onion gravy or a splash of soy sauce.",
    ],
    zh: { name: "煎豬扒飯", steps: ["豬扒略拍鬆調味，可沾蛋液。", "中火煎至全熟（中心約 63°C，休息一下）。", "配熱飯，可加洋蔥汁或生抽。"] },
  },
  {
    id: "home-bacon-egg-rice", name: "Bacon egg rice", cuisine: "Western", time: 15, servings: 1,
    need: ["Bacon", "Eggs", "Cooked rice"], optional: ["Spring onion"],
    steps: [
      "Cook bacon until crisp; drain excess fat if needed.",
      "Fry eggs in the same pan. Warm rice in a bowl.",
      "Top rice with bacon and eggs; add spring onion if you like.",
    ],
    zh: { name: "培根蛋飯", steps: ["煎香培根，可倒走多餘油。", "同鑊煎蛋，熱好一碗飯。", "鋪上培根和蛋，可撒蔥花。"] },
  },
  {
    id: "home-kimchi-fried-rice", name: "Kimchi fried rice", cuisine: "Korean", time: 18, servings: 2,
    need: ["Cooked rice", "Kimchi", "Eggs"], optional: ["Spring onion", "Sesame oil", "Luncheon meat"],
    steps: [
      "Chop kimchi. Beat 2 eggs. Break up cold rice.",
      "Stir-fry kimchi (and diced luncheon meat if using), add rice, and toss until hot.",
      "Push aside and scramble eggs, mix through, and finish with sesame oil and spring onion.",
    ],
    zh: { name: "泡菜炒飯", steps: ["泡菜切碎，打散兩隻蛋，冷飯弄散。", "先炒泡菜（可加餐肉粒），再加飯炒熱。", "推開炒蛋拌勻，加麻油和蔥花。"] },
  },
  {
    id: "home-spinach-garlic", name: "Garlic spinach", cuisine: "Chinese", time: 8, servings: 2,
    need: ["Spinach", "Garlic"], optional: ["Sesame oil", "Soy sauce"],
    steps: [
      "Wash spinach well. Mince garlic.",
      "Stir-fry garlic briefly, add spinach, and toss until just wilted.",
      "Season with soy sauce and a drop of sesame oil.",
    ],
    zh: { name: "蒜蓉菠菜", steps: ["菠菜洗淨，拍蒜。", "爆香蒜蓉，下菠菜炒至剛軟。", "加生抽和少許麻油。"] },
  },
  {
    id: "home-mushroom-rice", name: "Garlic mushroom rice", cuisine: "Cantonese", time: 20, servings: 2,
    need: ["Mushroom", "Garlic", "Cooked rice"], optional: ["Soy sauce", "Spring onion"],
    steps: [
      "Slice mushrooms; mince garlic. Loosen cooked rice.",
      "Sauté mushrooms until browned and their liquid cooks off; add garlic for the last minute.",
      "Toss with rice, soy sauce, and spring onion until steaming hot.",
    ],
    zh: { name: "蒜香蘑菇飯", steps: ["蘑菇切片，拍蒜，弄散熟飯。", "炒香蘑菇至出水收乾，最後一分鐘加蒜。", "拌飯、生抽和蔥花炒熱。"] },
  },
  {
    id: "home-cucumber-salad", name: "Smashed cucumber salad", cuisine: "Chinese", time: 10, servings: 2,
    need: ["Cucumber", "Garlic"], optional: ["Vinegar", "Sesame oil", "Soy sauce"],
    steps: [
      "Smash cucumber with the side of a knife and tear into chunks. Mince garlic.",
      "Toss with garlic, vinegar, soy sauce, and sesame oil.",
      "Rest 5 minutes and serve cold.",
    ],
    zh: { name: "拍青瓜", steps: ["青瓜拍裂撕塊，拍蒜。", "拌蒜蓉、醋、生抽和麻油。", "靜置五分鐘冷食。"] },
  },
  {
    id: "home-carrot-egg", name: "Carrot egg scramble", cuisine: "Chinese", time: 12, servings: 2,
    need: ["Carrots", "Eggs"], optional: ["Spring onion", "Soy sauce"],
    steps: [
      "Julienne or grate a carrot. Beat 3 eggs.",
      "Stir-fry carrot 2–3 minutes until softening, then add eggs and scramble together.",
      "Season and finish with spring onion.",
    ],
    zh: { name: "紅蘿蔔炒蛋", steps: ["紅蘿蔔切絲或刨絲，打散三隻蛋。", "先炒紅蘿蔔兩三分鐘，倒入蛋液一起炒。", "調味撒蔥花。"] },
  },
  {
    id: "home-sweet-potato-boil", name: "Boiled sweet potato", cuisine: "Hong Kong", time: 25, servings: 2,
    need: ["Sweet potato"], optional: ["Honey"],
    steps: [
      "Wash sweet potatoes; leave whole or cut into large chunks.",
      "Boil or steam 15–20 minutes until a fork slides in easily.",
      "Serve warm, with a drizzle of honey if you like.",
    ],
    zh: { name: "煮蕃薯", steps: ["蕃薯洗淨，可原個或切大件。", "水煮或蒸 15 至 20 分鐘至叉得入。", "趁暖吃，可淋蜜糖。"] },
  },
  {
    id: "home-avocado-toast", name: "Avocado toast", cuisine: "Western", time: 8, servings: 1,
    need: ["Avocado", "Bread"], optional: ["Eggs", "Lemon"],
    steps: [
      "Toast bread. Mash avocado with a pinch of salt and lemon if using.",
      "Spread on toast. Top with a fried or boiled egg if you like.",
      "Eat immediately.",
    ],
    zh: { name: "牛油果多士", steps: ["烘包。牛油果壓蓉，加少許鹽，可加檸檬汁。", "塗在多士上，可加煎蛋或水蛋。", "即食。"] },
  },
  {
    id: "home-yogurt-bowl", name: "Yogurt fruit bowl", cuisine: "Breakfast", time: 5, servings: 1,
    need: ["Yogurt", "Banana"], optional: ["Berries", "Honey", "Peanut butter"],
    steps: [
      "Spoon yogurt into a bowl. Slice banana on top.",
      "Add berries and a drizzle of honey or peanut butter if you have them.",
      "Eat cold.",
    ],
    zh: { name: "乳酪水果碗", steps: ["乳酪盛碗，鋪香蕉片。", "可加莓果、蜜糖或花生醬。", "凍食。"] },
  },
  {
    id: "home-onion-egg", name: "Onion scrambled eggs", cuisine: "Chinese", time: 12, servings: 2,
    need: ["Eggs", "Onion"], optional: ["Soy sauce", "Spring onion"],
    steps: [
      "Slice half an onion thinly. Beat 3 eggs.",
      "Cook onion until soft and sweet, then scramble in the eggs.",
      "Season lightly and finish with spring onion.",
    ],
    zh: { name: "洋蔥炒蛋", steps: ["半個洋蔥切絲，打散三隻蛋。", "先炒軟洋蔥，再倒入蛋液炒熟。", "調味可撒蔥花。"] },
  },
  {
    id: "home-bell-pepper-egg", name: "Pepper & egg stir-fry", cuisine: "Chinese", time: 12, servings: 2,
    need: ["Bell pepper", "Eggs"], optional: ["Garlic", "Soy sauce"],
    steps: [
      "Slice bell pepper. Beat 3 eggs.",
      "Stir-fry pepper until slightly blistered, scramble in eggs with garlic if using.",
      "Season with soy sauce.",
    ],
    zh: { name: "青椒炒蛋", steps: ["燈籠椒切片，打散三隻蛋。", "先炒香椒片，再倒蛋液（可加蒜）炒熟。", "生抽調味。"] },
  },
  {
    id: "home-leftover-fried-rice", name: "Fridge leftover fried rice", cuisine: "Hong Kong", time: 15, servings: 2,
    need: ["Cooked rice", "Eggs", "Cooked leftovers"], optional: ["Spring onion", "Soy sauce", "Garlic"],
    steps: [
      "Dice leftovers and break up cold rice. Beat 2 eggs.",
      "Scramble eggs, add leftovers to warm through, then toss with rice until steaming hot.",
      "Season with soy sauce and spring onion. Make sure leftovers are heated thoroughly.",
    ],
    zh: { name: "隔夜菜炒飯", steps: ["剩菜切粒，冷飯弄散，打散兩隻蛋。", "先炒蛋，加熱剩菜，再加飯炒至熱透。", "加生抽和蔥花。確保剩菜徹底加熱。"] },
  },
  {
    id: "home-salmon-ginger", name: "Ginger steamed salmon", cuisine: "Cantonese", time: 20, servings: 2,
    need: ["Salmon", "Ginger"], optional: ["Spring onion", "Soy sauce", "Sesame oil"],
    steps: [
      "Slice ginger into matchsticks. Place on salmon fillets in a heatproof dish.",
      "Steam 8–12 minutes until the fish flakes and reaches 63°C / 145°F in the center.",
      "Dress with soy sauce, sesame oil, and spring onion.",
    ],
    zh: { name: "薑蔥蒸三文魚", steps: ["薑切絲，鋪在三文魚上，放入耐熱碟。", "蒸約 8 至 12 分鐘至可拆、中心達 63°C。", "淋生抽、麻油，撒蔥花。"] },
  },
  {
    id: "home-white-fish-soy", name: "Soy steamed white fish", cuisine: "Cantonese", time: 20, servings: 2,
    need: ["White fish", "Ginger", "Spring onion"], optional: ["Soy sauce", "Sesame oil"],
    steps: [
      "Scatter ginger over white fish fillets.",
      "Steam until opaque and flakes easily (about 8–10 minutes; 63°C / 145°F).",
      "Top with spring onion, soy sauce, and sesame oil.",
    ],
    zh: { name: "蒸魚", steps: ["魚柳鋪薑絲。", "蒸約 8 至 10 分鐘至熟透可拆（中心約 63°C）。", "加蔥花、生抽和麻油。"] },
  },
  {
    id: "home-beans-tomato", name: "Tomato beans skillet", cuisine: "Western", time: 15, servings: 2,
    need: ["Beans", "Tomato", "Garlic"], optional: ["Onion", "Olive oil", "Bread"],
    steps: [
      "Drain canned beans. Chop tomato; mince garlic.",
      "Cook garlic (and onion) in olive oil, add tomato and beans, and simmer 8 minutes.",
      "Season and serve with bread if you like.",
    ],
    zh: { name: "番茄焗豆", steps: ["豆瀝乾，番茄切件，拍蒜。", "油爆蒜（和洋蔥），加番茄和豆煮約八分鐘。", "調味，可配麵包。"] },
  },
  {
    id: "home-hk-macaroni", name: "HK-style macaroni soup", cuisine: "Hong Kong", time: 20, servings: 2,
    need: ["Pasta", "Ham"], optional: ["Eggs", "Spring onion", "Milk"],
    steps: [
      "Boil elbow pasta in lightly salted water until tender; drain, saving a cup of the cooking water.",
      "Return pasta to the pot with enough cooking water (or a splash of milk) to make a light soup. Add diced ham and simmer 2 minutes.",
      "Slip in a softly boiled or scrambled egg if you like. Season lightly and finish with spring onion.",
    ],
    zh: { name: "港式通粉湯", steps: ["通粉用淡鹽水煮至軟身，瀝乾，留一杯煮水。", "通粉加回煮水（或少許牛奶）成清湯，加入切粒火腿煮兩分鐘。", "可加溫泉蛋或炒蛋，調味後撒蔥花。"] },
  },
  {
    id: "home-spring-onion-noodles", name: "Spring onion oil noodles", cuisine: "Chinese", time: 15, servings: 2,
    need: ["Noodles", "Spring onion", "Soy sauce"], optional: ["Garlic", "Sesame oil"],
    steps: [
      "Cook noodles until just tender; drain. Slice a generous handful of spring onion.",
      "Warm a little oil in a pan and fry the spring onion (and garlic) until fragrant but not burnt.",
      "Toss noodles with the onion oil, soy sauce, and a drop of sesame oil. Serve hot.",
    ],
    zh: { name: "蔥油拌麵", steps: ["麵煮至剛好熟，瀝乾。切一大把蔥花。", "熱鑊下少許油，爆香蔥花（和蒜），勿焦。", "麵加蔥油、生抽和少許麻油拌勻。"] },
  },
  {
    id: "home-cold-soy-tofu", name: "Cold soy tofu", cuisine: "Chinese", time: 8, servings: 2,
    need: ["Tofu", "Soy sauce"], optional: ["Spring onion", "Sesame oil", "Garlic"],
    steps: [
      "Drain tofu and cut into thick slabs or cubes. Pat dry.",
      "Arrange on a plate. Mix soy sauce with a little sesame oil and minced garlic if using.",
      "Spoon the sauce over the tofu and top with spring onion. Serve cold or at room temperature.",
    ],
    zh: { name: "涼伴豆腐", steps: ["豆腐瀝乾切厚片或丁，抹乾。", "擺碟。生抽加少許麻油和蒜蓉拌勻。", "淋在豆腐上，撒蔥花，凍食或室溫即可。"] },
  },
  {
    id: "home-tomato-egg-noodles", name: "Tomato egg noodles", cuisine: "Chinese", time: 20, servings: 2,
    need: ["Tomato", "Eggs", "Noodles"], optional: ["Spring onion", "Soy sauce", "Garlic"],
    steps: [
      "Cook noodles and set aside. Beat 2 eggs; cut 2 tomatoes into wedges.",
      "Scramble eggs lightly and remove. Cook tomatoes with a splash of water until saucy.",
      "Fold eggs back in, toss with the noodles, and finish with spring onion.",
    ],
    zh: { name: "番茄蛋麵", steps: ["煮麵備用。打散兩隻蛋，切開兩個番茄。", "先炒蛋盛起；番茄加水煮成醬。", "拌回雞蛋，撈入麵，撒蔥花。"] },
  },
  {
    id: "home-chinese-sausage-rice", name: "Chinese sausage rice", cuisine: "Cantonese", time: 30, servings: 2,
    need: ["Chinese sausage", "Rice"], optional: ["Spring onion", "Soy sauce", "Eggs"],
    steps: [
      "Rinse 1 cup of rice. Slice 2 Chinese sausages on the diagonal.",
      "Cook rice as usual. In the last 10 minutes, steam the sausage slices on top of the rice (or pan-fry briefly and serve over).",
      "Fluff the rice with the sausage oils, add soy sauce if you like, and top with spring onion or a fried egg.",
    ],
    zh: { name: "臘腸飯", steps: ["洗一杯米。兩條臘腸斜切。", "照常煮飯，最後約十分鐘把臘腸鋪在飯面蒸（或另煎後鋪上）。", "用臘腸油拌飯，可加生抽，撒蔥花或加煎蛋。"] },
  },
  {
    id: "home-egg-mayo-toast", name: "Egg mayo toast", cuisine: "Western", time: 12, servings: 1,
    need: ["Eggs", "Bread", "Mayonnaise"], optional: ["Spring onion", "Butter"],
    steps: [
      "Hard-boil 2 eggs (about 9 minutes), cool briefly, peel, and mash with mayonnaise and a pinch of salt.",
      "Toast bread; butter lightly if you like.",
      "Spread the egg mayo, top with spring onion, and serve.",
    ],
    zh: { name: "蛋沙拉多士", steps: ["水煮蛋約九分鐘，稍涼去殼，加蛋黃醬和少許鹽壓碎。", "多士烘熱，可塗少許牛油。", "抹上蛋沙拉，撒蔥花即可。"] },
  },
  {
    id: "home-soy-chicken-thigh", name: "Soy chicken thighs", cuisine: "Cantonese", time: 30, servings: 2,
    need: ["Chicken thighs", "Soy sauce", "Ginger"], optional: ["Garlic", "Spring onion", "Honey"],
    steps: [
      "Pat 2–3 chicken thighs dry. Slice a thumb of ginger (and garlic if using).",
      "Brown the skin side in a lightly oiled pan, then add ginger, a splash of water, soy sauce, and a little honey if you have it.",
      "Cover and cook over medium-low until the thighs reach 74°C / 165°F. Rest 3 minutes; finish with spring onion.",
    ],
    zh: { name: "豉油雞腿", steps: ["抹乾兩至三隻雞腿。薑切片（有蒜可拍碎）。", "鑊中少油先煎皮面，加薑、少許水、生抽，可加蜂蜜。", "蓋蓋中小火煮至中心 74°C，焗三分鐘，撒蔥花。"] },
  },
  {
    id: "home-silken-tofu-savory", name: "Savory silken tofu", cuisine: "Chinese", time: 10, servings: 2,
    need: ["Silken tofu", "Soy sauce"], optional: ["Spring onion", "Sesame oil", "Century egg"],
    steps: [
      "Unmold silken tofu onto a plate carefully.",
      "If using century egg, chop and scatter over the tofu.",
      "Drizzle soy sauce and sesame oil, top with spring onion, and serve chilled or at room temperature.",
    ],
    zh: { name: "皮蛋豆腐", steps: ["小心將嫩豆腐倒出碟上。", "有皮蛋可切粒灑上。", "淋生抽和麻油，撒蔥花，凍食或室溫。"] },
  },
  {
    id: "home-bean-sprout-stirfry", name: "Bean sprout stir-fry", cuisine: "Cantonese", time: 10, servings: 2,
    need: ["Bean sprouts", "Garlic"], optional: ["Spring onion", "Soy sauce", "Eggs"],
    steps: [
      "Rinse and drain bean sprouts. Mince garlic; slice spring onion if using.",
      "Stir-fry garlic in a hot lightly oiled pan for 10 seconds, then add sprouts and toss for 1–2 minutes until just wilted.",
      "Season with soy sauce. Optionally scramble an egg in the same pan first and fold through.",
    ],
    zh: { name: "炒芽菜", steps: ["芽菜洗淨瀝乾，拍蒜，可切蔥。", "熱鑊下油爆蒜十秒，加芽菜快炒一至兩分鐘至剛軟。", "加生抽。可先炒蛋再拌入。"] },
  },
  {
    id: "home-milk-egg-custard", name: "Steamed milk egg", cuisine: "Cantonese", time: 20, servings: 2,
    need: ["Eggs", "Milk"], optional: ["Sugar", "Honey"],
    steps: [
      "Beat 2 eggs gently with 1 cup of warm milk and a spoon of sugar if you like. Strain into bowls.",
      "Cover loosely. Steam over gently simmering water for 12–15 minutes until just set.",
      "Rest 2 minutes. Drizzle honey if you want it sweeter.",
    ],
    zh: { name: "燉蛋", steps: ["輕輕打散兩隻蛋，加入一杯暖牛奶和少許糖，過篩入碗。", "蓋好，用微滾水蒸約 12 至 15 分鐘至剛凝固。", "焗兩分鐘，可淋蜂蜜。"] },
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
