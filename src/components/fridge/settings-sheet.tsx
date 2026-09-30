import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Field, Sheet, SuggestControl, fieldClass, useI18n, type Draft } from "@/components/fridge/shared"
import { TasteProfile } from "@/components/fridge/survey-panel"
import { BACKUP_VERSION, parseBackup } from "@/lib/backup"
import { foodLabel } from "@/lib/i18n"
import {
  defaultExpiry,
  findShelf,
  type FoodItem,
} from "@/lib/logic"
import { draftFromName, useFridge } from "@/lib/store"
import { emptySurvey } from "@/lib/survey"
import { SHELF } from "@/lib/shelf"
import { cn } from "@/lib/utils"

export function ItemSheet({ item, onClose }: { item?: FoodItem; onClose: () => void }) {
  const addItem = useFridge((s) => s.addItem)
  const existing = useFridge((s) => s.items)
  const updateItem = useFridge((s) => s.updateItem)
  const removeItem = useFridge((s) => s.removeItem)
  const { locale, t } = useI18n()
  const [draft, setDraft] = useState<Draft>(() => {
    const base = item
      ? {
          name: item.name,
          qty: item.qty,
          location: item.location,
          bought: item.bought,
          expires: item.expires,
          expirySource: item.expirySource ?? "estimated",
          opened: item.opened,
        }
      : draftFromName("")
    return { ...base, name: foodLabel(locale, base.name) }
  })

  function applyName(name: string) {
    const shelf = findShelf(name)
    setDraft((current) => ({
      ...current,
      name,
      location: shelf?.location ?? current.location,
      expires: current.expirySource === "package" || !name.trim() ? current.expires : defaultExpiry(name, current.bought, current.opened),
    }))
  }

  function save() {
    if (!draft.name.trim()) return
    if (item) updateItem(item.id, draft)
    else addItem(draft)
    onClose()
  }

  return (
    <Sheet title={item ? t("editFood") : t("addFood")} onClose={onClose}>
      {!item && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label={t("quickAdd")}>
          {[...new Set([...existing.slice(0, 3).map((row) => row.name), "Eggs", "Milk", "Tomato", "Chicken breast"])].slice(0, 6).map((name) => (
            <button key={name} type="button" onClick={() => applyName(foodLabel(locale, name))} className="h-10 shrink-0 rounded-full border border-line bg-raised px-3 text-sm">{foodLabel(locale, name)}</button>
          ))}
        </div>
      )}
      <label className="block text-sm text-muted">
        {t("name")}
        <input list="shelf-names" value={draft.name} onChange={(e) => applyName(e.target.value)} className={cn(fieldClass, "mt-1")} />
        <datalist id="shelf-names">
          {SHELF.map((food) => (
            <option key={food.name} value={foodLabel(locale, food.name)} />
          ))}
        </datalist>
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label={t("qty")}>
          <input value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: e.target.value })} className={fieldClass} />
        </Field>
        <Field label={t("where")}>
          <select
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value as Draft["location"] })}
            className={fieldClass}
          >
            <option value="fridge">{t("placeFridge")}</option>
            <option value="freezer">{t("placeFreezer")}</option>
            <option value="pantry">{t("placePantry")}</option>
          </select>
        </Field>
        <Field label={t("boughtDate")}>
          <input
            type="date"
            value={draft.bought}
            onChange={(e) =>
              setDraft({
                ...draft,
                bought: e.target.value,
                expires: draft.expirySource === "package" ? draft.expires : defaultExpiry(draft.name, e.target.value, draft.opened),
              })
            }
            className={fieldClass}
          />
        </Field>
        <Field label={t("useBy")}>
          <input
            type="date"
            value={draft.expires}
            onChange={(e) => setDraft({ ...draft, expires: e.target.value })}
            className={fieldClass}
          />
        </Field>
      </div>
      <Field label={t("dateSource")}>
        <select
          value={draft.expirySource ?? "estimated"}
          onChange={(e) => setDraft({ ...draft, expirySource: e.target.value as Draft["expirySource"], expires: e.target.value === "estimated" ? defaultExpiry(draft.name, draft.bought, draft.opened) : draft.expires })}
          className={fieldClass}
        >
          <option value="estimated">{t("dateSourceEstimated")}</option>
          <option value="package">{t("dateSourcePackage")}</option>
        </select>
      </Field>
      <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={draft.opened}
          onChange={(e) =>
            setDraft({
              ...draft,
              opened: e.target.checked,
              expires: draft.expirySource === "package" ? draft.expires : defaultExpiry(draft.name, draft.bought, e.target.checked),
            })
          }
          className="size-5 accent-mint"
        />
        {t("opened")}
      </label>
      <p className="mt-2 text-sm leading-relaxed text-muted">{draft.expirySource === "package" ? t("packageDateHint") : t("estimateHint")}</p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} className="h-11 flex-1 rounded-card bg-mint font-semibold text-mint-ink">
          {t("save")}
        </button>
        {item && (
          <button
            type="button"
            onClick={() => {
              removeItem(item.id)
              onClose()
            }}
            className="grid size-11 place-items-center rounded-card border border-line text-clay"
            aria-label={t("remove")}
          >
            <Trash2 className="size-5" />
          </button>
        )}
      </div>
    </Sheet>
  )
}


