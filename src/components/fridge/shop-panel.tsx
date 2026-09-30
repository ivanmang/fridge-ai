import { useMemo, useRef, useState } from "react"
import { fieldClass, Sheet, useI18n } from "@/components/fridge/shared"
import { foodLabel, recipeText, whenText } from "@/lib/i18n"
import {
  daysUntil,
  fitsTaste,
  ideasByIds,
  isOutlineRecipe,
  planMeals,
  searchRecipes,
  shopForIdeas,
  type FoodItem,
  type RankedRecipe,
} from "@/lib/logic"
import { lookupDishes } from "@/lib/dish.functions"
import { draftFromName, useFridge, type ShopNote } from "@/lib/store"
import { surveyReady } from "@/lib/survey"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export function DishSearch() {
  const { locale, t } = useI18n()
  const items = useFridge((s) => s.items)
  const vegetarian = useFridge((s) => s.settings.vegetarian)
  const taste = useFridge((s) => (surveyReady(s.settings.survey) ? s.settings.survey : null))
  const wanted = useFridge((s) => s.settings.wanted) ?? []
  const extras = useFridge((s) => s.extras) ?? []
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
  const hits = useMemo(() => searchRecipes(query, items, vegetarian, taste), [query, items, vegetarian, taste])
  const picked = useMemo(() => ideasByIds(wanted, items, extras), [wanted, items, extras])

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
      } else setWarn(t("lookupUnavailable"))
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
        <button type="button" disabled={looking} onClick={() => void lookUp()} className="mt-2 h-11 w-full rounded-card border border-line text-sm font-semibold disabled:opacity-60">{looking ? t("looking") : t("searchMoreDishes")}</button>
      )}
      {warn && !adding && <p role="status" className="mt-2 text-sm text-clay">{warn}</p>}
      {query.trim() && (
        <div className="mt-2 space-y-2">
          {!hits.length && !others.length && !looking && <p className="text-sm text-muted">{t("noDish")}</p>}
          {hits.map((row) => (
            <ResultButton key={row.recipe.id} recipe={row.recipe} missing={row.missing} />
          ))}
          {(others.length > 0 || looking) && hits.length > 0 && <p className="pt-1 text-sm text-muted">{t("otherDishes")}</p>}
          {looking && <p className="text-sm text-muted">{t("looking")}</p>}
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


export function ShopPanel({ items }: { items: FoodItem[] }) {
  const shop = useFridge((s) => s.shop)
  const addShop = useFridge((s) => s.addShop)
  const toggleShop = useFridge((s) => s.toggleShop)
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
  const [boughtCandidate, setBoughtCandidate] = useState<ShopNote | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const plan = useMemo(() => planMeals(items, vegetarian, priority, favorites, taste, extras), [items, vegetarian, priority, favorites, taste, extras])
  const picked = useMemo(() => ideasByIds(wanted, items, extras).filter((row) => !isOutlineRecipe(row.recipe)), [wanted, items, extras])
  const focus = picked.length ? picked : plan.ideas
  const shopRows = picked.length ? shopForIdeas(items, picked) : plan.shop
  const low = items.filter((item) => daysUntil(item.expires) >= 0 && daysUntil(item.expires) <= 2)
  const join = (names: string[]) => names.map((name) => foodLabel(locale, name)).join(locale === "zh" ? "、" : ", ")

  function addSuggested() {
    const have = new Set(shop.map((row) => row.text.toLowerCase()))
    for (const row of shopRows) {
      const label = foodLabel(locale, row.name)
      if (!have.has(label.toLowerCase())) { addShop(label); have.add(label.toLowerCase()) }
    }
  }

  return (
    <section className="space-y-5">
      <h2 className="font-display text-3xl">{t("shoppingList")}</h2>
      {focus.length > 0 && (
        <div>
          <h2 className="font-display text-2xl">{t("forTonight")}</h2>
          {shopRows.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t("nothingExtra")}</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {shopRows.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3"
                  >
                    <span>
                      <span className="block font-medium">{foodLabel(locale, row.name)}</span>
                      <span className="text-sm text-muted">
                        {t("forList", {
                          list: join(
                            row.recipeIds.map((id) => recipeText(locale, focus.find((idea) => idea.recipe.id === id)!.recipe).name),
                          ),
                        })}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const label = foodLabel(locale, row.name)
                        if (!shop.some((note) => !note.done && note.text.toLowerCase() === label.toLowerCase())) addShop(label)
                      }}
                      className="h-10 shrink-0 rounded-full bg-mint px-3 text-sm font-semibold text-mint-ink"
                    >
                      {t("addToShoppingList")}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={addSuggested} className="mt-3 h-11 w-full rounded-card border border-line text-sm font-semibold">
                {t("addToShoppingList")}
              </button>
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
          className="h-11 min-w-0 flex-1 rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
        />
        <button type="submit" className="h-11 rounded-card bg-raised px-4 text-sm font-semibold">
          {t("add")}
        </button>
      </form>
      <ShopNotes notes={shop} onToggle={(id) => {
        const found = shop.find((row) => row.id === id)
        toggleShop(id)
        if (found && !found.done) setBoughtCandidate(found)
      }} onClear={clearDoneShop} />
      <button type="button" onClick={() => setSearchOpen((open) => !open)} className="h-11 w-full rounded-card border border-line text-sm font-semibold">{t("searchDish")}</button>
      {searchOpen && <DishSearch />}
      {low.length > 0 && (
        <div>
          <h2 className="font-display text-2xl">{t("useOrReplace")}</h2>
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
              return <li key={row.recipe.id} className="border-t border-line py-2 text-sm">
                <p className="font-medium">{copy.name} · {t("minutes", { n: row.recipe.time })}</p>
                <p className="text-muted">{row.missing.length ? t("stillNeed", { list: join(row.missing) }) : t("haveAll")}</p>
              </li>
            })}
          </ul>
        </details>
      )}
      {boughtCandidate && (
        <Sheet title={t("addToFridge")} onClose={() => setBoughtCandidate(null)}>
          <p className="text-sm text-muted">{boughtCandidate.text}</p>
          <p className="mt-2 text-xs text-muted">{t("estimateHint")}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setBoughtCandidate(null)} className="h-11 flex-1 rounded-card border border-line text-sm font-semibold">{t("keepOnList")}</button>
            <button type="button" onClick={() => { addItem(draftFromName(boughtCandidate.text)); setBoughtCandidate(null) }} className="h-11 flex-1 rounded-card bg-mint text-sm font-semibold text-mint-ink">{t("addToFridge")}</button>
          </div>
        </Sheet>
      )}
    </section>
  )
}


export function ShopNotes({
  notes,
  onToggle,
  onClear,
}: {
  notes: ShopNote[]
  onToggle: (id: string) => void
  onClear: () => void
}) {
  const { t } = useI18n()
  if (!notes.length) return null
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-2xl">{t("shoppingList")}</h2>
        <button type="button" onClick={onClear} className="text-sm text-muted">
          {t("clearCompleted")}
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


