import { useState } from "react"
import { Empty, useI18n } from "@/components/fridge/shared"
import { foodLabel, placeLabel, statusText, whenText } from "@/lib/i18n"
import { formatInventoryQty } from "@/lib/inventory-qty"
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
          className="h-12 min-w-0 flex-1 rounded-card border border-line bg-surface px-3 text-base outline-none focus-visible:outline-2 focus-visible:outline-mint"
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
              "min-h-11 shrink-0 rounded-full border px-3 py-2 text-sm",
              filter === key ? "border-mint bg-mint text-mint-ink" : "border-line bg-surface text-fg",
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
      <p className="mt-4 text-sm leading-relaxed text-muted">{t("sourceWarning")}</p>
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
                className="flex min-h-14 w-full items-start gap-3 rounded-card border border-line bg-surface px-4 py-3.5 text-left"
              >
                <span
                  className={cn(
                    "h-10 w-1 shrink-0 rounded-full",
                    status === "expired" || status === "today" ? "bg-clay" : status === "soon" ? "bg-mint" : "bg-line",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-base font-medium leading-snug">{foodLabel(locale, item.name)}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                    {formatInventoryQty(item, locale)} · {placeLabel(locale, item.location)} · {item.expirySource === "package" ? t("packageDate") : t("estimatedDate")}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-right text-sm leading-snug tabular-nums",
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

