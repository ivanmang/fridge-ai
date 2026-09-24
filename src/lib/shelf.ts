export type ShelfFood = {
  name: string
  aliases: string[]
  category: string
  location: "fridge" | "freezer" | "pantry"
  days: number
}

export const SHELF: ShelfFood[] = [
  {
    "name": "Milk",
    "aliases": [
      "fresh milk",
      "whole milk",
      "skim milk",
      "2% milk"
    ],
    "category": "dairy",
    "location": "fridge",
    "days": 7
  },
  {
    "name": "UHT Milk (opened)",
    "aliases": [
      "uht",
      "long life milk"
    ],
    "category": "dairy",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Yogurt",
    "aliases": [
      "yoghurt",
      "greek yogurt"
    ],
    "category": "dairy",
    "location": "fridge",
    "days": 14
  },
  {
    "name": "Butter",
    "aliases": [],
    "category": "dairy",
    "location": "fridge",
    "days": 60
  },
  {
    "name": "Cheddar",
    "aliases": [
      "hard cheese",
      "cheese"
    ],
    "category": "dairy",
    "location": "fridge",
    "days": 21
  },
  {
    "name": "Mozzarella",
    "aliases": [
      "fresh mozzarella"
    ],
    "category": "dairy",
    "location": "fridge",
    "days": 7
  },
  {
    "name": "Cream cheese",
    "aliases": [],
    "category": "dairy",
    "location": "fridge",
    "days": 14
  },
  {
    "name": "Sour cream",
    "aliases": [],
    "category": "dairy",
    "location": "fridge",
    "days": 14
  },
  {
    "name": "Eggs",
    "aliases": [
      "egg",
      "fresh eggs"
    ],
    "category": "dairy",
    "location": "fridge",
    "days": 28
  },
  {
    "name": "Tofu",
    "aliases": [
      "bean curd",
      "firm tofu",
      "silken tofu"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Chicken breast",
    "aliases": [
      "chicken",
      "raw chicken"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 2
  },
  {
    "name": "Chicken thighs",
    "aliases": [
      "chicken leg"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 2
  },
  {
    "name": "Ground beef",
    "aliases": [
      "minced beef",
      "beef mince"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 2
  },
  {
    "name": "Beef steak",
    "aliases": [
      "steak",
      "beef"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 4
  },
  {
    "name": "Pork chops",
    "aliases": [
      "pork",
      "pork loin"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 4
  },
  {
    "name": "Bacon",
    "aliases": [],
    "category": "protein",
    "location": "fridge",
    "days": 7
  },
  {
    "name": "Ham",
    "aliases": [
      "sliced ham"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Sausages",
    "aliases": [
      "sausage",
      "hot dog"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 3
  },
  {
    "name": "Salmon",
    "aliases": [
      "fish",
      "raw salmon"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 2
  },
  {
    "name": "White fish",
    "aliases": [
      "cod",
      "cod fillet",
      "seabass",
      "sea bass",
      "snapper"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 2
  },
  {
    "name": "Shrimp",
    "aliases": [
      "prawns",
      "prawn"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 2
  },
  {
    "name": "Cooked leftovers",
    "aliases": [
      "leftovers",
      "leftover",
      "cooked rice",
      "takeaway"
    ],
    "category": "leftover",
    "location": "fridge",
    "days": 3
  },
  {
    "name": "Lettuce",
    "aliases": [
      "romaine",
      "iceberg",
      "leafy greens"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 7
  },
  {
    "name": "Spinach",
    "aliases": [
      "baby spinach"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Pak choi",
    "aliases": [
      "bok choy",
      "bok choi",
      "shanghai greens"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Choi sum",
    "aliases": [
      "choy sum",
      "cai xin"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 4
  },
  {
    "name": "Gai lan",
    "aliases": [
      "chinese broccoli",
      "kai lan"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Broccoli",
    "aliases": [],
    "category": "produce",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Cauliflower",
    "aliases": [],
    "category": "produce",
    "location": "fridge",
    "days": 7
  },
  {
    "name": "Cabbage",
    "aliases": [
      "napa cabbage",
      "wong bak",
      "chinese cabbage"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 12
  },
  {
    "name": "Carrots",
    "aliases": [
      "carrot"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 21
  },
  {
    "name": "Celery",
    "aliases": [],
    "category": "produce",
    "location": "fridge",
    "days": 14
  },
  {
    "name": "Cucumber",
    "aliases": [],
    "category": "produce",
    "location": "fridge",
    "days": 6
  },
  {
    "name": "Tomato",
    "aliases": [
      "tomatoes"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 7
  },
  {
    "name": "Bell pepper",
    "aliases": [
      "capsicum",
      "pepper",
      "red pepper"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 8
  },
  {
    "name": "Onion",
    "aliases": [
      "onions",
      "yellow onion"
    ],
    "category": "produce",
    "location": "pantry",
    "days": 30
  },
  {
    "name": "Spring onion",
    "aliases": [
      "green onion",
      "scallion",
      "green onions"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 7
  },
  {
    "name": "Garlic",
    "aliases": [],
    "category": "produce",
    "location": "pantry",
    "days": 30
  },
  {
    "name": "Ginger",
    "aliases": [],
    "category": "produce",
    "location": "fridge",
    "days": 21
  },
  {
    "name": "Potato",
    "aliases": [
      "potatoes"
    ],
    "category": "produce",
    "location": "pantry",
    "days": 21
  },
  {
    "name": "Sweet potato",
    "aliases": [],
    "category": "produce",
    "location": "pantry",
    "days": 21
  },
  {
    "name": "Mushroom",
    "aliases": [
      "mushrooms",
      "shiitake",
      "button mushroom"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Corn",
    "aliases": [
      "corn on the cob",
      "sweet corn"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 3
  },
  {
    "name": "Eggplant",
    "aliases": [
      "aubergine"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Zucchini",
    "aliases": [
      "courgette"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Apple",
    "aliases": [
      "apples"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 21
  },
  {
    "name": "Banana",
    "aliases": [
      "bananas"
    ],
    "category": "produce",
    "location": "pantry",
    "days": 5
  },
  {
    "name": "Orange",
    "aliases": [
      "oranges",
      "citrus"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 14
  },
  {
    "name": "Lemon",
    "aliases": [
      "lemons"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 21
  },
  {
    "name": "Berries",
    "aliases": [
      "strawberry",
      "blueberry",
      "raspberry",
      "strawberries"
    ],
    "category": "produce",
    "location": "fridge",
    "days": 4
  },
  {
    "name": "Grapes",
    "aliases": [],
    "category": "produce",
    "location": "fridge",
    "days": 7
  },
  {
    "name": "Avocado",
    "aliases": [],
    "category": "produce",
    "location": "pantry",
    "days": 4
  },
  {
    "name": "Mango",
    "aliases": [],
    "category": "produce",
    "location": "pantry",
    "days": 5
  },
  {
    "name": "Rice",
    "aliases": [
      "uncooked rice",
      "jasmine rice"
    ],
    "category": "pantry",
    "location": "pantry",
    "days": 365
  },
  {
    "name": "Cooked rice",
    "aliases": [
      "leftover rice"
    ],
    "category": "leftover",
    "location": "fridge",
    "days": 3
  },
  {
    "name": "Noodles",
    "aliases": [
      "egg noodles",
      "ramen",
      "udon",
      "rice noodles"
    ],
    "category": "pantry",
    "location": "pantry",
    "days": 180
  },
  {
    "name": "Pasta",
    "aliases": [
      "spaghetti"
    ],
    "category": "pantry",
    "location": "pantry",
    "days": 365
  },
  {
    "name": "Bread",
    "aliases": [
      "loaf",
      "toast"
    ],
    "category": "pantry",
    "location": "pantry",
    "days": 5
  },
  {
    "name": "Tortilla",
    "aliases": [
      "wrap"
    ],
    "category": "pantry",
    "location": "pantry",
    "days": 10
  },
  {
    "name": "Soy sauce",
    "aliases": [],
    "category": "condiment",
    "location": "pantry",
    "days": 365
  },
  {
    "name": "Oyster sauce",
    "aliases": [],
    "category": "condiment",
    "location": "fridge",
    "days": 180
  },
  {
    "name": "Hoisin sauce",
    "aliases": [],
    "category": "condiment",
    "location": "fridge",
    "days": 180
  },
  {
    "name": "Chili oil",
    "aliases": [
      "chilli oil",
      "chili crisp"
    ],
    "category": "condiment",
    "location": "pantry",
    "days": 180
  },
  {
    "name": "Ketchup",
    "aliases": [],
    "category": "condiment",
    "location": "fridge",
    "days": 180
  },
  {
    "name": "Mayonnaise",
    "aliases": [
      "mayo"
    ],
    "category": "condiment",
    "location": "fridge",
    "days": 60
  },
  {
    "name": "Mustard",
    "aliases": [],
    "category": "condiment",
    "location": "fridge",
    "days": 180
  },
  {
    "name": "Olive oil",
    "aliases": [],
    "category": "condiment",
    "location": "pantry",
    "days": 365
  },
  {
    "name": "Sesame oil",
    "aliases": [],
    "category": "condiment",
    "location": "pantry",
    "days": 180
  },
  {
    "name": "Vinegar",
    "aliases": [
      "rice vinegar",
      "black vinegar"
    ],
    "category": "condiment",
    "location": "pantry",
    "days": 365
  },
  {
    "name": "Kimchi",
    "aliases": [],
    "category": "condiment",
    "location": "fridge",
    "days": 30
  },
  {
    "name": "Pickles",
    "aliases": [
      "pickled vegetables"
    ],
    "category": "condiment",
    "location": "fridge",
    "days": 60
  },
  {
    "name": "Orange juice",
    "aliases": [
      "juice"
    ],
    "category": "beverage",
    "location": "fridge",
    "days": 7
  },
  {
    "name": "Tofu pudding",
    "aliases": [
      "douhua"
    ],
    "category": "dairy",
    "location": "fridge",
    "days": 3
  },
  {
    "name": "Luncheon meat",
    "aliases": [
      "spam",
      "canned ham"
    ],
    "category": "protein",
    "location": "fridge",
    "days": 5
  },
  {
    "name": "Canned tuna",
    "aliases": [
      "tuna"
    ],
    "category": "protein",
    "location": "pantry",
    "days": 365
  },
  {
    "name": "Beans",
    "aliases": [
      "canned beans",
      "black beans",
      "chickpeas"
    ],
    "category": "pantry",
    "location": "pantry",
    "days": 365
  },
  {
    "name": "Coconut milk",
    "aliases": [],
    "category": "pantry",
    "location": "pantry",
    "days": 365
  },
  {
    "name": "Peanut butter",
    "aliases": [],
    "category": "pantry",
    "location": "pantry",
    "days": 180
  },
  {
    "name": "Jam",
    "aliases": [
      "jelly"
    ],
    "category": "condiment",
    "location": "fridge",
    "days": 90
  },
  {
    "name": "Honey",
    "aliases": [],
    "category": "pantry",
    "location": "pantry",
    "days": 730
  },
  {
    "name": "Flour",
    "aliases": [],
    "category": "pantry",
    "location": "pantry",
    "days": 180
  },
  {
    "name": "Sugar",
    "aliases": [],
    "category": "pantry",
    "location": "pantry",
    "days": 730
  },
  {
    "name": "Salt",
    "aliases": [],
    "category": "pantry",
    "location": "pantry",
    "days": 1825
  }
]
