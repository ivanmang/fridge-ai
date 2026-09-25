# FridgeAI

A phone-first fridge assistant.

1. Record what food you have
2. Estimate a use-by date from a shelf-life table (edit it if the pack has a printed date)
3. Suggest what to cook. Choose how strongly the fridge beats the cuisines you like. Food due soon still shows up.
4. Search a dish you want now. The shopping list is what that dish still needs.

Photos are identified on the server. You tick the list before anything is saved. Inventory stays on this phone.

## Use it

- **Tonight** — priority (fridge, fridge first, mixed, favorites), dish search, steps, and the shopping list
- **Fridge** — add, search, and edit items
- **Scan** — photo of a shelf, a shopping bag, or the puck’s last door photo, then confirm
- **Shop** — ideas, the gap list, and notes
- **Settings** — sample kitchen, vegetarian filter, language, 6pm reminder, export / import

English and Traditional Chinese. The 中 button in the header switches the page. The reminder only fires while the app is open.

Expiry is a guideline after purchase or opening, not a test of the food.

## What is in this repo

| Path | What |
|---|---|
| `src/` | The phone app (TanStack Start) |
| `prototype/` | Earlier static version. Open `prototype/index.html`. Full shelf list and 28 recipes. |
| `hardware/` | FridgeSnap clip-on camera: BOM, install, clip, firmware |

The camera takes one photo when the door closes and keeps it on your home Wi-Fi. Scan pulls that photo. It does not upload by itself. Recognition stays in the phone app.

## Hardware, short version

Clip the puck to a door bin. Do not rely on magnets on the plastic liner. Route a thin USB cable through the hinge, not across the gasket. Details are in [hardware/README.md](hardware/README.md).
