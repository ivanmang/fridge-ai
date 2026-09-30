import { createServerFn } from "@tanstack/react-start"
import { allowRate, beginScan, clientIp, endScan } from "@/lib/rate-limit.server"
import type { ScanErrorCode } from "@/lib/scan-errors"
import { SHELF } from "@/lib/shelf"

export type ScanHit = { name: string; qty: string }

const SCAN_TIMEOUT_MS = 20_000
/** Soft per-IP hourly cap. Serverless instances do not share counters — pair with Vercel spend controls before a public URL. */
const SCAN_LIMIT_PER_HOUR = 6

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

function parseHits(text: string): ScanHit[] {
  const start = text.indexOf("[")
  const end = text.lastIndexOf("]")
  if (start < 0 || end <= start) return []
  const raw = JSON.parse(text.slice(start, end + 1)) as unknown
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 12).flatMap((row) => {
    if (!row || typeof row !== "object") return []
    const name = String((row as { name?: unknown }).name ?? "").trim()
    if (!name || name.length > 80) return []
    const qty = String((row as { qty?: unknown }).qty ?? "1").trim().slice(0, 40) || "1"
    return [{ name, qty }]
  })
}

export const scanFoods = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("needPhoto")
    const image = (input as { image?: unknown }).image
    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      throw new Error("needPhoto")
    }
    if (image.length > 1_400_000) throw new Error("tooLarge")
    return { image }
  })
  .handler(async ({ data }): Promise<{ ok: true; foods: ScanHit[] } | { ok: false; error: ScanErrorCode }> => {
    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      return { ok: false, error: "unavailable" }
    }

    const ip = clientIp()
    if (!allowRate("scan", SCAN_LIMIT_PER_HOUR, ip)) {
      return { ok: false, error: "limit" }
    }

    const slot = beginScan(ip)
    if (!slot.ok) return slot

    try {
      const names = SHELF.map((food) => food.name).join(", ")
      const res = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        signal: AbortSignal.timeout(SCAN_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          max_output_tokens: 700,
          input: [
            {
              role: "user",
              content: [
                { type: "input_image", image_url: data.image, detail: "low" },
                {
                  type: "input_text",
                  text: `List only foods you can actually see in this photo. Reply with a JSON array only, no markdown. Each object is {"name":"short English name","qty":"amount"}. Prefer these names when they fit: ${names}. Maximum 12 items. Do not invent expiry dates or foods that are not visible. If this is not food, return [].`,
                },
              ],
            },
          ],
        }),
      })

      if (!res.ok) {
        return { ok: false, error: "read" }
      }

      try {
        const foods = parseHits(extractText(await res.json()))
        return { ok: true, foods }
      } catch {
        return { ok: false, error: "parse" }
      }
    } catch (error) {
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        return { ok: false, error: "timeout" }
      }
      return { ok: false, error: "read" }
    } finally {
      endScan(ip)
    }
  })