export function SettingsSheet({ onClose, onEditTaste }: { onClose: () => void; onEditTaste?: () => void }) {
  const settings = useFridge((s) => s.settings)
  const setSettings = useFridge((s) => s.setSettings)
  const items = useFridge((s) => s.items)
  const shop = useFridge((s) => s.shop)
  const extras = useFridge((s) => s.extras)
  const loadSample = useFridge((s) => s.loadSample)
  const mergeSample = useFridge((s) => s.mergeSample)
  const clearItems = useFridge((s) => s.clearItems)
  const [backupMessage, setBackupMessage] = useState("")
  const [sampleOpen, setSampleOpen] = useState(false)

  const { t } = useI18n()
  const httpsPuck =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    /^https?:\/\//i.test(settings.puckHost || "http://fridgesnap.local") &&
    !/^https:\/\//i.test(settings.puckHost || "http://fridgesnap.local")

  function exportJson() {
    const blob = new Blob(
      [JSON.stringify({ version: BACKUP_VERSION, items, shop, extras, settings }, null, 2)],
      { type: "application/json" },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fridge-ai.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    try {
      const data = parseBackup(JSON.parse(await file.text()))
      useFridge.setState((state) => ({
        items: data.items,
        shop: data.shop ?? state.shop,
        extras: data.extras ?? state.extras,
        settings: data.settings
          ? { ...state.settings, ...data.settings, onboarded: true }
          : { ...state.settings, onboarded: true },
      }))
      setBackupMessage(t("backupImported"))
    } catch {
      setBackupMessage(t("backupFailed"))
    }
  }

  function onSampleClick() {
    if (!items.length) {
      loadSample()
      return
    }
    setSampleOpen(true)
  }

  return (
    <Sheet title={t("settings")} onClose={onClose}>
      <p className="mb-3 text-base leading-relaxed text-muted">{t("chooseHowBody")}</p>
      <p className="mb-4 rounded-card border border-line bg-raised px-3 py-3 text-sm leading-relaxed text-muted">{t("privacySettings")}</p>
      <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
        {t("veg")}
        <input
          type="checkbox"
          checked={settings.vegetarian}
          onChange={(e) => setSettings({ vegetarian: e.target.checked })}
          className="size-5 accent-mint"
        />
      </label>
      <div className="mt-4">
        <SuggestControl />
      </div>
      <div className="mt-4">
        <TasteProfile
          onEdit={() => {
            setSettings({ survey: { ...(settings.survey ?? emptySurvey), done: false } })
            if (onEditTaste) onEditTaste()
            else onClose()
          }}
        />
      </div>
      <label className="mt-3 flex min-h-11 items-center justify-between gap-3 text-sm">
        {t("remind")}
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
        {t("remindHour")}
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
      <p className="mt-2 text-sm leading-relaxed text-muted">{t("remindNote")}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t("remindSpendNote")}</p>
      <details className="mt-4 rounded-card border border-line p-3">
        <summary className="cursor-pointer text-sm font-semibold">{t("fridgeSnap")}</summary>
        <label className="mt-3 block text-sm text-muted">
          {t("doorAddr")}
          <input value={settings.puckHost ?? "http://fridgesnap.local"} onChange={(e) => setSettings({ puckHost: e.target.value })} spellCheck={false} autoCapitalize="off" className={cn(fieldClass, "mt-1")} />
        </label>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("doorNote")}</p>
        {httpsPuck && (
          <p role="alert" className="mt-2 text-sm leading-relaxed text-clay">
            {t("httpsPuckWarn")}
          </p>
        )}
      </details>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onSampleClick} className="h-11 rounded-card border border-line text-sm font-semibold">
          {t("loadSample")}
        </button>
        <button type="button" onClick={exportJson} className="h-11 rounded-card border border-line text-sm font-semibold">
          {t("export")}
        </button>
        <label className="flex h-11 items-center justify-center rounded-card border border-line text-sm font-semibold">
          {t("import")}
          <input type="file" accept="application/json" className="sr-only" onChange={(e) => void onImport(e.target.files?.[0])} />
        </label>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t("clearConfirm"))) clearItems()
          }}
          className="h-11 rounded-card border border-line text-sm font-semibold text-clay"
        >
          {t("clearFridge")}
        </button>
      </div>
      {backupMessage && <p role="status" className="mt-3 text-sm text-mint">{backupMessage}</p>}
      {sampleOpen && (
        <Sheet title={t("loadSample")} onClose={() => setSampleOpen(false)}>
          <p className="text-sm text-muted">{t("sampleReplaceConfirm")}</p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => {
                loadSample()
                setSampleOpen(false)
              }}
              className="h-11 rounded-card bg-mint font-semibold text-mint-ink"
            >
              {t("sampleReplace")}
            </button>
            <button
              type="button"
              onClick={() => {
                mergeSample()
                setSampleOpen(false)
              }}
              className="h-11 rounded-card border border-line font-semibold"
            >
              {t("sampleMerge")}
            </button>
            <button type="button" onClick={() => setSampleOpen(false)} className="h-11 text-sm text-muted">
              {t("cancel")}
            </button>
          </div>
        </Sheet>
      )}
    </Sheet>
  )
}
