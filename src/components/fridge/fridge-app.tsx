import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react"
import {
  Bell,
  Camera,
  Check,
  Plus,
  Refrigerator,
  Settings,
  ShoppingBasket,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { scanFoods } from "@/lib/scan.functions"
import type { ScanHit } from "@/lib/scan.functions"
import { SHELF } from "@/lib/shelf"
import {
  daysUntil,
  defaultExpiry,
  findShelf,
  rankRecipes,
  statusLabel,
  statusOf,
  todayISO,
  whenLabel,
  type FoodItem,
  type ItemStatus,
} from "@/lib/logic"
import { draftFromName, useFridge, type ShopNote } from "@/lib/store"
import { cn } from "@/lib/utils"

type Tab = "tonight" | "fridge" | "scan" | "shop"
type Draft = Omit<FoodItem, "id">
type ScanRow = ScanHit & { on: boolean; expires: string }

const fieldClass =
  "h-11 w-full rounded-card border border-line bg-raised px-3 text-fg outline-none focus-visible:outline-2 focus-visible:outline-mint"

const TABS: { id: Tab; label: string; icon: typeof UtensilsCrossed }[] = [
  { id: "tonight", label: "Tonight", icon: UtensilsCrossed },
  { id: "fridge", label: "Fridge", icon: Refrigerator },
  { id: "scan", label: "Scan", icon: Camera },
  { id: "shop", label: "Shop", icon: ShoppingBasket },
]

const CUISINES = ["All", "Cantonese", "Hong Kong", "Chinese", "Western"]

export function FridgeApp() {
  const [tab, setTab] = useState<Tab>("tonight")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editing, setEditing] = useState<FoodItem | null>(null)
  const [adding, setAdding] = useState(false)

  useLayoutEffect(() => {
    void useFridge.persist.rehydrate()
  }, [])

  const items = useFridge((s) => s.items)
  const settings = useFridge((s) => s.settings)

  useEffect(() => {
    if (!settings.notify) return
    const tick = () => {
      const state = useFridge.getState()
      if (!state.settings.notify) return
      const now = new Date()
      if (now.getHours() < state.settings.remindHour) return
      const day = todayISO(now)
      if (state.settings.lastPing === day) return
      const urgent = state.items.filter((item) => daysUntil(item.expires) <= 0)
      if (!urgent.length) return
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const names = urgent.slice(0, 3).map((item) => item.name)
        const extra = urgent.length - names.length
        const body = extra > 0 ? `${names.join(", ")}, and ${extra} more` : names.join(", ")
        new Notification("Use today", { body })
      }
      state.setSettings({ lastPing: day })
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [settings.notify, settings.remindHour])

  const urgentCount = items.filter((item) => daysUntil(item.expires) <= 0).length

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-bg pb-28 text-fg">
      <header className="flex items-start justify-between gap-3 px-5 pt-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Tonight in the kitchen</p>
          <h1 className="font-display text-4xl leading-none">FridgeAI</h1>
          <p className="mt-2 text-sm tabular-nums text-muted">
            {items.length} stored
            {urgentCount > 0 ? ` · ${urgentCount} to use today` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="grid size-11 place-items-center rounded-full border border-line bg-surface text-fg"
          aria-label="Settings"
        >
          <Settings className="size-5" />
        </button>
      </header>

      {urgentCount > 0 && tab !== "tonight" && (
        <div className="px-5">
          <button
            type="button"
            onClick={() => setTab("tonight")}
            className="mt-4 flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left"
          >
          <Bell className="size-4 shrink-0 text-clay" />
          <span className="text-sm">
            {urgentCount === 1 ? "1 item should be eaten today." : `${urgentCount} items should be eaten today.`}
          </span>
          </button>
        </div>
      )}

      <div className="px-5 pt-5">
        {tab === "tonight" && <Tonight items={items} vegetarian={settings.vegetarian} />}
        {tab === "fridge" && <FridgeList items={items} onAdd={() => setAdding(true)} onOpen={setEditing} />}
        {tab === "scan" && <ScanPanel />}
        {tab === "shop" && <ShopPanel items={items} vegetarian={settings.vegetarian} />}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((item) => {
            const Icon = item.icon
            const on = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-xs",
                  on ? "text-mint" : "text-muted",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      {adding && <ItemSheet onClose={() => setAdding(false)} />}
      {editing && <ItemSheet item={editing} onClose={() => setEditing(null)} />}
    </main>
  )
}

function Tonight({ items, vegetarian }: { items: FoodItem[]; vegetarian: boolean }) {
  const [cuisine, setCuisine] = useState("All")
  const ranked = useMemo(() => {
    const rows = rankRecipes(items, vegetarian)
    if (cuisine === "All") return rows
    return rows.filter((row) => row.recipe.cuisine === cuisine)
  }, [items, vegetarian, cuisine])
  const hero = ranked[0]
  const rest = ranked.slice(1, 5)

  return (
    <section className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CUISINES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setCuisine(name)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-2 text-sm",
              cuisine === name ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {!items.length && (
        <Empty
          title="The fridge is empty"
          body="Add what you bought, scan a shelf, or load a sample kitchen to see tonight’s meal."
        />
      )}

      {items.length > 0 && !hero && (
        <Empty title="Nothing matches that filter" body="Try All, or add the ingredient a dish is missing." />
      )}

      {hero && (
        <article className="rounded-card border border-line bg-surface p-5">
          <p className="text-xs font-medium tracking-wide text-mint uppercase">{hero.recipe.cuisine}</p>
          <h2 className="mt-1 font-display text-3xl italic">{hero.recipe.name}</h2>
          <p className="mt-2 text-sm text-muted">
            {hero.recipe.time} min · {hero.recipe.servings} {hero.recipe.servings === 1 ? "serving" : "servings"}
          </p>
          {hero.urgent.length > 0 && (
            <p className="mt-3 text-sm text-clay">Uses food that should go soon: {hero.urgent.join(", ")}.</p>
          )}
          {hero.missing.length > 0 ? (
            <p className="mt-2 text-sm text-muted">Still need {hero.missing.join(", ")}.</p>
          ) : (
            <p className="mt-2 text-sm text-muted">You already have the required ingredients.</p>
          )}
          <ol className="mt-4 space-y-2 text-sm">
            {hero.recipe.steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="tabular-nums text-muted">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </article>
      )}

      {rest.length > 0 && (
        <ul className="space-y-2">
          {rest.map((row) => (
            <li key={row.recipe.id} className="rounded-card border border-line bg-surface px-4 py-3">
              <p className="font-medium">{row.recipe.name}</p>
              <p className="text-sm text-muted">
                {row.recipe.cuisine} · {row.recipe.time} min
                {row.missing.length ? ` · missing ${row.missing.join(", ")}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FridgeList({
  items,
  onAdd,
  onOpen,
}: {
  items: FoodItem[]
  onAdd: () => void
  onOpen: (item: FoodItem) => void
}) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | ItemStatus>("all")
  const shown = items
    .filter((item) => (filter === "all" ? true : statusOf(item.expires) === filter))
    .filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice()
    .sort((a, b) => a.expires.localeCompare(b.expires))

  return (
    <section>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the fridge"
          className="h-11 min-w-0 flex-1 rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
        />
        <button
          type="button"
          onClick={onAdd}
          className="grid size-11 shrink-0 place-items-center rounded-card bg-mint text-mint-ink"
          aria-label="Add food"
        >
          <Plus className="size-5" />
        </button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {(["all", "today", "soon", "expired", "fresh"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-2 text-sm",
              filter === key ? "border-mint bg-mint text-mint-ink" : "border-line text-muted",
            )}
          >
            {key === "all" ? "All" : statusLabel(key)}
          </button>
        ))}
      </div>
      {!shown.length && (
        <Empty
          title={items.length ? "Nothing in this filter" : "Nothing stored yet"}
          body={
            items.length
              ? "Clear the search or pick another status."
              : "Add an item, or scan a photo and confirm the list."
          }
        />
      )}
      <ul className="mt-4 space-y-2">
        {shown.map((item) => {
          const status = statusOf(item.expires)
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left"
              >
                <span
                  className={cn(
                    "h-10 w-1 shrink-0 rounded-full",
                    status === "expired" || status === "today" ? "bg-clay" : status === "soon" ? "bg-mint" : "bg-line",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block text-sm text-muted">
                    {item.qty} · {item.location}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-right text-sm tabular-nums",
                    status === "expired" || status === "today" ? "text-clay" : "text-muted",
                  )}
                >
                  <span className="block">{statusLabel(status)}</span>
                  <span className="block">{whenLabel(item.expires)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ScanPanel() {
  const addMany = useFridge((s) => s.addMany)
  const [preview, setPreview] = useState("")
  const [rows, setRows] = useState<ScanRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")

  async function onFile(file: File | undefined) {
    if (!file) return
    setError("")
    setSaved("")
    setRows([])
    const image = await shrinkImage(file)
    if (!image) {
      setError("That photo is too large. Try a closer shot.")
      return
    }
    setPreview(image)
  }

  async function identify() {
    if (!preview) return
    setBusy(true)
    setError("")
    setSaved("")
    try {
      const result = await scanFoods({ data: { image: preview } })
      if (!result.ok) {
        setError(result.error)
        setRows([])
        return
      }
      if (!result.foods.length) {
        setError("Nothing recognizable in that photo. Add the items by hand.")
        setRows([])
        return
      }
      setRows(result.foods.map((food) => ({ ...food, on: true, expires: defaultExpiry(food.name) })))
    } catch {
      setError("Scan failed. Try again, or add the food by hand.")
    } finally {
      setBusy(false)
    }
  }

  function save() {
    const chosen = rows.filter((row) => row.on && row.name.trim())
    if (!chosen.length) {
      setError("Tick at least one item before saving.")
      return
    }
    addMany(chosen.map((row) => ({ ...draftFromName(row.name, row.qty), expires: row.expires })))
    setRows([])
    setPreview("")
    setSaved(`${chosen.length} added. Nothing was saved until you confirmed.`)
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted">
        Take a photo of the shelf or the shopping bag. Review the list. Nothing is stored until you tick and save.
      </p>
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface px-4 py-6 text-center">
        <Camera className="size-6 text-mint" />
        <span className="mt-2 text-sm font-medium">Take or choose a photo</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </label>
      {preview && <img src={preview} alt="Shelf to scan" className="max-h-56 w-full rounded-card object-cover" />}
      {preview && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void identify()}
          className="h-11 w-full rounded-card bg-mint font-semibold text-mint-ink disabled:opacity-60"
        >
          {busy ? "Reading the photo…" : "Identify food"}
        </button>
      )}
      {error && <p className="text-sm text-clay">{error}</p>}
      {saved && <p className="text-sm text-mint">{saved}</p>}
      {rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted">Uncheck anything that is wrong. Dates are estimates, not printed use-by dates.</p>
          {rows.map((row, index) => (
            <div key={`${row.name}-${index}`} className="rounded-card border border-line bg-surface p-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={row.on}
                  onChange={(e) =>
                    setRows((current) => current.map((item, i) => (i === index ? { ...item, on: e.target.checked } : item)))
                  }
                  className="size-5 accent-mint"
                />
                <input
                  value={row.name}
                  onChange={(e) =>
                    setRows((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, name: e.target.value, expires: defaultExpiry(e.target.value) } : item,
                      ),
                    )
                  }
                  className="h-10 min-w-0 flex-1 bg-transparent font-medium outline-none"
                />
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  value={row.qty}
                  onChange={(e) =>
                    setRows((current) => current.map((item, i) => (i === index ? { ...item, qty: e.target.value } : item)))
                  }
                  aria-label="Quantity"
                  className={fieldClass}
                />
                <input
                  type="date"
                  value={row.expires}
                  onChange={(e) =>
                    setRows((current) => current.map((item, i) => (i === index ? { ...item, expires: e.target.value } : item)))
                  }
                  aria-label="Expires"
                  className={fieldClass}
                />
              </div>
            </div>
          ))}
          <button type="button" onClick={save} className="h-11 w-full rounded-card bg-mint font-semibold text-mint-ink">
            Save ticked items
          </button>
        </div>
      )}
    </section>
  )
}

function ShopPanel({ items, vegetarian }: { items: FoodItem[]; vegetarian: boolean }) {
  const shop = useFridge((s) => s.shop)
  const addShop = useFridge((s) => s.addShop)
  const toggleShop = useFridge((s) => s.toggleShop)
  const clearDoneShop = useFridge((s) => s.clearDoneShop)
  const addItem = useFridge((s) => s.addItem)
  const [note, setNote] = useState("")
  const hero = rankRecipes(items, vegetarian)[0]
  const low = items.filter((item) => daysUntil(item.expires) <= 2)

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-2xl">To cook tonight</h2>
        {!hero && <p className="mt-2 text-sm text-muted">Add food first. The gap list follows the top recipe.</p>}
        {hero && hero.missing.length === 0 && (
          <p className="mt-2 text-sm text-muted">{hero.recipe.name} needs nothing else.</p>
        )}
        {hero && hero.missing.length > 0 && (
          <ul className="mt-3 space-y-2">
            {hero.missing.map((name) => (
              <li
                key={name}
                className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3"
              >
                <span>
                  <span className="block font-medium">{name}</span>
                  <span className="text-sm text-muted">for {hero.recipe.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => addItem(draftFromName(name))}
                  className="h-10 shrink-0 rounded-full bg-mint px-3 text-sm font-semibold text-mint-ink"
                >
                  Bought
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {low.length > 0 && (
        <div>
          <h2 className="font-display text-2xl">Use or replace</h2>
          <ul className="mt-3 space-y-2">
            {low.map((item) => (
              <li key={item.id} className="rounded-card border border-line px-4 py-3 text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted"> · {whenLabel(item.expires)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!note.trim()) return
          addShop(note)
          setNote("")
        }}
      >
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a shopping note"
          className="h-11 min-w-0 flex-1 rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
        />
        <button type="submit" className="h-11 rounded-card bg-raised px-4 text-sm font-semibold">
          Add
        </button>
      </form>
      <ShopNotes notes={shop} onToggle={toggleShop} onClear={clearDoneShop} />
    </section>
  )
}

function ShopNotes({
  notes,
  onToggle,
  onClear,
}: {
  notes: ShopNote[]
  onToggle: (id: string) => void
  onClear: () => void
}) {
  if (!notes.length) return null
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-2xl">Notes</h2>
        <button type="button" onClick={onClear} className="text-sm text-muted">
          Clear done
        </button>
      </div>
      <ul className="space-y-2">
        {notes.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              onClick={() => onToggle(note.id)}
              className="flex min-h-11 w-full items-center gap-3 rounded-card border border-line px-4 text-left"
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full border",
                  note.done ? "border-mint bg-mint text-mint-ink" : "border-line",
                )}
              >
                {note.done && <Check className="size-3" />}
              </span>
              <span className={cn(note.done && "text-muted line-through")}>{note.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ItemSheet({ item, onClose }: { item?: FoodItem; onClose: () => void }) {
  const addItem = useFridge((s) => s.addItem)
  const updateItem = useFridge((s) => s.updateItem)
  const removeItem = useFridge((s) => s.removeItem)
  const [draft, setDraft] = useState<Draft>(
    item
      ? {
          name: item.name,
          qty: item.qty,
          location: item.location,
          bought: item.bought,
          expires: item.expires,
          opened: item.opened,
        }
      : draftFromName(""),
  )

  function applyName(name: string) {
    const shelf = findShelf(name)
    setDraft((current) => ({
      ...current,
      name,
      location: shelf?.location ?? current.location,
      expires: name.trim() ? defaultExpiry(name, current.bought, current.opened) : current.expires,
    }))
  }

  function save() {
    if (!draft.name.trim()) return
    if (item) updateItem(item.id, draft)
    else addItem(draft)
    onClose()
  }

  return (
    <Sheet title={item ? "Edit food" : "Add food"} onClose={onClose}>
      <label className="block text-sm text-muted">
        Name
        <input list="shelf-names" value={draft.name} onChange={(e) => applyName(e.target.value)} className={cn(fieldClass, "mt-1")} />
        <datalist id="shelf-names">
          {SHELF.map((food) => (
            <option key={food.name} value={food.name} />
          ))}
        </datalist>
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Quantity">
          <input value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: e.target.value })} className={fieldClass} />
        </Field>
        <Field label="Where">
          <select
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value as Draft["location"] })}
            className={fieldClass}
          >
            <option value="fridge">Fridge</option>
            <option value="freezer">Freezer</option>
            <option value="pantry">Pantry</option>
          </select>
        </Field>
        <Field label="Bought">
          <input
            type="date"
            value={draft.bought}
            onChange={(e) =>
              setDraft({
                ...draft,
                bought: e.target.value,
                expires: defaultExpiry(draft.name, e.target.value, draft.opened),
              })
            }
            className={fieldClass}
          />
        </Field>
        <Field label="Use by">
          <input
            type="date"
            value={draft.expires}
            onChange={(e) => setDraft({ ...draft, expires: e.target.value })}
            className={fieldClass}
          />
        </Field>
      </div>
      <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={draft.opened}
          onChange={(e) =>
            setDraft({
              ...draft,
              opened: e.target.checked,
              expires: defaultExpiry(draft.name, draft.bought, e.target.checked),
            })
          }
          className="size-5 accent-mint"
        />
        Already opened (shorter estimate)
      </label>
      <p className="mt-2 text-xs text-muted">Estimates follow typical fridge life. Trust the printed date if you have one.</p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink">
          Save
        </button>
        {item && (
          <button
            type="button"
            onClick={() => {
              removeItem(item.id)
              onClose()
            }}
            className="grid size-11 place-items-center rounded-card border border-line text-clay"
            aria-label="Remove"
          >
            <Trash2 className="size-5" />
          </button>
        )}
      </div>
    </Sheet>
  )
}

function SettingsSheet({ onClose }: { onClose: () => void }) {
  const settings = useFridge((s) => s.settings)
  const setSettings = useFridge((s) => s.setSettings)
  const items = useFridge((s) => s.items)
  const shop = useFridge((s) => s.shop)
  const loadSample = useFridge((s) => s.loadSample)
  const clearItems = useFridge((s) => s.clearItems)
  const replaceAll = useFridge((s) => s.replaceAll)

  function exportJson() {
    const blob = new Blob([JSON.stringify({ items, shop, settings }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fridge-ai.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text) as { items?: FoodItem[] }
    if (!Array.isArray(data.items)) return
    replaceAll(data.items.filter((row) => row && typeof row.name === "string" && typeof row.expires === "string"))
  }

  return (
    <Sheet title="Settings" onClose={onClose}>
      <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
        Vegetarian recipes only
        <input
          type="checkbox"
          checked={settings.vegetarian}
          onChange={(e) => setSettings({ vegetarian: e.target.checked })}
          className="size-5 accent-mint"
        />
      </label>
      <label className="mt-3 flex min-h-11 items-center justify-between gap-3 text-sm">
        Remind me about food due today
        <input
          type="checkbox"
          checked={settings.notify}
          onChange={(e) => {
            const on = e.target.checked
            setSettings({ notify: on })
            if (on && typeof Notification !== "undefined" && Notification.permission === "default") {
              void Notification.requestPermission()
            }
          }}
          className="size-5 accent-mint"
        />
      </label>
      <label className="mt-3 block text-sm text-muted">
        Reminder hour
        <select
          value={settings.remindHour}
          onChange={(e) => setSettings({ remindHour: Number(e.target.value) })}
          className={cn(fieldClass, "mt-1")}
        >
          {[7, 12, 17, 18, 19, 20, 21].map((hour) => (
            <option key={hour} value={hour}>
              {hour}:00
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-xs text-muted">
        The reminder fires while this app is open, after the hour you pick. Install it to keep it one tap away.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => loadSample()} className="h-11 rounded-card border border-line text-sm font-semibold">
          Load sample
        </button>
        <button type="button" onClick={exportJson} className="h-11 rounded-card border border-line text-sm font-semibold">
          Export
        </button>
        <label className="flex h-11 items-center justify-center rounded-card border border-line text-sm font-semibold">
          Import
          <input type="file" accept="application/json" className="sr-only" onChange={(e) => void onImport(e.target.files?.[0])} />
        </label>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Remove every stored item on this phone?")) clearItems()
          }}
          className="h-11 rounded-card border border-line text-sm font-semibold text-clay"
        >
          Clear fridge
        </button>
      </div>
    </Sheet>
  )
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-bg/80 sm:items-center" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-card border border-line bg-surface p-5 sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-muted">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  )
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-6">
      <p className="font-display text-2xl">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  )
}

async function shrinkImage(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  let quality = 0.72
  let url = canvas.toDataURL("image/jpeg", quality)
  while (url.length > 1_200_000 && quality > 0.45) {
    quality -= 0.08
    url = canvas.toDataURL("image/jpeg", quality)
  }
  return url.length > 1_400_000 ? "" : url
}
