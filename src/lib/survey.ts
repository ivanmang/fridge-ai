import { ZH_CUISINE } from "@/lib/zh"

export type SurveyAnswers = {
  done: boolean
  skipped?: boolean
  diet: string
  heat?: string
  pace: string
  goal: string
  people?: string
  meal?: string
  style?: string
  cuisines?: string[]
}

export const emptySurvey: SurveyAnswers = {
  done: false,
  skipped: false,
  diet: "",
  heat: "",
  pace: "",
  goal: "",
  people: "",
  meal: "",
  style: "",
  cuisines: [],
}

export function surveyReady(survey?: Partial<SurveyAnswers> | null) {
  return Boolean(survey?.done)
}

export function surveyAnswered(survey?: Partial<SurveyAnswers> | null) {
  if (!survey) return false
  if (survey.diet || survey.heat || survey.pace || survey.goal || survey.people || survey.meal || survey.style) return true
  return (survey.cuisines?.length ?? 0) > 0
}

type Choice = { id: string; en: string; zh: string }

export const SURVEY_CUISINES = [
  "Cantonese",
  "Hong Kong",
  "Chinese",
  "Sichuan",
  "Japanese",
  "Korean",
  "Italian",
  "Western",
  "Asian",
  "Breakfast",
]

export const SURVEY: {
  id: "diet" | "heat" | "pace" | "goal" | "people" | "meal" | "style"
  title: { en: string; zh: string }
  options: Choice[]
}[] = [
  {
    id: "diet",
    title: { en: "What can be in the dish?", zh: "菜裡面可以有咩？" },
    options: [
      { id: "any", en: "Anything", zh: "冇所謂" },
      { id: "vegetarian", en: "No meat or seafood", zh: "唔吃肉同海鮮" },
      { id: "pescatarian", en: "Seafood is fine, no meat", zh: "可以海鮮，唔吃肉" },
      { id: "no-seafood", en: "No seafood", zh: "唔吃海鮮" },
      { id: "no-red-meat", en: "No beef or pork", zh: "唔吃牛同豬" },
    ],
  },
  {
    id: "heat",
    title: { en: "How spicy?", zh: "幾辣？" },
    options: [
      { id: "any", en: "Any heat", zh: "辣唔辣都得" },
      { id: "mild", en: "Not spicy", zh: "唔辣" },
      { id: "little", en: "A little", zh: "少少辣" },
      { id: "medium", en: "Medium", zh: "中辣" },
      { id: "hot", en: "Hot", zh: "大辣" },
    ],
  },
  {
    id: "pace",
    title: { en: "How long do you want to cook?", zh: "想煮幾耐？" },
    options: [
      { id: "15", en: "About 15 minutes", zh: "大約 15 分鐘" },
      { id: "quick", en: "About 25 minutes", zh: "大約 25 分鐘" },
      { id: "45", en: "About 45 minutes", zh: "大約 45 分鐘" },
      { id: "either", en: "No time limit", zh: "幾耐都得" },
    ],
  },
  {
    id: "people",
    title: { en: "Who are you cooking for?", zh: "煮俾幾多人？" },
    options: [
      { id: "one", en: "Just me", zh: "自己一個" },
      { id: "two", en: "Two people", zh: "兩個人" },
      { id: "four", en: "Three or four", zh: "三四個人" },
      { id: "family", en: "A bigger family", zh: "一家人" },
    ],
  },
  {
    id: "meal",
    title: { en: "Which meal is this usually for?", zh: "通常係邊一餐？" },
    options: [
      { id: "breakfast", en: "Breakfast", zh: "早餐" },
      { id: "lunch", en: "Lunch", zh: "午餐" },
      { id: "dinner", en: "Dinner", zh: "晚餐" },
      { id: "late", en: "A late snack", zh: "宵夜" },
      { id: "any", en: "Any meal", zh: "邊餐都得" },
    ],
  },
  {
    id: "style",
    title: { en: "What kind of plate do you want?", zh: "想食邊種？" },
    options: [
      { id: "light", en: "Light", zh: "清淡" },
      { id: "everyday", en: "Everyday home cooking", zh: "家常" },
      { id: "hearty", en: "Hearty", zh: "厚味" },
      { id: "soup", en: "Soup", zh: "湯水" },
      { id: "any", en: "Either", zh: "都得" },
    ],
  },
  {
    id: "goal",
    title: { en: "What should we start from?", zh: "建議從邊度開始？" },
    options: [
      { id: "fridge", en: "Only what is in the fridge", zh: "只跟雪櫃" },
      { id: "fridge-first", en: "Fridge first", zh: "先雪櫃" },
      { id: "mix", en: "A mix", zh: "一半一半" },
      { id: "open", en: "Cuisines I like", zh: "我喜歡的菜式" },
    ],
  },
]

export function profileSummary(survey: Partial<SurveyAnswers> | null | undefined, locale: "en" | "zh") {
  if (!survey?.done || survey.skipped || !surveyAnswered(survey)) {
    return [locale === "zh" ? "未設定口味，建議保持開放。" : "No taste set. Suggestions stay open."]
  }
  const lines: string[] = []
  for (const question of SURVEY) {
    const value = survey[question.id]
    if (!value || value === "any" || value === "either") continue
    const option = question.options.find((item) => item.id === value)
    if (!option) continue
    lines.push(`${question.title[locale]} · ${locale === "zh" ? option.zh : option.en}`)
  }
  const names = (survey.cuisines ?? []).map((name) => (locale === "zh" ? (ZH_CUISINE[name] ?? name) : name))
  if (names.length) lines.push(locale === "zh" ? `喜歡 · ${names.join("、")}` : `Likes · ${names.join(", ")}`)
  if (!lines.length) return [locale === "zh" ? "每題都係開放，建議唔會收窄。" : "Everything was left open, so suggestions stay broad."]
  return lines
}
