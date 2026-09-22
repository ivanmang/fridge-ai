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

## Hardware

See [`hardware/`](hardware/README.md) for FridgeSnap: a clip-on door-bin camera that photographs the fridge when the door closes. No screws. Inner liners are plastic, so magnets go on the steel frame only.

## Privacy

- Demo mode never uploads photos.
- OpenAI / Gemini mode sends the image to that vendor.
- Inventory is local unless you add your own backend.
