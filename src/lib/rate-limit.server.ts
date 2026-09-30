import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { getRequest } from "@tanstack/react-start/server"

type Bucket = { hits: number[] }

/**
 * In-memory counters keyed by IP. Also flushed to disk so soft restarts keep limits.
 * On Vercel / other serverless hosts the filesystem is ephemeral and instances do
 * not share memory — treat these limits as soft spend brakes, not a global quota.
 */
const memory = new Map<string, Bucket>()
const FILE = join(process.cwd(), ".data", "rate-limits.json")
let loaded = false
let dirty = false
let inflightScans = 0
const inflightByIp = new Map<string, number>()

const MAX_CONCURRENT_SCANS = 2
const MAX_CONCURRENT_SCANS_PER_IP = 1

function load() {
  if (loaded) return
  loaded = true
  try {
    if (!existsSync(FILE)) return
    const raw = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, number[]>
    const now = Date.now()
    for (const [ip, hits] of Object.entries(raw)) {
      const kept = (hits ?? []).filter((t) => now - t < 3_600_000)
      if (kept.length) memory.set(ip, { hits: kept })
    }
  } catch {
    // Ignore corrupt persistence; fail open to empty in-memory map.
  }
}

function saveSoon() {
  if (dirty) return
  dirty = true
  queueMicrotask(() => {
    dirty = false
    try {
      mkdirSync(dirname(FILE), { recursive: true })
      const out: Record<string, number[]> = {}
      const now = Date.now()
      for (const [ip, bucket] of memory) {
        const kept = bucket.hits.filter((t) => now - t < 3_600_000)
        if (kept.length) out[ip] = kept
      }
      writeFileSync(FILE, JSON.stringify(out))
    } catch {
      // Persistence is best-effort.
    }
  })
}

export function clientIp(): string {
  try {
    const request = getRequest()
    const headers = request?.headers
    const forwarded = headers?.get("x-forwarded-for")?.split(",")[0]?.trim()
    const real = headers?.get("x-real-ip")?.trim()
    const cf = headers?.get("cf-connecting-ip")?.trim()
    return forwarded || real || cf || "unknown"
  } catch {
    return "unknown"
  }
}

/** Sliding-window hourly limit per IP (persisted when possible). */
export function allowRate(kind: "scan" | "lookup", limit: number, ip = clientIp()): boolean {
  load()
  const key = `${kind}:${ip}`
  const now = Date.now()
  const bucket = memory.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((t) => now - t < 3_600_000)
  if (bucket.hits.length >= limit) {
    memory.set(key, bucket)
    return false
  }
  bucket.hits.push(now)
  memory.set(key, bucket)
  saveSoon()
  return true
}

export function beginScan(ip = clientIp()): { ok: true } | { ok: false; error: string } {
  if (inflightScans >= MAX_CONCURRENT_SCANS) {
    return { ok: false, error: "Another scan is already running. Try again in a moment." }
  }
  const perIp = inflightByIp.get(ip) ?? 0
  if (perIp >= MAX_CONCURRENT_SCANS_PER_IP) {
    return { ok: false, error: "Another scan is already running. Try again in a moment." }
  }
  inflightScans += 1
  inflightByIp.set(ip, perIp + 1)
  return { ok: true }
}

export function endScan(ip = clientIp()) {
  inflightScans = Math.max(0, inflightScans - 1)
  const perIp = inflightByIp.get(ip) ?? 0
  if (perIp <= 1) inflightByIp.delete(ip)
  else inflightByIp.set(ip, perIp - 1)
}
