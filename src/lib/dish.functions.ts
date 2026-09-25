import { createServerFn } from "@tanstack/react-start"
import type { Recipe } from "@/lib/recipes"

export type LookedUpDish = Recipe

const hits: number[] = []

function allowLookup() {
  const now = Date.now()
  while (hits.length && now - hits[0] > 3_600_000) hits.shift()
  if (hits.length >= 20) return false
  hits.push(now)
  return true
}

function extractText(body: unknown) {
  if (!body || typeof body !== "object") return ""
  const record = body as Record<string, unknown>
  if (typeof record.output_text === "string") return record.output_text
  const chunks: string[] = []
  if (Array.isArray(record.output)) {
    for (const item of record.output) {
      if (!item || typeof item !== "object") continue
      const block = item as { text?: unknown; content?: unknown }
      if (typeof block.text === "string") chunks.push(block.text)
      if (!Array.isArray(block.content)) continue
      for (const part of block.content) {
        if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
          chunks.push((part as { text: string }).text)
        }
      }
    }
  }
  if (chunks.length) return chunks.join("\n")
  const choices = record.choices as Array<{ message?: { content?: unknown } }> | undefined
  const content = choices?.[0]?.message?.content
  return typeof content === "string" ? content : ""
}

function asList(value: unknown, max: number) {
  if (!Array.isArray(value)) return []
  return value
    .slice(0, max)
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 0 && item.length <= 40)
}

function idFor(name: string) {
  let hash = 0
  for (const char of name.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return `x-${hash.toString(36)}`
}

function parseDishes(text: string): LookedUpDish[] {
  const start = text.indexOf("[")
  const end = text.lastIndexOf("]")
  if (start < 0 || end <= start) return []
  const raw = JSON.parse(text.slice(start, end + 1)) as unknown
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 4).flatMap((row) => {
    if (!row || typeof row !== "object") return []
    const record = row as Record<string, unknown>
    const name = String(record.name ?? "").trim()
    if (!name || name.length > 60) return []
    const need = asList(record.need, 8)
    if (!need.length) return []
    const time = Number(record.time)
    return [
      {
        id: idFor(name),
        name,
        cuisine: String(record.cuisine ?? "Home").trim().slice(0, 24) || "Home",
        time: Number.isFinite(time) ? Math.min(180, Math.max(5, Math.round(time))) : 30,
        servings: 2,
        need,
        optional: asList(record.optional, 4),
        steps: asList(record.steps, 5),
      },
    ]
  })
}

export const lookupDishes = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Bad request")
    const query = String((input as { query?: unknown }).query ?? "").trim()
    if (query.length < 2 || query.length > 60) throw new Error("Bad request")
    const vegetarian = Boolean((input as { vegetarian?: unknown }).vegetarian)
    const locale = (input as { locale?: unknown }).locale === "zh" ? "zh" : "en"
    return { query, vegetarian, locale }
  })
  .handler(async ({ data }): Promise<{ ok: true; dishes: LookedUpDish[] } | { ok: false; error: string }> => {
    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) return { ok: true, dishes: [] }
    if (!allowLookup()) return { ok: false, error: "limit" }

    const language = data.locale === "zh" ? "Traditional Chinese (Hong Kong)" : "English"
    const diet = data.vegetarian ? "Vegetarian only. No meat, poultry, or seafood." : "Meat is allowed."
    const res = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(12_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_output_tokens: 500,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `The person is searching for a dish to cook: "${data.query}". Suggest up to 3 real home-cooking dishes that match and are not the same dish repeated. ${diet} Reply with a JSON array only, no markdown. Each object is {"name":"dish name in ${language}","cuisine":"short cuisine","time":25,"need":["English grocery ingredient"],"optional":[],"steps":["short step"]}. 3 to 5 ingredients in need.`,
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) return { ok: false, error: "lookup" }
    try {
      return { ok: true, dishes: parseDishes(extractText(await res.json())) }
    } catch {
      return { ok: false, error: "lookup" }
    }
  })
