# FridgeAI

A phone-first fridge assistant.

1. Record what food you have
2. Estimate a use-by date from a shelf-life table (edit it if the pack has a printed date)
3. Suggest what to cook, preferring food that should be used within 3 days
4. Show the missing ingredients for that meal

Photos are identified on the server. You tick the list before anything is saved. Inventory stays on this phone.

## Use it

- **Tonight** — the best matching dish, steps, and what is still missing
- **Fridge** — add, search, and edit items
- **Scan** — photo of a shelf or shopping bag, then confirm
- **Shop** — gap list for tonight, plus notes
- **Settings** — sample kitchen, vegetarian filter, 6pm reminder, export / import

The reminder only fires while the app is open.

Expiry is a guideline after purchase or opening, not a test of the food.

## What is in this repo

| Path | What |
|---|---|
| `src/` | The phone app (TanStack Start) |
| `prototype/` | Earlier static version. Open `prototype/index.html`. Full shelf list and 28 recipes. |
| `hardware/` | FridgeSnap clip-on camera: BOM, install, clip, firmware |

The camera does not write into the inventory yet. It takes one photo when the door closes. Recognition stays in the phone app.

## Hardware, short version

Clip the puck to a door bin. Do not rely on magnets on the plastic liner. Route a thin USB cable through the hinge, not across the gasket. Details are in [hardware/README.md](hardware/README.md).
