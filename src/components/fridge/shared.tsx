import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"
import { cuisineLabel, translate, type UiKey } from "@/lib/i18n"
import type { FoodItem } from "@/lib/logic"
import type { ScanHit } from "@/lib/scan.functions"
import { useFridge } from "@/lib/store"
import { cn } from "@/lib/utils"

export type Tab = "tonight" | "fridge" | "scan" | "shop"
export type Draft = Omit<FoodItem, "id">
export type ScanRow = ScanHit & { on: boolean; expires: string; expirySource: "estimated" | "package" }

export const fieldClass =
  "h-11 w-full rounded-card border border-line bg-raised px-3 text-fg outline-none focus-visible:outline-2 focus-visible:outline-mint"

export const CUISINES = ["All", "Cantonese", "Hong Kong", "Chinese", "Western"]
export const FAVORITE_CUISINES = ["Cantonese", "Hong Kong", "Chinese", "Sichuan", "Japanese", "Korean", "Italian", "Western", "Asian", "Breakfast"]

export function useI18n() {
  const locale = useFridge((s) => s.settings.locale) || "en"
  const t = (key: UiKey, vars?: Record<string, string | number>) => translate(locale, key, vars)
  return { locale, t }
}

export function SuggestControl() {
  const { locale, t } = useI18n()
  const settings = useFridge((s) => s.settings)
  const setSettings = useFridge((s) => s.setSettings)
  const priority = settings.priority ?? (settings.suggest === "free" ? 3 : 0)
  const favorites = settings.favorites ?? []
  const keys = ["priority0", "priority1", "priority2", "priority3"] as const
  const notes = ["priorityNote0", "priorityNote1", "priorityNote2", "priorityNote3"] as const
  return (
    <div>
      <p className="text-sm font-semibold">{t(keys[priority])}</p>
      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={priority}
        aria-label={t("priorityBar")}
        aria-valuetext={t(keys[priority])}
        onChange={(e) => setSettings({ priority: Number(e.target.value) as 0 | 1 | 2 | 3 })}
        className="priority-bar w-full"
      />
      <div className="flex justify-between gap-2 text-sm text-muted">
        <span>{t("priority0")}</span>
        <span>{t("priority3")}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t(notes[priority])}</p>
      {priority > 0 && (
        <>
          <p className="mt-3 text-sm">{t("pickFavorites")}</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {FAVORITE_CUISINES.map((name) => {
              const on = favorites.includes(name)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    setSettings({
                      favorites: on ? favorites.filter((item) => item !== name) : [...favorites, name],
                    })
                  }
                  className={cn(
                    "h-11 shrink-0 rounded-full border px-3 text-sm",
                    on ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
                  )}
                >
                  {cuisineLabel(locale, name)}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}


export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n()
  const dialog = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialog.current?.querySelector<HTMLElement>("button, input, select, [tabindex]")?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current()
      if (event.key !== "Tab" || !dialog.current) return
      const focusable = [...dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = oldOverflow
      previous?.focus()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-bg/80 sm:items-center" role="presentation" onClick={onClose}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-card border border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:rounded-card sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 font-display text-2xl leading-snug">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center" aria-label={t("close")}>
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}


export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-base text-muted">
      {label}
      <span className="mt-1 block text-fg">{children}</span>
    </label>
  )
}


export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-6">
      <p className="font-display text-2xl leading-snug">{title}</p>
      <p className="mt-2 text-base leading-relaxed text-muted">{body}</p>
    </div>
  )
}


export function TastePrompt({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n()
  return (
    <section className="rounded-card border border-line bg-surface px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-snug">{t("improveSuggestions")}</h2>
          <p className="mt-1 text-base leading-relaxed text-muted">{t("improveSuggestionsBody")}</p>
        </div>
        <button type="button" onClick={onOpen} className="h-11 w-full shrink-0 rounded-card border border-line px-3 text-base font-semibold sm:w-auto">
          {t("improveSuggestions")}
        </button>
      </div>
    </section>
  )
}


export function WelcomeSheet({
  onClose,
  onManual,
  onPhoto,
  onSample,
}: {
  onClose: () => void
  onManual: () => void
  onPhoto: () => void
  onSample: () => void
}) {
  const { t } = useI18n()
  return (
    <Sheet title={t("welcomeTitle")} onClose={onClose}>
      <p className="text-base leading-relaxed text-muted">{t("welcomeBody")}</p>
      <div className="mt-5 grid gap-3">
        <button type="button" onClick={onManual} className="h-12 rounded-card bg-mint text-base font-semibold text-mint-ink">
          {t("welcomeManual")}
        </button>
        <button type="button" onClick={onPhoto} className="h-12 rounded-card border border-line text-base font-semibold">
          {t("welcomePhoto")}
        </button>
        <button type="button" onClick={onSample} className="h-12 rounded-card border border-line text-base font-semibold">
          {t("welcomeSample")}
        </button>
        <button type="button" onClick={onClose} className="h-11 text-base text-muted">
          {t("welcomeLater")}
        </button>
      </div>
    </Sheet>
  )
}

