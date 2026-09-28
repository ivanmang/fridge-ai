# FridgeAI

A phone-first fridge assistant.

1. Record what food you have
2. Estimate a use-by date from a shelf-life table (edit it if the pack has a printed date)
3. Suggest what to cook. Choose how strongly the fridge beats the cuisines you like. Food due soon still shows up.
4. Search a dish you want now. The shopping list is what that dish still needs.

Photos are identified on the server. You tick the list before anything is saved. Inventory stays on this phone.

## Use it

- **Tonight** — one meal idea first, with what you have and what you need. Browse other dishes or change priorities only if you want to. Cook in a focused step-by-step view with an optional timer, then update the fridge.
- **My food** — add, search, edit and see food grouped by urgency. Dates are labelled as estimates or package dates.
- **Add** — phone photo, the FridgeSnap puck’s last door photo, or manual entry. Review detected foods before saving.
- **Shop** — shopping gaps for tonight, your own checklist, and an optional prompt to add bought groceries to the fridge.
- **Settings** — dietary preferences, reminder while the app is open, sample kitchen, and JSON backup / restore.

English and Traditional Chinese. The 中 button in the header switches the page. The reminder only fires while the app is open.

Expiry is a guideline after purchase or opening, not a test of the food. Estimated dates and package dates are kept distinct; food past its recorded date is not counted as an available recipe ingredient. Check the package and the food itself.

The app includes a small set of fully written home recipes for everyday meals. The larger imported dish catalogue is still searchable but may contain brief outlines rather than complete cooking instructions; these are labelled in the cooking flow. Photo recognition and online dish lookup need a configured server-side xAI key. Manual entry and the on-device recipe catalogue work without it.

## What is in this repo

| Path | What |
|---|---|
| `src/` | The phone app (TanStack Start) |
| `prototype/` | Earlier static version. Open `prototype/index.html`. Full shelf list and 28 recipes. |
| `hardware/` | FridgeSnap clip-on camera: BOM, install, clip, firmware |

The camera takes one photo when the door closes and keeps it on your home Wi-Fi. Scan pulls that photo. It does not upload by itself. Recognition stays in the phone app.

## Hardware, short version

Clip the puck to a door bin. Do not rely on magnets on the plastic liner. Route a thin USB cable through the hinge, not across the gasket. Details are in [hardware/README.md](hardware/README.md).
