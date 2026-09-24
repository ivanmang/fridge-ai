# FridgeAI

An AI fridge assistant that:

1. Records what food you have
2. Estimates / stores expiry dates
3. Suggests cuisine from inventory, using soon-to-expire items first

This folder is a **working browser prototype**. Open `index.html` — no server required.

## Run it

```bash
# just open the file
open index.html

# or serve locally (needed if you later add ES modules / CORS APIs)
python3 -m http.server 8765
# then visit http://localhost:8765
```

### First-run demo

1. Click **Load sample fridge**
2. Open **Cuisine** — recipes rank tomato-egg, garlic greens, leftover fried rice, etc.
3. Click **Scan photo** to try the detect flow
4. In **Settings**, paste an OpenAI or Gemini key to turn the photo into real detections

Data stays in `localStorage` on this device. Export JSON from Settings for a backup.

## What the prototype already does

| Feature | How |
|---|---|
| Inventory | Add / search / remove items |
| Auto expiry | USDA-style shelf-life table by food name |
| Status | Fresh / use soon / use today / expired |
| Photo scan | Demo review list, or OpenAI / Gemini vision |
| Recipes | 28 dishes, many Cantonese / HK cafe style |
| Ranking | Prefer recipes that consume food expiring ≤ 3 days |
| Diet filter | Vegetarian option |
| Backup | Export / import JSON |

Expiry is a **guideline after purchase or opening**, not a chemical test of your pack. Trust printed dates and your senses.

## Product architecture (if you build the real thing)

```
[Camera] --> [Detect] --> [Inventory + expiry] --> [Cook suggestions]
                |                  |
           Vision LLM /        Shelf-life DB
           YOLO + CLIP         + package OCR
```

### 1. Capture

Three practical levels:

- **Phone app (fastest to ship):** user snaps the shelf after grocery unpacking. This is what most successful apps do (LettuceSave, CookScope, FridgeMind).
- **Door-mounted camera:** ESP32-CAM or a cheap USB cam + Raspberry Pi, photo on every door close.
- **Factory smart fridge:** Samsung Family Hub / LG ThinQ already do interior cameras. You would integrate via their SDKs rather than building hardware.

Door-cam is harder than it looks: glare, stacked containers, leftovers in opaque boxes. Plan for **human confirm** after every auto-detect.

### 2. Detect food

Good 2026 options, from cheap to accurate:

| Approach | Best for | Notes |
|---|---|---|
| Gemini Flash / GPT-4o vision | Prototype + mixed shelves | Prompt for JSON `{name, qty}`. Strong on produce and packages. |
| Claude vision | Same | Used by some pantry apps (e.g. NourishAI) |
| LogMeal / Foodashi APIs | Nutrition + dishes | Paid, food-specific |
| YOLOv8/11 custom + CLIP | On-device / ESP32-class after distillation | Train on *your* fridge lighting |
| Barcode + Open Food Facts | Packaged goods | Complements vision; poor for loose veg |
| Receipt OCR | Grocery haul | Good companion input |

Recommended pipeline:

1. Vision model lists candidate items
2. User ticks / renames (2–5 seconds)
3. Match name → canonical ingredient → default fridge days
4. Optional OCR on the printed use-by date overrides the default

### 3. Expiry

Do **not** invent dates from the photo of a tomato. Combine:

- Package use-by if readable
- USDA FoodKeeper / FSIS averages (already in `data/shelf-life.js`)
- Storage location (fridge vs freezer)
- Opened vs sealed
- Leftovers = 3–4 days

Hong Kong humid kitchens + frequent door opening shorten leafy greens. You can later subtract a day if the user marks “wet market, unbagged”.

Authoritative data: [USDA FoodKeeper](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/foodkeeper-app).

### 4. Suggest cuisine

Ranking rule used here:

```
score = 5 * matched_required
      + 1.2 * matched_optional
      + 3 * uses_item_expiring_within_3_days
      - 4 * missing_required
```

Then filter by cuisine and diet.

Upgrade path:

- Spoonacular `findByIngredients`
- TheMealDB (free, one ingredient at a time)
- LLM generation: “3 dinners from [inventory], prefer [expiring], Cantonese or HK cafe, 20 minutes, 2 people”

Always show **missing ingredients** so the user can shop a short gap list.

## Suggested build phases

**Phase 0 — this repo (done)**  
Local web app, shelf-life DB, recipe ranker, optional cloud vision.

**Phase 1 — daily driver**  
PWA install on phone, notifications at 6pm for items with ≤1 day left, shopping-gap list, more HK recipes (claypot rice, steamed egg, salted fish fried rice, water spinach).

**Phase 2 — better capture**  
Barcode (QuaggaJS / ML Kit), receipt OCR, voice “add two tomatoes bought today”.

**Phase 3 — hardware (optional)**  
See [`hardware/`](hardware/README.md): clip-on door-bin camera (FridgeSnap). Photo on door-close, no screws.

**Phase 4 — multi-user family**  
Shared household inventory, “who ate the leftovers”, allergen flags.

## Project layout

```
fridge-ai/
  index.html
  css/styles.css
  js/app.js
  data/shelf-life.js
  data/recipes.js
  hardware/              # clip-on fridge camera
    README.md
    BOM.md
    INSTALL.md
    enclosure/clip.scad
    firmware/fridge_snap/fridge_snap.ino
  README.md
```

## Privacy

- Demo mode never uploads photos.
- OpenAI / Gemini mode sends the image to that vendor.
- Inventory is local unless you add your own backend.

A production app should default to on-device or a backend you control, especially for family fridge photos.
