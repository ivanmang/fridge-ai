import { useState } from "react"
import { fieldClass, Sheet, useI18n } from "@/components/fridge/shared"
import { fetchDoorPhoto, puckError, shrinkImage } from "@/components/fridge/puck"
import { foodLabel } from "@/lib/i18n"
import { defaultExpiry } from "@/lib/logic"
import { scanErrorKey, isScanErrorCode } from "@/lib/scan-errors"
import { scanFoods } from "@/lib/scan.functions"
import { draftFromName, useFridge } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Camera } from "lucide-react"
import type { ScanRow } from "@/components/fridge/shared"

export function ScanPanel({ onManual }: { onManual: () => void }) {
  const addMany = useFridge((s) => s.addMany)
  const puckHost = useFridge((s) => s.settings.puckHost || "http://fridgesnap.local")
  const { locale, t } = useI18n()
  const [preview, setPreview] = useState("")
  const [rows, setRows] = useState<ScanRow[]>([])
  const [busy, setBusy] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [puckReady, setPuckReady] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const setSettings = useFridge((s) => s.setSettings)

  async function onFile(file: File | undefined) {
    if (!file) return
    setError("")
    setSaved("")
    setRows([])
    try {
      const image = await shrinkImage(file)
      if (!image) { setError(t("tooLarge")); return }
      setPreview(image)
    } catch {
      setError(t("scanFailed"))
    }
  }

  async function pullDoor() {
    setPulling(true)
    setError("")
    setSaved("")
    setRows([])
    try {
      const file = await fetchDoorPhoto(puckHost)
      await onFile(file)
      setPuckReady(true)
    } catch (err) {
      setPuckReady(false)
      setError(puckError(locale, err))
    } finally {
      setPulling(false)
    }
  }

  async function identify() {
    if (!preview) return
    setBusy(true)
    setError("")
    setSaved("")
    try {
      const result = await scanFoods({ data: { image: preview } })
      if (!result.ok) {
        setError(t(scanErrorKey(result.error)))
        setRows([])
        return
      }
      if (!result.foods.length) {
        setError(t("nothingSeen"))
        setRows([])
        return
      }
      setRows(
        result.foods.map((food) => ({
          ...food,
          name: foodLabel(locale, food.name),
          on: true,
          expires: defaultExpiry(food.name),
          expirySource: "estimated" as const,
        })),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : ""
      setError(t(isScanErrorCode(message) ? scanErrorKey(message) : "scanFailed"))
    } finally {
      setBusy(false)
    }
  }

  const httpsPuck =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    /^https?:\/\//i.test(puckHost) &&
    !/^https:\/\//i.test(puckHost)

  function save() {
    const chosen = rows.filter((row) => row.on && row.name.trim())
    if (!chosen.length) {
      setError(t("tickOne"))
      return
    }
    addMany(chosen.map((row) => ({ ...draftFromName(row.name, row.qty), expires: row.expires, expirySource: row.expirySource })))
    setRows([])
    setPreview("")
    setSaved(t("added", { n: chosen.length }))
  }

  return (
    <section className="space-y-4">
      <p className="text-base leading-relaxed text-muted">
        {t("scanIntro")}
      </p>
      <p className="rounded-card border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-muted">{t("privacyScan")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface px-4 py-6 text-center">
          <Camera className="size-6 text-mint" />
          <span className="mt-2 text-sm font-medium">{t("phonePhoto")}</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
        <button
          type="button"
          disabled={pulling || busy}
          onClick={() => void pullDoor()}
          className="min-h-32 rounded-card border border-line bg-surface px-4 text-center font-semibold disabled:opacity-60"
        >
          <span className="block">{pulling ? t("askingPuck") : t("fridgeSnap")}</span>
          <span className="mt-1 block text-sm font-normal leading-relaxed text-muted">{puckReady ? t("lastDoor") : t("fridgeSnapOffline")}</span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onManual} className="min-h-11 rounded-card border border-line p-2 text-sm font-semibold">{t("addManually")}</button>
        <button type="button" onClick={() => setSetupOpen(true)} className="min-h-11 rounded-card border border-line p-2 text-sm font-semibold">{t("fridgeSnapSetup")}</button>
      </div>
      {httpsPuck && (
        <p role="status" className="rounded-card border border-clay/40 bg-clay/10 px-3 py-3 text-sm leading-relaxed text-clay">
          {t("httpsPuckWarn")}
        </p>
      )}
      {preview && <img src={preview} alt={t("shelfAlt")} className="max-h-56 w-full rounded-card object-cover" />}
      {preview && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void identify()}
          className="h-11 w-full rounded-card bg-mint font-semibold text-mint-ink disabled:opacity-60"
        >
          {busy ? t("reading") : t("identify")}
        </button>
      )}
      {error && <p role="alert" className="text-sm text-clay">{error}</p>}
      {saved && <p role="status" className="text-sm text-mint">{saved}</p>}
      {setupOpen && (
        <Sheet title={t("fridgeSnap")} onClose={() => setSetupOpen(false)}>
          <p className="text-sm text-muted">{t("doorNote")}</p>
          {httpsPuck && (
            <p role="alert" className="mt-3 rounded-card border border-clay/40 bg-clay/10 px-3 py-3 text-sm text-clay">
              {t("httpsPuckWarn")}
            </p>
          )}
          <label className="mt-4 block text-sm text-muted">
            {t("doorAddr")}
            <input value={puckHost} onChange={(e) => { setSettings({ puckHost: e.target.value }); setPuckReady(false) }} className={cn(fieldClass, "mt-1")} spellCheck={false} />
          </label>
          <button type="button" disabled={pulling} onClick={() => void pullDoor()} className="mt-4 h-11 w-full rounded-card bg-mint font-semibold text-mint-ink disabled:opacity-60">{pulling ? t("askingPuck") : t("testConnection")}</button>
          {error && <p role="alert" className="mt-3 text-sm text-clay">{error}</p>}
          {puckReady && <p role="status" className="mt-3 text-sm text-mint">{t("connected")}</p>}
        </Sheet>
      )}
      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-card border border-mint/40 bg-mint/10 px-4 py-3">
            <p className="font-semibold">{t("reviewCount", { n: rows.length })}</p>
            <p className="mt-1 text-sm text-muted">{t("nothingSaved")}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setRows((current) => current.map((row) => ({ ...row, on: true })))} className="h-10 rounded-full border border-line px-3 text-sm">{t("confirmAll")}</button>
            <button type="button" onClick={() => setRows((current) => current.map((row) => ({ ...row, on: false })))} className="h-10 rounded-full border border-line px-3 text-sm">{t("uncheckAll")}</button>
          </div>
          <p className="text-sm text-muted">{t("uncheck")}</p>
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
                        i === index ? { ...item, name: e.target.value, expires: item.expirySource === "package" ? item.expires : defaultExpiry(e.target.value) } : item,
                      ),
                    )
                  }
                  aria-label={t("name")}
                  className="h-10 min-w-0 flex-1 bg-transparent font-medium outline-none"
                />
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  value={row.qty}
                  onChange={(e) =>
                    setRows((current) => current.map((item, i) => (i === index ? { ...item, qty: e.target.value } : item)))
                  }
                  aria-label={t("qty")}
                  className={fieldClass}
                />
                <label className="block text-sm text-muted">
                  {t("dateSource")}
                  <select
                    value={row.expirySource}
                    onChange={(e) => setRows((current) => current.map((item, i) => (i === index ? { ...item, expirySource: e.target.value as ScanRow["expirySource"] } : item)))}
                    className={fieldClass}
                  >
                    <option value="estimated">{t("dateSourceEstimated")}</option>
                    <option value="package">{t("dateSourcePackage")}</option>
                  </select>
                </label>
                <label className="block text-sm text-muted">
                  {t("expires")}
                  <input
                    type="date"
                    value={row.expires}
                    onChange={(e) => setRows((current) => current.map((item, i) => (i === index ? { ...item, expires: e.target.value } : item)))}
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>
          ))}
          <button type="button" onClick={save} className="h-11 w-full rounded-card bg-mint font-semibold text-mint-ink">
            {t("saveTicked")}
          </button>
        </div>
      )}
    </section>
  )
}

