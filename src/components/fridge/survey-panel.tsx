import { useState } from "react"
import { cuisineLabel, translate, type Locale } from "@/lib/i18n"
import { emptySurvey, profileSummary, SURVEY, SURVEY_CUISINES, surveyAnswered, type SurveyAnswers } from "@/lib/survey"
import { useFridge } from "@/lib/store"
import { cn } from "@/lib/utils"

export function TasteProfile({ onEdit }: { onEdit: () => void }) {
  const locale = (useFridge((s) => s.settings.locale) || "en") as Locale
  const survey = useFridge((s) => s.settings.survey)
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const lines = profileSummary(survey, locale)

  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">{t("profileTitle")}</h2>
        <button type="button" onClick={onEdit} className="h-11 shrink-0 rounded-card border border-line px-3 text-sm font-semibold">
          {t("profileChange")}
        </button>
      </div>
      <ul className="mt-3 space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-sm text-muted">
            {line}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SurveyPanel({ onDone }: { onDone?: () => void }) {
  const locale = (useFridge((s) => s.settings.locale) || "en") as Locale
  const saved = useFridge((s) => s.settings.survey)
  const setSettings = useFridge((s) => s.setSettings)
  const [draft, setDraft] = useState<SurveyAnswers>({ ...emptySurvey, ...saved, done: false, skipped: false })
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const cuisines = draft.cuisines ?? []

  function finish() {
    const answered = surveyAnswered(draft)
    setSettings({
      survey: { ...draft, cuisines, done: true, skipped: !answered },
      ...(draft.diet ? { vegetarian: draft.diet === "vegetarian" } : {}),
      favorites: cuisines,
      ...(draft.goal === "open"
        ? { priority: 3 as const }
        : draft.goal === "mix"
          ? { priority: 2 as const }
          : draft.goal === "fridge-first"
            ? { priority: 1 as const }
            : draft.goal === "fridge"
              ? { priority: 0 as const }
              : {}),
    })
    onDone?.()
  }

  function skip() {
    setSettings({
      survey: { ...emptySurvey, done: true, skipped: true },
    })
    onDone?.()
  }

  function toggleCuisine(name: string) {
    setDraft({
      ...draft,
      cuisines: cuisines.includes(name) ? cuisines.filter((item) => item !== name) : [...cuisines, name],
    })
  }

  return (
    <section className="space-y-4 rounded-card border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl">{t("surveyLead")}</h2>
        <button type="button" onClick={skip} className="h-11 shrink-0 rounded-card border border-line px-3 text-sm font-semibold">
          {t("surveySkip")}
        </button>
      </div>
      {SURVEY.map((question) => (
        <div key={question.id}>
          <p className="text-sm font-medium">{question.title[locale]}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDraft({ ...draft, [question.id]: "" })}
              className={cn(
                "h-11 rounded-full border px-3 text-sm",
                !draft[question.id] ? "border-mint bg-mint font-semibold text-mint-ink" : "border-line bg-raised text-fg",
              )}
            >
              {t("surveySkipQuestion")}
            </button>
            {question.options.map((option) => {
              const on = draft[question.id] === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, [question.id]: option.id })}
                  className={cn(
                    "h-11 rounded-full border px-3 text-sm",
                    on ? "border-mint bg-mint font-semibold text-mint-ink" : "border-line bg-raised text-fg",
                  )}
                >
                  {locale === "zh" ? option.zh : option.en}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <div>
        <p className="text-sm font-medium">{t("surveyCuisines")}</p>
        <p className="mt-1 text-sm text-muted">{t("surveyCuisinesHint")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDraft({ ...draft, cuisines: [] })}
            className={cn(
              "h-11 rounded-full border px-3 text-sm",
              cuisines.length === 0 ? "border-mint bg-mint font-semibold text-mint-ink" : "border-line bg-raised text-fg",
            )}
          >
            {t("surveySkipQuestion")}
          </button>
          {SURVEY_CUISINES.map((name) => {
            const on = cuisines.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleCuisine(name)}
                className={cn(
                  "h-11 rounded-full border px-3 text-sm",
                  on ? "border-mint bg-mint font-semibold text-mint-ink" : "border-line bg-raised text-fg",
                )}
              >
                {cuisineLabel(locale, name)}
              </button>
            )
          })}
        </div>
      </div>
      <button type="button" onClick={finish} className="h-11 w-full rounded-card bg-mint font-semibold text-mint-ink">
        {t("surveySee")}
      </button>
    </section>
  )
}
