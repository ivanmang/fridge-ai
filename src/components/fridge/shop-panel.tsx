import { useDeferredValue, useMemo, useRef, useState } from "react"
import { BusyButton, fieldClass, LoadingStatus, Sheet, useI18n } from "@/components/fridge/shared"
import { foodLabel, placeLabel, recipeText, whenText } from "@/lib/i18n"
import {
  daysUntil,
  defaultExpiry,
  findShelf,
  fitsTaste,
  ideasByIds,
  isOutlineRecipe,
  planMeals,
  searchRecipes,
  shopForIdeas,
  todayISO,
  type FoodItem,
  type RankedRecipe,
} from "@/lib/logic"
import { lookupDishes } from "@/lib/dish.functions"
import { draftFromName, sameShopText, useFridge, type ShopNote } from "@/lib/store"
import { surveyReady } from "@/lib/survey"
import { cn } from "@/lib/utils"
import { Check, Trash2 } from "lucide-react"

const QUICK_STAPLES = ["Eggs", "Milk", "Soy sauce", "Garlic", "Ginger", "Rice", "Onion", "Tomato", "Oyster sauce"]

export function DishSearch() {
  const { locale, t } = useI18n()
  const items = useFridge((s) => s.items)
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const taste = useFridge((s) => (surveyReady(s.settings.survey) ? s.settings.survey : null))
  const wanted = useFridge((s) => s.settings.wanted) ?? []
  const extras = useFridge((s) => s.extras) ?? []
  const includeOutlines = useFridge((s) => s.settings.includeOutlines ?? false)
  const setSettings = useFridge((s) => s.setSettings)
  const saveExtra = useFridge((s) => s.saveExtra)
  const [query, setQuery] = useState("")
  const [remote, setRemote] = useState<RankedRecipe["recipe"][]>([])
  const [looking, setLooking] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [ingredient, setIngredient] = useState("")
  const [needs, setNeeds] = useState<string[]>([])
  const [warn, setWarn] = useState("")
  const [stepText, setStepText] = useState("")
  const requestRef = useRef(0)
  const deferredQuery = useDeferredValue(query)
  const hits = useMemo(
    () => searchRecipes(deferredQuery, items, vegetarian, taste, { includeOutlines }),
    [deferredQuery, items, vegetarian, taste, includeOutlines],
  )
  const picked = useMemo(() => ideasByIds(wanted, items, extras), [wanted, items, extras])
  const searchPending = query.trim() !== deferredQuery.trim()

  async function lookUp() {
    const q = query.trim()
    if (q.length < 2 || looking) return
    const request = ++requestRef.current
    setLooking(true)
    setWarn("")
    try {
      const result = await lookupDishes({ data: { query: q, vegetarian, locale } })
      if (request !== requestRef.current) return
      if (result.ok) {
        setRemote(result.dishes)
        if (!result.dishes.length) setWarn(t("noMoreDishes"))
      } else setWarn(t(result.error === "limit" ? "lookupLimit" : "lookupUnavailable"))
    } catch {
      if (request === requestRef.current) setWarn(t("lookupUnavailable"))
    } finally {
      if (request === requestRef.current) setLooking(false)
    }
  }

  function toggle(id: string) {
    setSettings({ wanted: wanted.includes(id) ? wanted.filter((item) => item !== id) : [...wanted, id] })
  }

  function addNeed() {
    const next = ingredient.trim()
    if (!next) return
    if (!needs.some((item) => item.toLowerCase() === next.toLowerCase())) setNeeds((current) => [...current, next])
    setIngredient("")
    setWarn("")
  }

  function saveMine() {
    const dish = name.trim()
    if (!dish) {
      setWarn(t("needName"))
      return
    }
    if (!needs.length) {
      setWarn(t("needIngredient"))
      return
    }
    const steps = stepText.split("\n").map((line) => line.trim()).filter(Boolean)
    if (!steps.length) {
      setWarn(t("needStep"))
      return
    }
    const id = `mine-${crypto.randomUUID()}`
    saveExtra({
      id,
      name: dish,
      cuisine: "Home",
      time: 20,
      servings: 2,
      need: needs,
      optional: [],
      steps,
    })
    if (!wanted.includes(id)) setSettings({ wanted: [...wanted, id] })
    setAdding(false)
    setQuery("")
  }

  const mine = extras.filter((recipe) => recipe.id.startsWith("mine-"))

  const known = new Set(hits.map((row) => row.recipe.name.toLowerCase()))
  const others = remote.filter(
    (recipe) => !known.has(recipe.name.toLowerCase()) && !hits.some((row) => row.recipe.id === recipe.id) && fitsTaste(recipe, taste),
  )

  function ResultButton({ recipe, missing }: { recipe: RankedRecipe["recipe"]; missing: string[] }) {
    const copy = recipeText(locale, recipe)
    const on = wanted.includes(recipe.id)
    return (
      <button
        type="button"
        onClick={() => {
          if (!hits.some((row) => row.recipe.id === recipe.id)) saveExtra(recipe)
          toggle(recipe.id)
        }}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-3 rounded-card border px-4 text-left",
          on ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface",
        )}
      >
        <span>
          <span className="block font-medium">{copy.name}</span>
          <span className={cn("text-sm", on ? "text-mint-ink" : "text-muted")}>
            {copy.cuisine}
            {missing.length ? ` · ${t("missing", { list: missing.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ") })}` : ""}
          </span>
        </span>
      </button>
    )
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setRemote([]); setWarn(""); requestRef.current++ }}
        placeholder={t("searchDish")}
        aria-label={t("searchDish")}
        className="h-11 w-full rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
      />
      {query.trim().length >= 2 && (
        <BusyButton
          busy={looking}
          busyLabel={t("looking")}
          onClick={() => void lookUp()}
          className="mt-2 h-11 w-full rounded-card border border-line text-sm font-semibold"
        >
          {t("searchMoreDishes")}
        </BusyButton>
      )}
      {warn && !adding && <p role="status" className="mt-2 text-sm text-clay">{warn}</p>}
      {searchPending && query.trim() && <LoadingStatus>{t("updatingIdeas")}</LoadingStatus>}
      {query.trim() && (
        <div className="mt-2 space-y-2">
          {!hits.length && !others.length && !looking && <p className="text-sm text-muted">{t("noDish")}</p>}
          {hits.map((row) => (
            <ResultButton key={row.recipe.id} recipe={row.recipe} missing={row.missing} />
          ))}
          {(others.length > 0 || looking) && hits.length > 0 && <p className="pt-1 text-sm text-muted">{t("otherDishes")}</p>}
          {looking && <LoadingStatus>{t("looking")}</LoadingStatus>}
          {others.map((recipe) => (
            <ResultButton key={recipe.id} recipe={recipe} missing={ideasByIds([recipe.id], items, [recipe])[0]?.missing ?? recipe.need} />
          ))}
        </div>
      )}
      {!adding && (
        <button
          type="button"
          onClick={() => {
            setName(query.trim())
            setNeeds([])
            setIngredient("")
            setStepText("")
            setWarn("")
            setAdding(true)
          }}
          className="mt-2 h-11 w-full rounded-card border border-line text-sm font-semibold"
        >
          {t("addMyDish")}
        </button>
      )}
      {adding && (
        <form
          className="mt-2 space-y-2 rounded-card border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMine()
          }}
        >
          <label className="block text-sm">
            {t("dishName")}
            <input value={name} onChange={(e) => setName(e.target.value)} className={cn(fieldClass, "mt-1")} />
          </label>
          <div className="flex gap-2">
            <input
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addNeed()
                }
              }}
              placeholder={t("ingredient")}
              aria-label={t("ingredient")}
              className={fieldClass}
            />
            <button type="button" onClick={addNeed} className="h-11 shrink-0 rounded-card border border-line px-3 text-sm font-semibold">
              {t("addIngredient")}
            </button>
          </div>
          {needs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {needs.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setNeeds((current) => current.filter((need) => need !== item))}
                  className="h-11 rounded-full border border-line px-3 text-sm"
                >
                  {foodLabel(locale, item)}
                </button>
              ))}
            </div>
          )}
          <label className="block text-sm">
            {t("cookingSteps")}
            <textarea value={stepText} onChange={(e) => setStepText(e.target.value)} rows={4} placeholder={t("stepsHint")} className="mt-1 w-full rounded-card border border-line bg-raised p-3 text-fg outline-none" />
          </label>
          {warn && <p role="alert" className="text-sm text-clay">{warn}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)} className="h-11 rounded-card border border-line px-4 text-sm font-semibold">
              {t("cancel")}
            </button>
            <button type="submit" className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink">
              {t("saveDish")}
            </button>
          </div>
        </form>
      )}
      {mine.length > 0 && (
        <div className="mt-3">
          <p className="text-sm">{t("myDishes")}</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {mine.map((recipe) => {
              const on = wanted.includes(recipe.id)
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => toggle(recipe.id)}
                  className={cn(
                    "h-11 shrink-0 rounded-full border px-3 text-sm",
                    on ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
                  )}
                >
                  {recipe.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {picked.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{t("wantedNow")}</p>
            <button type="button" onClick={() => setSettings({ wanted: [] })} className="text-sm text-muted">
              {t("clearWanted")}
            </button>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {picked.map((row) => (
              <button
                key={row.recipe.id}
                type="button"
                onClick={() => toggle(row.recipe.id)}
                className="h-11 shrink-0 rounded-full border border-mint bg-mint px-3 text-sm font-semibold text-mint-ink"
              >
                {recipeText(locale, row.recipe).name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type BoughtDraft = {
  note: ShopNote
  qty: string
  location: FoodItem["location"]
  expires: string
}

export function ShopPanel({ items }: { items: FoodItem[] }) {
  const shop = useFridge((s) => s.shop)
  const addShop = useFridge((s) => s.addShop)
  const toggleShop = useFridge((s) => s.toggleShop)
  const removeShop = useFridge((s) => s.removeShop)
  const clearDoneShop = useFridge((s) => s.clearDoneShop)
  const addItem = useFridge((s) => s.addItem)
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const taste = useFridge((s) => (surveyReady(s.settings.survey) ? s.settings.survey : null))
  const priority = useFridge((s) => (s.settings.priority ?? (s.settings.suggest === "free" ? 3 : 0)) as 0 | 1 | 2 | 3)
  const favorites = useFridge((s) => s.settings.favorites) ?? []
  const wanted = useFridge((s) => s.settings.wanted) ?? []
  const extras = useFridge((s) => s.extras) ?? []
  const { locale, t } = useI18n()
  const [note, setNote] = useState("")
  const [bought, setBought] = useState<BoughtDraft | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [flash, setFlash] = useState("")
  const plan = useMemo(() => planMeals(items, vegetarian, priority, favorites, taste, extras), [items, vegetarian, priority, favorites, taste, extras])
  const picked = useMemo(() => ideasByIds(wanted, items, extras).filter((row) => !isOutlineRecipe(row.recipe)), [wanted, items, extras])
  const focus = picked.length ? picked : plan.ideas
  const shopRows = picked.length ? shopForIdeas(items, picked) : plan.shop
  const low = items.filter((item) => daysUntil(item.expires) >= 0 && daysUntil(item.expires) <= 2)
  const join = (names: string[]) => names.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ")
  const openCount = shop.filter((row) => !row.done).length
  const doneCount = shop.filter((row) => row.done).length

  function onList(label: string) {
    return shop.some((row) => !row.done && sameShopText(row.text, label))
  }

  function addSuggested() {
    for (const row of shopRows) {
      addShop(foodLabel(locale, row.name))
    }
  }

  function openBought(found: ShopNote) {
    const draft = draftFromName(found.text)
    setBought({
      note: found,
      qty: draft.qty,
      location: draft.location,
      expires: draft.expires,
    })
  }

  function saveBought() {
    if (!bought) return
    const base = draftFromName(bought.note.text, bought.qty)
    addItem({
      ...base,
      location: bought.location,
      expires: bought.expires,
      bought: todayISO(),
    })
    removeShop(bought.note.id)
    setBought(null)
    setFlash(t("boughtSaved"))
    window.setTimeout(() => setFlash(""), 2200)
  }

  const staples = QUICK_STAPLES.filter((name) => !onList(foodLabel(locale, name)) && !onList(name))

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-3xl">{t("shoppingList")}</h2>
        <p className="mt-1 text-base leading-relaxed text-muted">{t("shopLead")}</p>
      </div>

      {focus.length > 0 && (
        <div>
          <h3 className="font-display text-2xl">{t("forTonight")}</h3>
          {shopRows.length === 0 ? (
            <p className="mt-2 text-base leading-relaxed text-muted">{t("nothingExtra")}</p>
          ) : (
            <>
              <p className="mt-1 text-base leading-relaxed text-muted">{t("tonightGapsLead")}</p>
              <ul className="mt-3 space-y-2">
                {shopRows.map((row) => {
                  const label = foodLabel(locale, row.name)
                  const listed = onList(label)
                  return (
                    <li
                      key={row.name}
                      className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block text-base font-medium leading-snug">{label}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                          {t("forList", {
                            list: join(
                              row.recipeIds.map((id) => recipeText(locale, focus.find((idea) => idea.recipe.id === id)!.recipe).name),
                            ),
                          })}
                        </span>
                      </span>
                      {listed ? (
                        <span className="shrink-0 text-sm font-semibold text-mint">{t("alreadyOnList")}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addShop(label)}
                          className="h-11 shrink-0 rounded-full bg-mint px-4 text-sm font-semibold text-mint-ink"
                        >
                          {t("addOne")}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
              {shopRows.some((row) => !onList(foodLabel(locale, row.name))) && (
                <button type="button" onClick={addSuggested} className="mt-3 h-11 w-full rounded-card border border-line text-sm font-semibold">
                  {t("addAllGaps")}
                </button>
              )}
            </>
          )}
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
          placeholder={t("shopNote")}
          aria-label={t("shopNote")}
          className="h-11 min-w-0 flex-1 rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
        />
        <button type="submit" className="h-11 rounded-card bg-raised px-4 text-sm font-semibold">
          {t("add")}
        </button>
      </form>

      {staples.length > 0 && (
        <div>
          <p className="text-sm text-muted">{t("quickStaples")}</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label={t("quickStaples")}>
            {staples.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => addShop(foodLabel(locale, name))}
                className="h-11 shrink-0 rounded-full border border-line bg-surface px-3 text-sm font-medium"
              >
                {foodLabel(locale, name)}
              </button>
            ))}
          </div>
        </div>
      )}

      <ShopNotes
        notes={shop}
        openCount={openCount}
        doneCount={doneCount}
        emptyHint={focus.length === 0 ? t("shopEmptyNoPlan") : t("shopEmptyBody")}
        onToggle={(id) => {
          const found = shop.find((row) => row.id === id)
          toggleShop(id)
          if (found && !found.done) openBought(found)
        }}
        onRemove={removeShop}
        onClear={clearDoneShop}
      />

      {flash && (
        <p role="status" className="text-sm text-mint">
          {flash}
        </p>
      )}

      <button type="button" onClick={() => setSearchOpen((open) => !open)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">
        {t("findDishShop")}
      </button>
      {searchOpen && <DishSearch />}

      {low.length > 0 && (
        <div>
          <h3 className="font-display text-2xl">{t("useOrReplace")}</h3>
          <ul className="mt-3 space-y-2">
            {low.map((item) => (
              <li key={item.id} className="rounded-card border border-line px-4 py-3 text-sm">
                <span className="font-medium">{foodLabel(locale, item.name)}</span>
                <span className="text-muted"> · {whenText(locale, item.expires)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {focus.length > 0 && (
        <details className="rounded-card border border-line bg-surface p-4">
          <summary className="cursor-pointer font-display text-xl">{picked.length ? t("wantedNow") : t("ideas")}</summary>
          <ul className="mt-3 space-y-2">
            {focus.map((row) => {
              const copy = recipeText(locale, row.recipe)
              return (
                <li key={row.recipe.id} className="border-t border-line py-2 text-sm">
                  <p className="font-medium">
                    {copy.name} · {t("minutes", { n: row.recipe.time })}
                  </p>
                  <p className="text-muted">{row.missing.length ? t("stillNeed", { list: join(row.missing) }) : t("haveAll")}</p>
                </li>
              )
            })}
          </ul>
        </details>
      )}

      {bought && (
        <Sheet title={t("addToFridge")} onClose={() => setBought(null)}>
          <p className="font-medium">{bought.note.text}</p>
          <p className="mt-1 text-sm text-muted">{t("boughtPreview")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("estimateHint")}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block text-sm text-muted">
              {t("qty")}
              <input
                value={bought.qty}
                onChange={(e) => setBought({ ...bought, qty: e.target.value })}
                className={cn(fieldClass, "mt-1")}
              />
            </label>
            <label className="block text-sm text-muted">
              {t("where")}
              <select
                value={bought.location}
                onChange={(e) => setBought({ ...bought, location: e.target.value as FoodItem["location"] })}
                className={cn(fieldClass, "mt-1")}
              >
                <option value="fridge">{t("placeFridge")}</option>
                <option value="freezer">{t("placeFreezer")}</option>
                <option value="pantry">{t("placePantry")}</option>
              </select>
            </label>
            <label className="col-span-2 block text-sm text-muted">
              {t("useBy")}
              <input
                type="date"
                value={bought.expires}
                onChange={(e) => setBought({ ...bought, expires: e.target.value })}
                className={cn(fieldClass, "mt-1")}
              />
            </label>
          </div>
          <p className="mt-2 text-sm text-muted">
            {placeLabel(locale, bought.location)}
            {findShelf(bought.note.text) ? ` · ${whenText(locale, bought.expires || defaultExpiry(bought.note.text))}` : ""}
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setBought(null)} className="h-11 flex-1 rounded-card border border-line text-sm font-semibold">
              {t("keepOnList")}
            </button>
            <button type="button" onClick={saveBought} className="h-11 flex-1 rounded-card bg-mint text-sm font-semibold text-mint-ink">
              {t("addToFridge")}
            </button>
          </div>
        </Sheet>
      )}
    </section>
  )
}

export function ShopNotes({
  notes,
  openCount,
  doneCount,
  emptyHint,
  onToggle,
  onRemove,
  onClear,
}: {
  notes: ShopNote[]
  openCount: number
  doneCount: number
  emptyHint: string
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const { t } = useI18n()
  if (!notes.length) {
    return (
      <div className="rounded-card border border-dashed border-line bg-surface px-4 py-5">
        <p className="font-display text-xl">{t("shopEmptyTitle")}</p>
        <p className="mt-2 text-base leading-relaxed text-muted">{emptyHint}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl">{t("yourList")}</h3>
          <p className="text-sm text-muted">
            {t("openItems", { n: openCount })}
            {doneCount > 0 ? ` · ${t("doneItems", { n: doneCount })}` : ""}
          </p>
        </div>
        {doneCount > 0 && (
          <button type="button" onClick={onClear} className="min-h-11 shrink-0 text-sm font-semibold text-muted">
            {t("clearDoneCount", { n: doneCount })}
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {notes.map((note) => (
          <li key={note.id} className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={() => onToggle(note.id)}
              className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-card border border-line px-4 text-left"
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border",
                  note.done ? "border-mint bg-mint text-mint-ink" : "border-line",
                )}
                aria-hidden
              >
                {note.done && <Check className="size-3.5" />}
              </span>
              <span className={cn("text-base font-medium leading-snug", note.done && "text-muted line-through")}>{note.text}</span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(note.id)}
              aria-label={t("removeFromList")}
              className="grid size-12 shrink-0 place-items-center rounded-card border border-line text-muted"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
