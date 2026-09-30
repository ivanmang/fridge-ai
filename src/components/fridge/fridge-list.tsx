import { useState } from "react"
import { Empty, useI18n } from "@/components/fridge/shared"
import { foodLabel, placeLabel, statusText, whenText } from "@/lib/i18n"
import { daysUntil, statusOf, type FoodItem, type ItemStatus } from "@/lib/logic"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

export function FridgeList({
  items,
  onAdd,
  onOpen,
}: {
  items: FoodItem[]
  onAdd: () => void
  onOpen: (item: FoodItem) => void
}) {
  const { locale, t } = useI18n()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | ItemStatus>("all")
  const q = query.trim().toLowerCase()
  const shown = items
    .filter((item) => (filter === "all" ? true : statusOf(item.expires) === filter))
    .filter((item) => item.name.toLowerCase().includes(q) || foodLabel(locale, item.name).toLowerCase().includes(q))
    .slice()
    .sort((a, b) => a.expires.localeCompare(b.expires))

  return (
    <section>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="h-11 min-w-0 flex-1 rounded-card border border-line bg-surface px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-mint"
        />
        <button
          type="button"
          onClick={onAdd}
          className="grid size-11 shrink-0 place-items-center rounded-card bg-mint text-mint-ink"
          aria-label={t("addFood")}
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
            {key === "all" ? t("all") : statusText(locale, key)}
          </button>
        ))}
      </div>
      {!shown.length && (
        <Empty
          title={items.length ? t("filterEmpty") : t("noneStored")}
          body={items.length ? t("clearSearch") : t("addOrScan")}
        />
      )}
      <p className="mt-4 text-xs text-muted">{t("sourceWarning")}</p>
      <ul className="mt-4 space-y-2">
        {shown.map((item, index) => {
          const status = statusOf(item.expires)
          const urgent = daysUntil(item.expires) <= 3
          const previousUrgent = index > 0 && daysUntil(shown[index - 1].expires) <= 3
          return (
            <li key={item.id}>
              {(index === 0 || previousUrgent !== urgent) && <h2 className="pb-2 font-display text-xl">{urgent ? t("useOrReplace") : t("fresh")}</h2>}
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
                  <span className="block truncate font-medium">{foodLabel(locale, item.name)}</span>
                  <span className="block text-sm text-muted">
                    {item.qty} · {placeLabel(locale, item.location)} · {item.expirySource === "package" ? t("packageDate") : t("estimatedDate")}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-right text-sm tabular-nums",
                    status === "expired" || status === "today" ? "text-clay" : "text-muted",
                  )}
                >
                  <span className="block">{status === "expired" && item.expirySource !== "package" ? t("pastEstimate") : statusText(locale, status)}</span>
                  <span className="block">{whenText(locale, item.expires)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

