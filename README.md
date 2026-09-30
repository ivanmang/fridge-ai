# FridgeAI

A phone-first fridge assistant.

1. Record what food you have
2. Estimate a use-by date from a shelf-life table (edit it if the pack has a printed date)
3. Suggest what to cook. Choose how strongly the fridge beats the cuisines you like. Food due soon still shows up.
4. Search a dish you want now. The shopping list is what that dish still needs.

Photos are identified on the server. You tick the list before anything is saved. **Inventory stays on this phone** — no account required.

## Use it

- **Tonight** — two modes: **Cook tonight** (trusted home recipes matched to your fridge) and **Browse ideas** (search the cookable set; imported outlines stay opt-in). Cook step-by-step with an optional timer, then update the fridge. Save dishes and remember what you cooked.
- **My food** — add, search, edit and see food grouped by urgency. Dates are labelled as estimates or package dates.
- **Add** — phone photo, the FridgeSnap puck’s last door photo, or manual entry. Review detected foods before saving.
- **Shop** — shopping gaps for tonight, your own checklist, and an optional prompt to add bought groceries to the fridge.
- **Settings** — dietary preferences, reminder while the app is open, sample kitchen, JSON backup / restore, and a short privacy note.

English and Traditional Chinese. The 中 button in the header switches the page. The reminder only fires while the app is open.

Expiry is a guideline after purchase or opening, not a test of the food. Estimated dates and package dates are kept distinct; food past its recorded date is not counted as an available recipe ingredient. Check the package and the food itself.

The app ships **50+** fully written home recipes for everyday HK / Cantonese / pantry meals. The larger imported dish catalogue is off by default (“Include recipe ideas”) and remains **outline-only** (no Cook) when enabled. Photo recognition and online dish lookup need a configured server-side xAI key. Manual entry and the on-device recipe catalogue work without it.

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
| `VITE_AUTH_ENABLED` | Yes for public FridgeAI deploys | Set to `false`. FridgeAI keeps inventory on-device and does not use accounts. Leaving this unset enables the unused Better Auth UI path. |
| `DATABASE_URL` | No | Leave unset. Product data is `localStorage`, not Postgres. |

Copy [`.env.example`](.env.example) to `.env` for local work:

```bash
cp .env.example .env
# then set XAI_API_KEY=xai-...
```

Scan/lookup are rate-limited per client IP (best-effort persist under `.data/` when the filesystem allows), with a request timeout and a small concurrent-scan cap.

## Deploy (Vercel)

**Chosen host:** [Vercel](https://vercel.com) — this repo already builds with Nitro’s `vercel` preset in `vite.config.ts` (TanStack Start’s supported Vercel path). Cloudflare Workers would mean swapping Nitro for `@cloudflare/vite-plugin` + `wrangler` and more Node-compat work for existing server middleware; Vercel is the least-friction fit.

### One-time setup

1. Import [ivanmang/fridge-ai](https://github.com/ivanmang/fridge-ai) in the Vercel dashboard (or `npx vercel link`).
2. Set project Environment Variables (Production + Preview):

| Key | Value | Notes |
|---|---|---|
| `VITE_AUTH_ENABLED` | `false` | Also set in `vercel.json` as a safe default |
| `XAI_API_KEY` | `xai-…` | **Required for Identify / dish lookup.** Omit only if you accept those features failing closed |

3. Deploy from Git (push to `main`) or CLI:

```bash
npx vercel          # preview
npx vercel --prod   # production
```

Build uses `npm run build` → Vite + Nitro (`preset: "vercel"`) → Vercel Build Output API. `db:migrate` no-ops without `DATABASE_URL`.

### Production notes

- **Inventory privacy:** food list, shopping list, and settings stay in the browser (`localStorage`). They are not uploaded to Vercel.
- **Photos leave the device** only when the user taps Identify; the image is sent to xAI via a server function. Document that in any public share of the URL.
- **`XAI_API_KEY` is required for Identify.** Without it, scan and online dish lookup return a clear error; Tonight / My food / manual Add / Shop still work.
- **Rate limits are soft on serverless.** Counters are per-instance memory plus best-effort `.data/` writes. On Vercel Fluid / multi-instance deploys, limits reset across cold starts and do not share a global store. Do not treat them as spend protection for a widely shared public URL — use a paid KV/Redis layer (or auth / Turnstile) before heavy public traffic.
- **FridgeSnap puck:** an HTTPS deploy cannot reliably fetch `http://fridgesnap.local` (mixed content / private network). Prefer the installed PWA on the home LAN, or manual/photo add, when using the puck.
- **Optional auth/DB scaffolding** in the repo stays disabled when `VITE_AUTH_ENABLED=false` and `DATABASE_URL` is unset.

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
