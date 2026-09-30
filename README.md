# FridgeAI

A phone-first fridge assistant.

1. Record what food you have
2. Estimate a use-by date from a shelf-life table (edit it if the pack has a printed date)
3. Suggest what to cook. Choose how strongly the fridge beats the cuisines you like. Food due soon still shows up.
4. Search a dish you want now. The shopping list is what that dish still needs.

Photos are identified on the server. You tick the list before anything is saved. **Inventory stays on this phone** — no account required.

## Use it

- **Tonight** — one meal idea from the real home-recipe set (not the imported outline catalogue). Cook step-by-step with an optional timer, then update the fridge.
- **My food** — add, search, edit and see food grouped by urgency. Dates are labelled as estimates or package dates.
- **Add** — phone photo, the FridgeSnap puck’s last door photo, or manual entry. Review detected foods before saving.
- **Shop** — shopping gaps for tonight, your own checklist, and an optional prompt to add bought groceries to the fridge.
- **Settings** — dietary preferences, reminder while the app is open, sample kitchen, JSON backup / restore, and a short privacy note.

English and Traditional Chinese. The 中 button in the header switches the page. The reminder only fires while the app is open.

Expiry is a guideline after purchase or opening, not a test of the food. Estimated dates and package dates are kept distinct; food past its recorded date is not counted as an available recipe ingredient. Check the package and the food itself.

The app ships ~40+ fully written home recipes for everyday HK / Cantonese / pantry meals. The larger imported dish catalogue remains searchable as **outline-only** (no Cook), for discovery and shopping gaps. Photo recognition and online dish lookup need a configured server-side xAI key. Manual entry and the on-device recipe catalogue work without it.

## Develop

```bash
npm install
npm run dev          # Vite / TanStack Start on port 8080
npm run typecheck
npm run lint
npm test             # platform scripts + logic.ts product tests
npm run test:logic   # product ranking / expiry / shelf tests only
```

### Environment

| Variable | Required | Purpose |
|---|---|---|
| `XAI_API_KEY` | For Identify / online dish lookup | Server-side xAI key. Never put this in the browser. When unset, scan and lookup **fail closed** with a clear message; manual add and local recipes still work. |

Create a local `.env` (gitignored) or whatever your host uses for secrets:

```bash
XAI_API_KEY=xai-...
```

Scan/lookup are rate-limited per client IP (persisted under `.data/` when the filesystem allows), with a request timeout and a small concurrent-scan cap.

## What is in this repo

| Path | What |
|---|---|
| `src/` | The phone app (TanStack Start) |
| `src/lib/logic.ts` | Ranking, expiry, matching |
| `src/lib/more-dishes.ts` | Cookable home recipes |
| `src/lib/recipes.ts` | Large imported outline catalogue (search-only) |
| `src/components/fridge/` | Tab modules (`tonight`, `fridge-list`, `scan-panel`, `shop`, settings) |
| `prototype/` | Historical static app — do not paste API keys in the browser |
| `hardware/` | FridgeSnap clip-on camera: BOM, install, clip, firmware |

The camera takes one photo when the door closes and keeps it on your home Wi-Fi. Scan pulls that photo. It does not upload by itself. Recognition stays in the phone app.

## Hardware, short version

Clip the puck to a door bin. Do not rely on magnets on the plastic liner. Route a thin USB cable through the hinge, not across the gasket. Details are in [hardware/README.md](hardware/README.md).

## License

MIT — see [LICENSE](LICENSE).
