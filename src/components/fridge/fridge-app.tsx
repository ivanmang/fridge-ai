import { useEffect, useLayoutEffect, useState } from "react"
import {
  Bell,
  Camera,
  Plus,
  Refrigerator,
  Settings,
  ShoppingBasket,
  UtensilsCrossed,
} from "lucide-react"
import { FridgeList } from "@/components/fridge/fridge-list"
import { ItemSheet, SettingsSheet } from "@/components/fridge/settings-sheet"
import { ScanPanel } from "@/components/fridge/scan-panel"
import { ShopPanel } from "@/components/fridge/shop-panel"
import { Tonight } from "@/components/fridge/tonight"
import { WelcomeSheet, useI18n, type Tab } from "@/components/fridge/shared"
import { foodLabel, translate, type Locale } from "@/lib/i18n"
import { daysUntil, todayISO, type FoodItem } from "@/lib/logic"
import { useFridge } from "@/lib/store"
import { cn } from "@/lib/utils"

const TABS: { id: Tab; icon: typeof UtensilsCrossed }[] = [
  { id: "tonight", icon: UtensilsCrossed },
  { id: "fridge", icon: Refrigerator },
  { id: "scan", icon: Camera },
  { id: "shop", icon: ShoppingBasket },
]

export function FridgeApp() {
  const [tab, setTab] = useState<Tab>("tonight")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [editing, setEditing] = useState<FoodItem | null>(null)
  const [adding, setAdding] = useState(false)
  const [openSurvey, setOpenSurvey] = useState(false)

  useLayoutEffect(() => {
    void Promise.resolve(useFridge.persist.rehydrate()).finally(() => setHydrated(true))
  }, [])

  const items = useFridge((s) => s.items)
  const settings = useFridge((s) => s.settings)
  const setSettings = useFridge((s) => s.setSettings)
  const { locale, t } = useI18n()

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-Hant" : "en"
  }, [locale])

  useEffect(() => {
    if (hydrated && !items.length && !settings.onboarded) setOnboardingOpen(true)
  }, [hydrated, items.length, settings.onboarded])

  useEffect(() => {
    if (!settings.notify) return
    const tick = () => {
      const state = useFridge.getState()
      if (!state.settings.notify) return
      const now = new Date()
      if (now.getHours() < state.settings.remindHour) return
      const day = todayISO(now)
      if (state.settings.lastPing === day) return
      const urgent = state.items.filter((item) => daysUntil(item.expires) === 0)
      if (!urgent.length) return
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const names = urgent.slice(0, 3).map((item) => foodLabel(state.settings.locale || "en", item.name))
        const extra = urgent.length - names.length
        const lang = (state.settings.locale || "en") as Locale
        const body = extra > 0 ? translate(lang, "notifyMore", { names: names.join("、"), n: extra }) : names.join(lang === "zh" ? "、" : ", ")
        new Notification(translate(lang, "notifyTitle"), { body })
        state.setSettings({ lastPing: day })
      }
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [settings.notify, settings.remindHour, locale])

  const urgentCount = items.filter((item) => daysUntil(item.expires) === 0).length

  function runSample() {
    if (items.length > 0 && !window.confirm(t("sampleReplaceConfirm"))) return
    useFridge.getState().loadSample()
  }

  if (!hydrated) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-lg place-items-center bg-bg px-5 text-fg">
        <p role="status" className="text-base text-muted">
          {t("loadingFridge")}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-bg pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] text-fg">
      <header className="flex items-start justify-between gap-3 px-5 pt-[max(1.5rem,env(safe-area-inset-top,0px))]">
        <div className="min-w-0">
          <p className="text-sm font-medium tracking-wide text-muted uppercase">{t("kicker")}</p>
          <h1 className="font-display text-4xl leading-none">FridgeAI</h1>
          <p className="mt-2 text-base tabular-nums text-muted">
            {t("stored", { n: items.length })}
            {urgentCount > 0 ? ` · ${t("useTodayCount", { n: urgentCount })}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setAdding(true)} className="grid size-11 place-items-center rounded-full border border-line bg-surface" aria-label={t("quickAdd")} title={t("quickAdd")}><Plus className="size-5" /></button>
          <button
            type="button"
            onClick={() => setSettings({ locale: locale === "zh" ? "en" : "zh" })}
            className="grid h-11 min-w-11 place-items-center rounded-full border border-line bg-surface px-3 text-base font-semibold text-fg"
            aria-label={locale === "zh" ? t("switchToEn") : t("switchToZh")}
          >
            {locale === "zh" ? "EN" : "中"}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="grid size-11 place-items-center rounded-full border border-line bg-surface text-fg"
            aria-label={t("settings")}
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      {urgentCount > 0 && tab !== "tonight" && (
        <div className="px-5">
          <button
            type="button"
            onClick={() => setTab("tonight")}
            className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left"
          >
          <Bell className="size-5 shrink-0 text-clay" />
          <span className="text-base leading-snug">
            {urgentCount === 1 ? t("bannerOne") : t("bannerMany", { n: urgentCount })}
          </span>
          </button>
        </div>
      )}

      <div className="px-5 pt-5">
        {tab === "tonight" && (
          <Tonight
            items={items}
            onAdd={() => setAdding(true)}
            onPhoto={() => setTab("scan")}
            onSample={runSample}
            openSurvey={openSurvey}
            onSurveyHandled={() => setOpenSurvey(false)}
          />
        )}
        {tab === "fridge" && <FridgeList items={items} onAdd={() => setAdding(true)} onOpen={setEditing} />}
        {tab === "scan" && <ScanPanel onManual={() => setAdding(true)} />}
        {tab === "shop" && <ShopPanel items={items} />}
      </div>

      <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((item) => {
            const Icon = item.icon
            const on = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex min-h-[4.25rem] flex-col items-center justify-center gap-1 px-1 text-sm font-medium leading-tight",
                  on ? "text-mint" : "text-muted",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="max-w-full text-center break-words">{t(item.id)}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {settingsOpen && (
        <SettingsSheet
          onClose={() => setSettingsOpen(false)}
          onEditTaste={() => {
            setSettingsOpen(false)
            setTab("tonight")
            setOpenSurvey(true)
          }}
        />
      )}
      {onboardingOpen && (
        <WelcomeSheet
          onClose={() => {
            setSettings({ onboarded: true })
            setOnboardingOpen(false)
          }}
          onManual={() => {
            setSettings({ onboarded: true })
            setOnboardingOpen(false)
            setAdding(true)
          }}
          onPhoto={() => {
            setSettings({ onboarded: true })
            setOnboardingOpen(false)
            setTab("scan")
          }}
          onSample={() => {
            setSettings({ onboarded: true })
            useFridge.getState().loadSample()
            setOnboardingOpen(false)
          }}
        />
      )}
      {adding && <ItemSheet onClose={() => setAdding(false)} />}
      {editing && <ItemSheet item={editing} onClose={() => setEditing(null)} />}
    </main>
  )
}
